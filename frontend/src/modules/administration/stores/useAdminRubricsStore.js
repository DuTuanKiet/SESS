import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useToastStore } from '@/stores/toast';

/**
 * Store Pinia quản lý trạng thái nghiệp vụ Bộ tiêu chí đánh giá (Rubrics)
 */
export const useAdminRubricsStore = defineStore('adminRubrics', () => {
  const toastStore = useToastStore();

  // Khởi tạo state rỗng (chờ kết nối BE)
  const rubrics = ref([]);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  // Chế độ hiển thị: 'grid' (danh sách thẻ) hoặc 'detail' (chi tiết 1 bộ tiêu chí)
  const viewMode = ref('grid');
  const selectedRubricId = ref('');

  // Bộ lọc tìm kiếm & trạng thái
  const filters = reactive({
    keyword: '',
    status: 'ALL',
  });

  // Thông báo toast tiện ích
  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  // Đảm bảo cấu trúc mảng hợp lệ khi khởi tạo
  function initialize() {
    if (!Array.isArray(rubrics.value)) {
      rubrics.value = [];
    }
  }

  // Thống kê KPI tổng quan
  const kpiStats = computed(() => {
    const list = rubrics.value || [];
    return {
      total: list.length,
      active: list.filter((r) => r.status === 'Active').length,
      draft: list.filter((r) => r.status === 'Draft').length,
      deprecated: list.filter((r) => r.status === 'Deprecated').length,
    };
  });

  // Danh sách đã lọc theo từ khóa và trạng thái
  const filteredRubrics = computed(() => {
    const list = rubrics.value || [];
    const kw = filters.keyword.trim().toLowerCase();
    const st = filters.status;

    return list.filter((r) => {
      const matchStatus = st === 'ALL' || !st || r.status === st;
      const matchKeyword =
        !kw ||
        r.name.toLowerCase().includes(kw) ||
        String(r.version).includes(kw) ||
        (r.description && r.description.toLowerCase().includes(kw));
      return matchStatus && matchKeyword;
    });
  });

  // Bộ tiêu chí đang được chọn trong Detail View
  const selectedRubric = computed(() => {
    const list = rubrics.value || [];
    return list.find((r) => r.id === selectedRubricId.value) || list[0] || null;
  });

  // Tổng trọng số của bộ tiêu chí đang chọn
  const selectedRubricTotalWeight = computed(() => {
    if (!selectedRubric.value || !Array.isArray(selectedRubric.value.criteria)) return 0;
    return selectedRubric.value.criteria.reduce(
      (sum, c) => sum + (Number(c.weight) || 0),
      0
    );
  });

  // Kiểm tra bộ tiêu chí đã hoàn thiện đủ 100% trọng số chưa
  const isSelectedRubricComplete = computed(() => selectedRubricTotalWeight.value === 100);

  // Kiểm tra bộ tiêu chí có cho phép chỉnh sửa không (không cho phép nếu đã Deprecated)
  const isSelectedRubricEditable = computed(
    () => selectedRubric.value?.status !== 'Deprecated'
  );

  // Kiểm tra xem có bộ lọc nào đang được kích hoạt hay không
  const hasFilters = computed(
    () => Boolean(filters.keyword.trim()) || (filters.status && filters.status !== 'ALL')
  );

  // Điều hướng giữa Grid và Detail
  function openDetail(id) {
    selectedRubricId.value = id;
    viewMode.value = 'detail';
  }

  function backToGrid() {
    viewMode.value = 'grid';
  }

  function clearFilters() {
    filters.keyword = '';
    filters.status = 'ALL';
  }

  // Thêm bộ tiêu chí mới
  function createRubric({ name, description }) {
    isSubmitting.value = true;
    try {
      const newId = `r${Date.now()}`;
      const newRubric = {
        id: newId,
        name: name.trim(),
        version: 1,
        status: 'Draft',
        description: (description || '').trim(),
        criteria: [],
      };
      rubrics.value.unshift(newRubric);
      notify(`Đã tạo mới bộ tiêu chí «${newRubric.name}» (Bản nháp).`);
      return newRubric;
    } finally {
      isSubmitting.value = false;
    }
  }

  // Cập nhật thông tin cơ bản bộ tiêu chí
  function updateRubric(id, { name, description }) {
    isSubmitting.value = true;
    try {
      const target = rubrics.value.find((r) => r.id === id);
      if (!target) return;
      target.name = name.trim();
      target.description = (description || '').trim();
      notify(`Đã cập nhật thông tin bộ tiêu chí «${target.name}».`);
    } finally {
      isSubmitting.value = false;
    }
  }

  // Kích hoạt áp dụng bộ tiêu chí
  function activateRubric(id) {
    const target = rubrics.value.find((r) => r.id === id);
    if (!target) return false;

    const total = (target.criteria || []).reduce(
      (sum, c) => sum + (Number(c.weight) || 0),
      0
    );

    if (total !== 100) {
      notify('Tổng trọng số phải đạt đủ 100% trước khi kích hoạt.', 'error');
      return false;
    }

    // Đánh dấu các phiên bản cùng tên trước đó là Deprecated
    rubrics.value.forEach((r) => {
      if (r.id !== target.id && r.name === target.name && r.status === 'Active') {
        r.status = 'Deprecated';
      }
    });

    target.status = 'Active';
    notify(`Đã kích hoạt bộ tiêu chí «${target.name} v${target.version}» thành công.`);
    return true;
  }

  // Thêm tiêu chí con vào bộ tiêu chí
  function addCriterion(rubricId, criterionData) {
    const target = rubrics.value.find((r) => r.id === rubricId);
    if (!target) return;

    const newCriterion = {
      id: `c-${Date.now()}`,
      name: criterionData.name.trim(),
      desc: (criterionData.desc || '').trim(),
      weight: Number(criterionData.weight) || 0,
      min: Number(criterionData.min) ?? 0,
      max: Number(criterionData.max) ?? 10,
    };

    target.criteria.push(newCriterion);
    notify(`Đã thêm tiêu chí «${newCriterion.name}».`);
  }

  // Cập nhật tiêu chí con
  function updateCriterion(rubricId, criterionId, criterionData) {
    const target = rubrics.value.find((r) => r.id === rubricId);
    if (!target) return;

    const cIdx = target.criteria.findIndex((c) => c.id === criterionId);
    if (cIdx === -1) return;

    target.criteria[cIdx] = {
      ...target.criteria[cIdx],
      name: criterionData.name.trim(),
      desc: (criterionData.desc || '').trim(),
      weight: Number(criterionData.weight) || 0,
      min: Number(criterionData.min) ?? 0,
      max: Number(criterionData.max) ?? 10,
    };

    notify(`Đã cập nhật tiêu chí «${criterionData.name}».`);
  }

  // Xóa tiêu chí con
  function deleteCriterion(rubricId, criterionId) {
    const target = rubrics.value.find((r) => r.id === rubricId);
    if (!target || target.status === 'Deprecated') return;

    const cIdx = target.criteria.findIndex((c) => c.id === criterionId);
    if (cIdx === -1) return;

    const removed = target.criteria.splice(cIdx, 1)[0];
    notify(`Đã xóa tiêu chí «${removed.name}».`);
  }

  // Tải file mẫu CSV
  function downloadTemplate() {
    const headers = ['STT', 'Tên tiêu chí', 'Mô tả', 'Trọng số (%)', 'Điểm tối thiểu', 'Điểm tối đa'];
    const sampleRows = [
      ['1', 'Tính mới & sáng tạo', 'Mức độ đột phá và độc đáo', '30', '0', '10'],
      ['2', 'Tính khả thi', 'Nguồn lực, lộ trình kỹ thuật', '25', '0', '10'],
      ['3', 'Mô hình kinh doanh', 'Doanh thu, thị trường mục tiêu', '25', '0', '10'],
      ['4', 'Năng lực đội ngũ', 'Phân bổ vai trò thành viên', '20', '0', '10'],
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mau-nhap-bo-tieu-chi.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    notify('Đã tải xuống file CSV mẫu.');
  }

  // Xuất danh sách tiêu chí ra file CSV
  function exportRubricCsv(rubricId) {
    const rubric = rubrics.value.find((r) => r.id === rubricId) || selectedRubric.value;
    if (!rubric) return;

    if (!rubric.criteria || !rubric.criteria.length) {
      notify('Bộ tiêu chí hiện chưa có tiêu chí nào để xuất.', 'warning');
      return;
    }

    const safeName = rubric.name.toLowerCase().replace(/[^a-z0-9]/gi, '-');
    const fileName = `bo-tieu-chi-${safeName}-v${rubric.version}.csv`;
    const headers = ['STT', 'Tên tiêu chí', 'Mô tả', 'Trọng số (%)', 'Điểm tối thiểu', 'Điểm tối đa'];
    const rows = rubric.criteria.map((c, idx) => [
      String(idx + 1),
      c.name || '',
      c.desc || '',
      String(c.weight || 0),
      String(c.min ?? 0),
      String(c.max ?? 10),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    notify(`Đã xuất ${rubric.criteria.length} tiêu chí ra file ${fileName}.`);
  }

  return {
    rubrics,
    isLoading,
    isSubmitting,
    errorMessage,
    viewMode,
    selectedRubricId,
    filters,
    kpiStats,
    filteredRubrics,
    selectedRubric,
    selectedRubricTotalWeight,
    isSelectedRubricComplete,
    isSelectedRubricEditable,
    hasFilters,
    initialize,
    openDetail,
    backToGrid,
    clearFilters,
    createRubric,
    updateRubric,
    activateRubric,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    downloadTemplate,
    exportRubricCsv,
  };
});

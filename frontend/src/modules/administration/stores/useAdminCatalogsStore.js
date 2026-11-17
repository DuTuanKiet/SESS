import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToastStore } from '@/stores/toast';
import {
  EMAIL_REGEX,
  EVIDENCE_SCOPE_META,
} from '@/modules/administration/constants/adminConstants';
import { createInitialCatalogsMockState } from '@/modules/administration/mocks/adminCatalogsMockData';
import {
  formatProjectTimestamp,
  slicePaginatedItems,
} from '@/modules/administration/utils/projectManagementHelpers';
import { useAdminCompetitionsStore } from '@/modules/administration/stores/useAdminCompetitionsStore';
import { useAdminMentorAssignmentsStore } from '@/modules/administration/stores/useAdminMentorAssignmentsStore';
import { useAdminProjectsStore } from '@/modules/administration/stores/useAdminProjectsStore';
import { useAdminUsersStore } from '@/modules/administration/stores/useAdminUsersStore';

const VALID_CATALOG_TABS = new Set(['catalog-categories', 'catalog-evidences', 'catalog-faculties']);

// Store SSOT quản lý Danh mục dữ liệu (Thể loại, Minh chứng, Khoa), đồng bộ trực tiếp sang Cuộc thi, Dự án và Người dùng
export const useAdminCatalogsStore = defineStore('adminCatalogs', () => {
  const toastStore = useToastStore();

  // Mặc định vận hành bằng mock state tĩnh theo yêu cầu không kết nối Backend
  const isLiveApiEnabled = ref(false);
  const rawState = ref(createInitialCatalogsMockState());

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref('');
  const activeTab = ref('catalog-categories');

  const categoryFilters = reactive({
    keyword: '',
    competitionId: '',
    status: '',
  });

  const evidenceFilters = reactive({
    keyword: '',
    competitionId: '',
    scope: '',
  });

  const facultyFilters = reactive({
    keyword: '',
  });

  const pagination = reactive({
    categories: { page: 1, pageSize: 5 },
    evidences: { page: 1, pageSize: 5 },
    faculties: { page: 1, pageSize: 5 },
  });

  const localAuditLogs = ref([]);

  // Resolve các store liên quan theo kiểu lazy bên trong getter/action để giữ đồ thị phụ thuộc một chiều, tránh vòng lặp khởi tạo Pinia
  function resolveCompetitionsStore() {
    return useAdminCompetitionsStore();
  }

  function resolveProjectsStore() {
    return useAdminProjectsStore();
  }

  function resolveUsersStore() {
    return useAdminUsersStore();
  }

  function resolveMentorStore() {
    return useAdminMentorAssignmentsStore();
  }

  const projectCategories = computed(() => rawState.value.projectCategories || []);
  const evidenceTypes = computed(() => rawState.value.evidenceTypes || []);
  const faculties = computed(() => rawState.value.faculties || []);

  const activeCategories = computed(() => projectCategories.value.filter((item) => item.isActive));
  const activeEvidenceTypes = computed(() => evidenceTypes.value.filter((item) => item.isActive));
  const activeFaculties = computed(() => faculties.value.filter((item) => item.isActive));

  const activeCategoriesCount = computed(() => activeCategories.value.length);
  const activeEvidenceTypesCount = computed(() => activeEvidenceTypes.value.length);
  const activeFacultiesCount = computed(() => activeFaculties.value.length);

  const competitionOptions = computed(() => resolveCompetitionsStore().competitions || []);

  const competitionByIdMap = computed(() => {
    const map = new Map();
    competitionOptions.value.forEach((comp) => {
      if (comp?.id) map.set(comp.id, comp);
    });
    return map;
  });

  const hasCategoryFilters = computed(() =>
    Boolean(
      categoryFilters.keyword.trim() || categoryFilters.competitionId || categoryFilters.status
    )
  );

  const hasEvidenceFilters = computed(() =>
    Boolean(
      evidenceFilters.keyword.trim() || evidenceFilters.competitionId || evidenceFilters.scope
    )
  );

  const hasFacultyFilters = computed(() => Boolean(facultyFilters.keyword.trim()));

  const filteredCategories = computed(() => {
    const keyword = categoryFilters.keyword.trim().toLowerCase();
    const compId = categoryFilters.competitionId;
    const status = categoryFilters.status;

    return projectCategories.value.filter((cat) => {
      const matchKeyword =
        !keyword ||
        `${cat.code} ${cat.name} ${cat.description || ''}`.toLowerCase().includes(keyword);
      const matchComp =
        !compId ||
        (!cat.competitionIds?.length
          ? cat.isGlobal !== false
          : cat.competitionIds.includes(compId));
      const matchStatus = !status || (status === 'active' ? cat.isActive : !cat.isActive);
      return matchKeyword && matchComp && matchStatus;
    });
  });

  const paginatedCategories = computed(() =>
    slicePaginatedItems(
      filteredCategories.value,
      pagination.categories.page,
      pagination.categories.pageSize
    )
  );

  const filteredEvidenceTypes = computed(() => {
    const keyword = evidenceFilters.keyword.trim().toLowerCase();
    const compId = evidenceFilters.competitionId;
    const scope = evidenceFilters.scope;

    return evidenceTypes.value.filter((ev) => {
      const matchKeyword =
        !keyword || `${ev.code} ${ev.name} ${ev.formats || ''}`.toLowerCase().includes(keyword);
      const matchComp =
        !compId || !ev.competitionIds?.length || ev.competitionIds.includes(compId);
      const matchScope = !scope || ev.scope === scope;
      return matchKeyword && matchComp && matchScope;
    });
  });

  const paginatedEvidenceTypes = computed(() =>
    slicePaginatedItems(
      filteredEvidenceTypes.value,
      pagination.evidences.page,
      pagination.evidences.pageSize
    )
  );

  const filteredFaculties = computed(() => {
    const keyword = facultyFilters.keyword.trim().toLowerCase();
    return faculties.value.filter((fac) => {
      if (!keyword) return true;
      return `${fac.code} ${fac.name} ${fac.contactEmail || ''}`.toLowerCase().includes(keyword);
    });
  });

  const paginatedFaculties = computed(() =>
    slicePaginatedItems(
      filteredFaculties.value,
      pagination.faculties.page,
      pagination.faculties.pageSize
    )
  );

  const categoryProjectCountsMap = computed(() => {
    const map = new Map();
    const projects = resolveProjectsStore().projects || [];
    const compId = categoryFilters.competitionId;

    projectCategories.value.forEach((cat) => {
      const count = projects.filter(
        (proj) => proj.category === cat.name && (!compId || proj.competitionId === compId)
      ).length;
      map.set(cat.id, count);
    });
    return map;
  });

  const facultyStatsMap = computed(() => {
    const map = new Map();
    const competitions = competitionOptions.value;
    const projects = resolveProjectsStore().projects || [];
    const studentWhitelist = resolveUsersStore().studentWhitelist || [];

    faculties.value.forEach((fac) => {
      const projectCount = projects.filter((proj) => proj.faculty === fac.name).length;
      const studentCount = studentWhitelist.filter((sv) => sv.faculty === fac.name).length;
      const hostedCount = competitions.filter(
        (comp) => comp.level === 'FACULTY' && comp.hostFaculty === fac.name
      ).length;
      const joinedComps = competitions.filter(
        (comp) =>
          Array.isArray(comp.participatingFaculties) &&
          comp.participatingFaculties.includes(fac.name)
      );

      map.set(fac.id, {
        projectCount,
        studentCount,
        hostedCount,
        joinedComps,
      });
    });

    return map;
  });

  function clampPage(kind, totalItems) {
    const pager = pagination[kind];
    if (!pager) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pager.pageSize)));
    if (pager.page > totalPages) {
      pager.page = totalPages;
    }
  }

  watch(
    () => filteredCategories.value.length,
    (total) => clampPage('categories', total)
  );
  watch(
    () => filteredEvidenceTypes.value.length,
    (total) => clampPage('evidences', total)
  );
  watch(
    () => filteredFaculties.value.length,
    (total) => clampPage('faculties', total)
  );

  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  function appendLocalAudit({ targetId, summary, oldValues = null, newValues = null }) {
    localAuditLogs.value.unshift({
      id: `al-cat-${Date.now()}`,
      timestamp: formatProjectTimestamp(new Date()),
      action: 'CATALOG_UPDATE',
      targetEntity: 'Catalogs',
      targetId,
      summary,
      oldValues,
      newValues,
    });
  }

  function setActiveTab(tabKey) {
    if (!VALID_CATALOG_TABS.has(tabKey)) return;
    activeTab.value = tabKey;
  }

  function jumpFromKpi(tabKey) {
    setActiveTab(tabKey);
  }

  function setCategoryFilter(key, value) {
    if (!(key in categoryFilters)) return;
    categoryFilters[key] = String(value ?? '');
    pagination.categories.page = 1;
  }

  function resetCategoryFilters() {
    categoryFilters.keyword = '';
    categoryFilters.competitionId = '';
    categoryFilters.status = '';
    pagination.categories.page = 1;
  }

  function setEvidenceFilter(key, value) {
    if (!(key in evidenceFilters)) return;
    evidenceFilters[key] = String(value ?? '');
    pagination.evidences.page = 1;
  }

  function resetEvidenceFilters() {
    evidenceFilters.keyword = '';
    evidenceFilters.competitionId = '';
    evidenceFilters.scope = '';
    pagination.evidences.page = 1;
  }

  function setFacultyFilter(keyword) {
    facultyFilters.keyword = String(keyword ?? '');
    pagination.faculties.page = 1;
  }

  function resetFacultyFilters() {
    facultyFilters.keyword = '';
    pagination.faculties.page = 1;
  }

  function setPage(kind, nextPage) {
    if (!pagination[kind]) return;
    pagination[kind].page = Math.max(1, Number(nextPage) || 1);
  }

  function setPageSize(kind, nextSize) {
    if (!pagination[kind]) return;
    pagination[kind].pageSize = Math.max(1, Number(nextSize) || 5);
    pagination[kind].page = 1;
  }

  function getCompetitionCategories(compId, includeInactive = false) {
    return projectCategories.value.filter((cat) => {
      if (!includeInactive && !cat.isActive) return false;
      if (!compId) return true;
      if (!cat.competitionIds || !cat.competitionIds.length) return cat.isGlobal !== false;
      return cat.competitionIds.includes(compId);
    });
  }

  function getCompetitionEvidenceTypes(compId, includeInactive = false) {
    return evidenceTypes.value.filter(
      (ev) =>
        (includeInactive || ev.isActive) &&
        (!compId || !ev.competitionIds?.length || ev.competitionIds.includes(compId))
    );
  }

  function syncCompetitionCategories(compId, selectedCatIds, allCompetitions = []) {
    const selectedSet = new Set(selectedCatIds || []);
    const allOtherIds = allCompetitions.map((c) => c.id).filter((id) => id !== compId);

    rawState.value.projectCategories.forEach((cat) => {
      const isGlobal = !cat.competitionIds?.length && cat.isGlobal !== false;
      if (selectedSet.has(cat.id)) {
        if (isGlobal) return;
        cat.competitionIds = Array.isArray(cat.competitionIds) ? [...cat.competitionIds] : [];
        if (!cat.competitionIds.includes(compId)) cat.competitionIds.push(compId);
        return;
      }
      if (isGlobal) {
        cat.competitionIds = [...allOtherIds];
        cat.isGlobal = false;
      } else {
        cat.competitionIds = (cat.competitionIds || []).filter((id) => id !== compId);
        if (!cat.competitionIds.length) cat.isGlobal = false;
      }
    });
  }

  function replaceCatalogData({
    faculties: nextFaculties,
    projectCategories: nextCategories,
    evidenceTypes: nextEvidences,
  } = {}) {
    if (Array.isArray(nextFaculties) && nextFaculties.length) {
      rawState.value.faculties = nextFaculties;
    }
    if (Array.isArray(nextCategories) && nextCategories.length) {
      rawState.value.projectCategories = nextCategories;
    }
    if (Array.isArray(nextEvidences) && nextEvidences.length) {
      rawState.value.evidenceTypes = nextEvidences;
    }
  }

  async function loadCatalogs({ silent = true } = {}) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      // Giữ trạng thái thuần mock trên FE theo yêu cầu không kết nối Backend
      if (!silent) {
        notify('Đã làm mới danh mục dữ liệu.', 'success');
      }
    } catch (error) {
      errorMessage.value = error?.message || 'Không thể tải danh mục dữ liệu.';
      notify(errorMessage.value, 'error');
    } finally {
      isLoading.value = false;
    }
  }

  async function saveCategory(categoryId, payload = {}) {
    const code = String(payload.code || '')
      .trim()
      .toUpperCase();
    const name = String(payload.name || '').trim();
    if (!code || !name) {
      notify('Vui lòng nhập đầy đủ mã và tên thể loại.', 'warning');
      return false;
    }

    const existing = categoryId
      ? rawState.value.projectCategories.find((item) => item.id === categoryId)
      : null;

    if (
      rawState.value.projectCategories.some(
        (item) => item.id !== (existing?.id || '') && item.code.toUpperCase() === code
      )
    ) {
      notify(`Mã thể loại «${code}» đã tồn tại.`, 'warning');
      return false;
    }

    const description = String(payload.description || '').trim();
    const competitionIds = Array.isArray(payload.competitionIds)
      ? Array.from(new Set(payload.competitionIds.map(String).filter(Boolean)))
      : [];
    const isGlobal = competitionIds.length === 0;

    isSubmitting.value = true;
    try {
      if (existing) {
        const oldName = existing.name;
        const oldCode = existing.code;
        existing.code = code;
        existing.name = name;
        existing.description = description;
        existing.competitionIds = competitionIds;
        existing.isGlobal = isGlobal;

        if (oldName !== name) {
          resolveProjectsStore().syncCatalogRename({ kind: 'category', oldName, newName: name });
          resolveCompetitionsStore().syncCatalogRename({ kind: 'category', oldName, newName: name });
          resolveMentorStore().syncCatalogRename({ kind: 'category', oldName, newName: name });
        }

        appendLocalAudit({
          targetId: code,
          summary: `Cập nhật thể loại đề tài «${name}»`,
          oldValues: { code: oldCode, name: oldName },
          newValues: { code, name, competitionIds, isGlobal },
        });
      } else {
        rawState.value.projectCategories.unshift({
          id: `cat-${Date.now()}`,
          code,
          name,
          description,
          competitionIds,
          isGlobal,
          isActive: true,
        });
        pagination.categories.page = 1;

        appendLocalAudit({
          targetId: code,
          summary: `Thêm thể loại đề tài mới «${name}»`,
          oldValues: null,
          newValues: { code, name, competitionIds, isGlobal },
        });
      }

      notify(`Đã lưu thể loại «${name}» (mô phỏng).`, 'success');
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveEvidenceType(evidenceId, payload = {}) {
    const code = String(payload.code || '').trim();
    const name = String(payload.name || '').trim();
    if (!code || !name) {
      notify('Vui lòng nhập mã key và tên loại minh chứng.', 'warning');
      return false;
    }

    const existing = evidenceId
      ? rawState.value.evidenceTypes.find((item) => item.id === evidenceId)
      : null;

    if (
      rawState.value.evidenceTypes.some(
        (item) =>
          item.id !== (existing?.id || '') && item.code.toLowerCase() === code.toLowerCase()
      )
    ) {
      notify(`Mã key minh chứng «${code}» đã tồn tại.`, 'warning');
      return false;
    }

    const parsedMaxSize =
      payload.maxSizeMb === '' || payload.maxSizeMb === null || payload.maxSizeMb === undefined
        ? NaN
        : Number(payload.maxSizeMb);

    const cleanPayload = {
      code,
      name,
      scope: EVIDENCE_SCOPE_META[payload.scope] ? payload.scope : 'ROUND',
      requiredLabel: String(payload.requiredLabel || 'Tùy chọn').trim() || 'Tùy chọn',
      formats: String(payload.formats || '.pdf').trim() || '.pdf',
      maxSizeMb: Number.isFinite(parsedMaxSize) ? Math.max(1, parsedMaxSize) : 10,
      competitionIds: Array.isArray(payload.competitionIds)
        ? Array.from(new Set(payload.competitionIds.map(String).filter(Boolean)))
        : [],
      description: String(payload.description || '').trim(),
    };

    isSubmitting.value = true;
    try {
      if (existing) {
        const oldCode = existing.code;
        const oldName = existing.name;
        Object.assign(existing, cleanPayload);

        if (oldCode !== code || oldName !== name) {
          resolveCompetitionsStore().syncCatalogRename({
            kind: 'evidence',
            oldCode,
            newCode: code,
            oldName,
            newName: name,
          });
        }
      } else {
        rawState.value.evidenceTypes.unshift({
          id: `ev-${Date.now()}`,
          ...cleanPayload,
          isActive: true,
        });
        pagination.evidences.page = 1;
      }

      appendLocalAudit({
        targetId: code,
        summary: `${existing ? 'Cập nhật' : 'Thêm'} loại minh chứng «${name}»`,
        oldValues: null,
        newValues: cleanPayload,
      });

      notify(`Đã lưu loại minh chứng «${name}» (mô phỏng).`, 'success');
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveFaculty(facultyId, payload = {}) {
    const code = String(payload.code || '')
      .trim()
      .toUpperCase();
    const name = String(payload.name || '').trim();
    const contactEmail = String(payload.contactEmail || '').trim();

    if (!code || !name) {
      notify('Vui lòng nhập mã khoa và tên khoa.', 'warning');
      return false;
    }

    if (contactEmail && !EMAIL_REGEX.test(contactEmail)) {
      notify('Email đầu mối phụ trách không đúng định dạng.', 'warning');
      return false;
    }

    const existing = facultyId
      ? rawState.value.faculties.find((item) => item.id === facultyId)
      : null;

    if (
      rawState.value.faculties.some(
        (item) => item.id !== (existing?.id || '') && item.code.toUpperCase() === code
      )
    ) {
      notify(`Mã khoa «${code}» đã tồn tại.`, 'warning');
      return false;
    }

    if (
      rawState.value.faculties.some(
        (item) =>
          item.id !== (existing?.id || '') &&
          item.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      notify(`Tên khoa «${name}» đã tồn tại.`, 'warning');
      return false;
    }

    isSubmitting.value = true;
    try {
      if (existing) {
        const oldName = existing.name;
        const oldCode = existing.code;
        existing.code = code;
        existing.name = name;
        existing.contactEmail = contactEmail;

        if (oldName !== name) {
          resolveProjectsStore().syncCatalogRename({ kind: 'faculty', oldName, newName: name });
          resolveCompetitionsStore().syncCatalogRename({
            kind: 'faculty',
            oldName,
            newName: name,
          });
          resolveUsersStore().syncFacultyRename(oldName, name);
          resolveMentorStore().syncCatalogRename({ kind: 'faculty', oldName, newName: name });
        }

        appendLocalAudit({
          targetId: code,
          summary: `Cập nhật khoa «${name}»`,
          oldValues: { code: oldCode, name: oldName },
          newValues: { code, name, contactEmail },
        });
      } else {
        rawState.value.faculties.unshift({
          id: `fac-${Date.now()}`,
          code,
          name,
          contactEmail,
          isActive: true,
        });
        pagination.faculties.page = 1;

        appendLocalAudit({
          targetId: code,
          summary: `Thêm khoa «${name}»`,
          oldValues: null,
          newValues: { code, name, contactEmail },
        });
      }

      notify(`Đã lưu khoa «${name}» (mô phỏng).`, 'success');
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  function toggleCatalogStatus(kind, id) {
    const listMap = {
      category: rawState.value.projectCategories,
      evidence: rawState.value.evidenceTypes,
      faculty: rawState.value.faculties,
    };
    const list = listMap[kind];
    const item = list?.find((entry) => entry.id === id);
    if (!item) return false;

    const prevStatus = item.isActive;
    item.isActive = !item.isActive;

    appendLocalAudit({
      targetId: `${kind}:${item.code || item.name}`,
      summary: `${item.isActive ? 'Kích hoạt' : 'Ẩn'} danh mục «${item.name}»`,
      oldValues: { isActive: prevStatus },
      newValues: { isActive: item.isActive },
    });

    notify(
      `Đã ${item.isActive ? 'kích hoạt' : 'tạm ẩn'} «${item.name}» và đồng bộ danh sách chọn.`,
      'success'
    );
    return true;
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isSubmitting,
    errorMessage,
    activeTab,
    categoryFilters,
    evidenceFilters,
    facultyFilters,
    pagination,
    localAuditLogs,
    projectCategories,
    evidenceTypes,
    faculties,
    activeCategories,
    activeEvidenceTypes,
    activeFaculties,
    activeCategoriesCount,
    activeEvidenceTypesCount,
    activeFacultiesCount,
    competitionOptions,
    competitionByIdMap,
    hasCategoryFilters,
    hasEvidenceFilters,
    hasFacultyFilters,
    filteredCategories,
    paginatedCategories,
    filteredEvidenceTypes,
    paginatedEvidenceTypes,
    filteredFaculties,
    paginatedFaculties,
    categoryProjectCountsMap,
    facultyStatsMap,
    setActiveTab,
    jumpFromKpi,
    setCategoryFilter,
    resetCategoryFilters,
    setEvidenceFilter,
    resetEvidenceFilters,
    setFacultyFilter,
    resetFacultyFilters,
    setPage,
    setPageSize,
    getCompetitionCategories,
    getCompetitionEvidenceTypes,
    syncCompetitionCategories,
    replaceCatalogData,
    loadCatalogs,
    saveCategory,
    saveEvidenceType,
    saveFaculty,
    toggleCatalogStatus,
  };
});

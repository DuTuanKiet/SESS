import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { adminService } from '@/modules/administration/services/adminService';
import { useToastStore } from '@/stores/toast';
import {
  UNASSIGNED_ELIGIBLE_STATUSES,
  createInitialMentorAssignmentsMockState,
} from '@/modules/administration/mocks/adminMentorAssignmentsMockData';
import {
  extractArrayPayload,
  formatTimestamp,
  normalizeAssignmentHistoryEntry,
  normalizeMentorRecord,
  normalizeUnassignedProject,
} from '@/modules/administration/utils/mentorAssignmentHelpers';

const VALID_AVAILABILITY = new Set(['all', 'available', 'full']);
const ELIGIBLE_STATUS_SET = new Set(UNASSIGNED_ELIGIBLE_STATUSES);

function sliceByPage(items, page, pageSize) {
  const safeSize = Math.max(1, Number(pageSize) || 5);
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeSize;
  return items.slice(start, start + safeSize);
}

// Pinia store điều phối cố vấn: mặc định dùng dữ liệu mẫu tĩnh và sẵn sàng bật Live API
export const useAdminMentorAssignmentsStore = defineStore('adminMentorAssignments', () => {
  const toastStore = useToastStore();

  const isLiveApiEnabled = ref(false);
  const rawMockState = ref(createInitialMentorAssignmentsMockState());
  const liveUnassignedProjects = ref([]);
  const liveMentors = ref([]);

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const isLoadingHistory = ref(false);
  const errorMessage = ref('');

  const selectedProjectId = ref(null);
  const availability = ref('all');

  const unassignedFilters = reactive({
    keyword: '',
    field: '',
  });

  const unassignedPagination = reactive({
    page: 1,
    pageSize: 5,
  });

  const mentorsPagination = reactive({
    page: 1,
    pageSize: 5,
  });

  const projectsByCode = computed(() => {
    const map = new Map();
    (rawMockState.value.projects || []).forEach((proj) => {
      if (proj.code) map.set(proj.code, proj);
    });
    return map;
  });

  const unassignedProjects = computed(() => {
    if (isLiveApiEnabled.value) {
      return liveUnassignedProjects.value;
    }
    return (rawMockState.value.projects || [])
      .filter((p) => !p.advisorInfo && ELIGIBLE_STATUS_SET.has(p.status))
      .map(normalizeUnassignedProject);
  });

  const mentors = computed(() => {
    if (isLiveApiEnabled.value) {
      return liveMentors.value;
    }
    return (rawMockState.value.mentors || []).map((m) =>
      normalizeMentorRecord(m, projectsByCode.value)
    );
  });

  const hasUnassignedFilters = computed(() =>
    Boolean(unassignedFilters.keyword.trim() || unassignedFilters.field.trim())
  );

  const filteredUnassignedProjects = computed(() => {
    const keyword = unassignedFilters.keyword.trim().toLowerCase();
    const field = unassignedFilters.field.trim().toLowerCase();

    return unassignedProjects.value.filter((p) => {
      const matchKeyword = !keyword || `${p.code} ${p.title}`.toLowerCase().includes(keyword);
      const matchField =
        !field || `${p.faculty || ''} ${p.category || ''}`.toLowerCase().includes(field);
      return matchKeyword && matchField;
    });
  });

  const paginatedUnassignedProjects = computed(() =>
    sliceByPage(
      filteredUnassignedProjects.value,
      unassignedPagination.page,
      unassignedPagination.pageSize
    )
  );

  const selectedProject = computed(() => {
    if (!selectedProjectId.value) return null;
    return unassignedProjects.value.find((p) => p.id === selectedProjectId.value) || null;
  });

  const filteredMentors = computed(() => {
    if (availability.value === 'available') {
      return mentors.value.filter(
        (m) => m.status !== 'INACTIVE' && m.activeProjects.length < m.maxProjects
      );
    }
    if (availability.value === 'full') {
      return mentors.value.filter((m) => m.activeProjects.length >= m.maxProjects);
    }
    return mentors.value;
  });

  const paginatedMentors = computed(() =>
    sliceByPage(filteredMentors.value, mentorsPagination.page, mentorsPagination.pageSize)
  );

  // Tự động xóa chọn nếu dự án không còn trong danh sách chưa phân công (ví dụ vừa gán xong)
  watch(unassignedProjects, (list) => {
    if (selectedProjectId.value && !list.some((p) => p.id === selectedProjectId.value)) {
      selectedProjectId.value = null;
    }
  });

  watch(
    () => filteredUnassignedProjects.value.length,
    (total) => {
      const totalPages = Math.max(1, Math.ceil(total / Math.max(1, unassignedPagination.pageSize)));
      if (unassignedPagination.page > totalPages) {
        unassignedPagination.page = totalPages;
      }
    }
  );

  watch(
    () => filteredMentors.value.length,
    (total) => {
      const totalPages = Math.max(1, Math.ceil(total / Math.max(1, mentorsPagination.pageSize)));
      if (mentorsPagination.page > totalPages) {
        mentorsPagination.page = totalPages;
      }
    }
  );

  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  function setUnassignedFilter(key, value) {
    if (!(key in unassignedFilters)) return;
    unassignedFilters[key] = String(value ?? '');
    unassignedPagination.page = 1;
  }

  function resetUnassignedFilters() {
    unassignedFilters.keyword = '';
    unassignedFilters.field = '';
    unassignedPagination.page = 1;
  }

  function setUnassignedPage(nextPage) {
    unassignedPagination.page = Math.max(1, Number(nextPage) || 1);
  }

  function setUnassignedPageSize(nextSize) {
    unassignedPagination.pageSize = Math.max(1, Number(nextSize) || 5);
    unassignedPagination.page = 1;
  }

  function setAvailability(nextAvailability) {
    if (!VALID_AVAILABILITY.has(nextAvailability)) return;
    availability.value = nextAvailability;
    mentorsPagination.page = 1;
  }

  function setMentorsPage(nextPage) {
    mentorsPagination.page = Math.max(1, Number(nextPage) || 1);
  }

  function setMentorsPageSize(nextSize) {
    mentorsPagination.pageSize = Math.max(1, Number(nextSize) || 5);
    mentorsPagination.page = 1;
  }

  function toggleSelectProject(projectId) {
    if (!projectId) return;
    selectedProjectId.value = selectedProjectId.value === projectId ? null : projectId;
  }

  function clearSelectedProject() {
    selectedProjectId.value = null;
  }

  // Hỗ trợ deep-link từ Dashboard hoặc Chi tiết dự án (?projectId=...)
  function preselectProject(projectIdOrCode) {
    const needle = String(projectIdOrCode || '').trim();
    if (!needle) return false;

    const index = filteredUnassignedProjects.value.findIndex(
      (p) => p.id === needle || p.code === needle
    );
    const target =
      index >= 0
        ? filteredUnassignedProjects.value[index]
        : unassignedProjects.value.find((p) => p.id === needle || p.code === needle);

    if (!target) return false;

    selectedProjectId.value = target.id;
    if (index >= 0) {
      unassignedPagination.page = Math.floor(index / Math.max(1, unassignedPagination.pageSize)) + 1;
    }
    return true;
  }

  function getAvailableReassignMentors(currentMentorId) {
    return mentors.value.filter(
      (m) =>
        m.status !== 'INACTIVE' &&
        m.activeProjects.length < m.maxProjects &&
        m.id !== currentMentorId
    );
  }

  async function fetchLiveMentorAssignments() {
    const [unassignedRes, mentorsRes] = await Promise.all([
      adminService.listUnassignedMentorProjects({ page: 1, limit: 100 }),
      adminService.listMentors({ page: 1, limit: 100, availability: 'all' }),
    ]);

    liveUnassignedProjects.value = extractArrayPayload(unassignedRes, ['projects']).map(
      normalizeUnassignedProject
    );
    liveMentors.value = extractArrayPayload(mentorsRes, ['mentors']).map((m) =>
      normalizeMentorRecord(m)
    );
  }

  async function loadMentorAssignments({
    useLiveApi = isLiveApiEnabled.value,
    silent = false,
  } = {}) {
    errorMessage.value = '';

    if (!useLiveApi) {
      if (!silent) {
        notify('Đã làm mới danh sách điều phối cố vấn.', 'info');
      }
      return true;
    }

    isLoading.value = true;
    try {
      await fetchLiveMentorAssignments();
      if (!silent) {
        notify('Đã đồng bộ danh sách dự án và cố vấn từ hệ thống.', 'success');
      }
      return true;
    } catch (error) {
      errorMessage.value = error?.message || 'Không thể tải dữ liệu điều phối cố vấn.';
      notify(errorMessage.value, 'error');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function assignMentor({ mentorId, projectId = selectedProjectId.value, note = '' }) {
    const targetProject = unassignedProjects.value.find((p) => p.id === projectId);
    const targetMentor = mentors.value.find((m) => m.id === mentorId);

    if (
      !targetProject ||
      !targetMentor ||
      targetMentor.status === 'INACTIVE' ||
      targetMentor.activeProjects.length >= targetMentor.maxProjects
    ) {
      notify('Cố vấn đã đủ chỉ tiêu hoặc chưa chọn dự án hợp lệ.', 'warning');
      return false;
    }

    const cleanNote = String(note || '').trim();
    isSubmitting.value = true;
    errorMessage.value = '';
    try {
      if (isLiveApiEnabled.value) {
        await adminService.assignMentor({
          projectId: targetProject.id,
          mentorId: targetMentor.id,
          note: cleanNote,
        });
        selectedProjectId.value = null;
        await fetchLiveMentorAssignments();
        notify(`Đã phân công ${targetMentor.name} hướng dẫn dự án ${targetProject.code}.`);
        return true;
      }

      const mockMentor = rawMockState.value.mentors.find((m) => m.id === targetMentor.id);
      const mockProject = rawMockState.value.projects.find((p) => p.id === targetProject.id);
      if (!mockMentor || !mockProject) {
        notify('Không tìm thấy dữ liệu dự án hoặc cố vấn.', 'error');
        return false;
      }

      if (!mockMentor.active.includes(mockProject.code)) {
        mockMentor.active.push(mockProject.code);
      }
      mockProject.advisorInfo = {
        name: mockMentor.name,
        email: mockMentor.email,
        unit: mockMentor.unit || '',
        phone: mockMentor.phone || '',
      };
      const oldStatus = mockProject.status;
      if (['SUBMITTED', 'IN_REVIEW', 'NEED_REVISION'].includes(mockProject.status)) {
        mockProject.status = 'UNDER_MENTORSHIP';
      }

      rawMockState.value.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: formatTimestamp(new Date()),
        action: 'ASSIGN_MENTOR',
        targetEntity: 'MentorAssignments',
        targetId: mockProject.code,
        projectId: mockProject.id,
        summary: `Phân công cố vấn ${mockMentor.name} đồng hành cùng dự án ${mockProject.code}`,
        oldValues: { mentor: null, status: oldStatus },
        newValues: {
          mentorEmail: mockMentor.email,
          status: mockProject.status,
          note: cleanNote || undefined,
        },
      });

      selectedProjectId.value = null;
      notify(`Đã phân công ${mockMentor.name} hướng dẫn dự án ${mockProject.code}.`);
      return true;
    } catch (error) {
      const msg = error?.message || 'Không thể phân công cố vấn cho dự án.';
      notify(msg, 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function reassignMentor({
    projectId,
    projectCode,
    currentMentorId,
    newMentorId,
    reason = '',
  }) {
    const cleanReason = String(reason || '').trim();
    const newMentor = mentors.value.find((m) => m.id === newMentorId);

    if (
      !newMentor ||
      newMentor.id === currentMentorId ||
      newMentor.status === 'INACTIVE' ||
      newMentor.activeProjects.length >= newMentor.maxProjects ||
      cleanReason.length < 5
    ) {
      notify('Vui lòng chọn cố vấn mới hợp lệ và nhập lý do tối thiểu 5 ký tự.', 'warning');
      return false;
    }

    const displayCode = projectCode || projectId;
    isSubmitting.value = true;
    errorMessage.value = '';
    try {
      if (isLiveApiEnabled.value) {
        await adminService.reassignMentor({
          projectId,
          newMentorId: newMentor.id,
          reason: cleanReason,
        });
        await fetchLiveMentorAssignments();
        notify(`Đã đổi cố vấn dự án ${displayCode} sang ${newMentor.name}.`);
        return true;
      }

      const currentMockMentor = rawMockState.value.mentors.find((m) => m.id === currentMentorId);
      const newMockMentor = rawMockState.value.mentors.find((m) => m.id === newMentor.id);
      if (!newMockMentor) {
        notify('Không tìm thấy cố vấn mới.', 'error');
        return false;
      }

      if (currentMockMentor) {
        currentMockMentor.active = currentMockMentor.active.filter((c) => c !== displayCode);
      }
      if (!newMockMentor.active.includes(displayCode)) {
        newMockMentor.active.push(displayCode);
      }

      const mockProject = rawMockState.value.projects.find(
        (p) => p.code === displayCode || p.id === projectId
      );
      if (mockProject) {
        mockProject.advisorInfo = {
          name: newMockMentor.name,
          email: newMockMentor.email,
          unit: newMockMentor.unit || '',
          phone: newMockMentor.phone || '',
        };
      }

      rawMockState.value.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: formatTimestamp(new Date()),
        action: 'REASSIGN_MENTOR',
        targetEntity: 'MentorAssignments',
        targetId: displayCode,
        projectId: mockProject?.id || projectId,
        summary: `Điều chuyển cố vấn ${displayCode}${currentMockMentor ? ` từ ${currentMockMentor.name}` : ''} sang ${newMockMentor.name}`,
        oldValues: { mentorEmail: currentMockMentor?.email || null },
        newValues: { mentorEmail: newMockMentor.email, reason: cleanReason },
      });

      notify(`Đã đổi cố vấn dự án ${displayCode} sang ${newMockMentor.name}.`);
      return true;
    } catch (error) {
      const msg = error?.message || 'Không thể điều chuyển cố vấn.';
      notify(msg, 'error');
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function fetchProjectAssignmentHistory(projectRef) {
    if (!projectRef) return [];

    if (isLiveApiEnabled.value) {
      isLoadingHistory.value = true;
      try {
        const res = await adminService.getProjectMentorAssignmentHistory(projectRef.projectId);
        const rawList = extractArrayPayload(res);
        // API trả về theo thứ tự thời gian tăng dần; đảo lại để mốc mới nhất hiện trên cùng
        return [...rawList]
          .reverse()
          .map((item, idx) => normalizeAssignmentHistoryEntry(item, idx));
      } catch (error) {
        notify(error?.message || 'Không tải được lịch sử phân công cố vấn.', 'error');
        return [];
      } finally {
        isLoadingHistory.value = false;
      }
    }

    const code = projectRef.code || projectRef.displayLabel;
    const logs = (rawMockState.value.auditLogs || []).filter(
      (l) =>
        (l.action === 'ASSIGN_MENTOR' || l.action === 'REASSIGN_MENTOR') &&
        (l.targetId === code || (projectRef.projectId && l.projectId === projectRef.projectId))
    );

    if (logs.length) {
      return logs.map((item, idx) => normalizeAssignmentHistoryEntry(item, idx));
    }

    const mockProject = (rawMockState.value.projects || []).find(
      (p) => p.code === code || p.id === projectRef.projectId
    );
    return [
      {
        id: `fallback-${code}`,
        summary: mockProject?.advisorInfo?.name || 'Chưa phân công',
        timestamp: 'Chưa có biến động phân công trước đó',
        reason: '',
        badgeLabel: mockProject?.advisorInfo ? 'Đang phụ trách' : '',
        badgeTone: 'blue',
        isLatest: true,
      },
    ];
  }

  function syncCatalogRename({ kind, oldName, newName } = {}) {
    if (!oldName || !newName || oldName === newName) return;
    const list = rawMockState.value.projects || [];
    if (kind === 'category') {
      list.forEach((proj) => {
        if (proj.category === oldName) proj.category = newName;
      });
      return;
    }
    if (kind === 'faculty') {
      list.forEach((proj) => {
        if (proj.faculty === oldName) proj.faculty = newName;
      });
    }
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isSubmitting,
    isLoadingHistory,
    errorMessage,
    selectedProjectId,
    selectedProject,
    availability,
    unassignedFilters,
    hasUnassignedFilters,
    unassignedPagination,
    mentorsPagination,
    unassignedProjects,
    filteredUnassignedProjects,
    paginatedUnassignedProjects,
    mentors,
    filteredMentors,
    paginatedMentors,
    setUnassignedFilter,
    resetUnassignedFilters,
    setUnassignedPage,
    setUnassignedPageSize,
    setAvailability,
    setMentorsPage,
    setMentorsPageSize,
    toggleSelectProject,
    clearSelectedProject,
    preselectProject,
    getAvailableReassignMentors,
    loadMentorAssignments,
    assignMentor,
    reassignMentor,
    fetchProjectAssignmentHistory,
    syncCatalogRename,
  };
});

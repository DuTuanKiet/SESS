import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToastStore } from '@/stores/toast';
import {
  LEVELS,
  PROJECT_STATUS,
} from '@/modules/administration/constants/adminConstants';
import { useAdminCompetitionsStore } from '@/modules/administration/stores/useAdminCompetitionsStore';
import { useAdminMentorAssignmentsStore } from '@/modules/administration/stores/useAdminMentorAssignmentsStore';
import { useAdminUsersStore } from '@/modules/administration/stores/useAdminUsersStore';
import {
  formatProjectTimestamp,
  getAllowedProjectTransitions,
  getNextPromoteLevels,
  getTransferLeaderCandidates,
  slicePaginatedItems,
  stripLeaderSuffix,
} from '@/modules/administration/utils/projectManagementHelpers';

const VALID_PROJECT_TABS = new Set(['projects-list', 'projects-cancel', 'projects-change']);
const VALID_REQUEST_STATUS = new Set(['', 'PENDING', 'APPROVED', 'REJECTED']);

function createEmptyProjectsState() {
  return {
    projects: [],
    cancellations: [],
    changeRequests: [],
  };
}

// Pinia store quản lý vòng đời dự án, đơn xin hủy và yêu cầu thay đổi thành viên (sẵn sàng chuyển Live API)
export const useAdminProjectsStore = defineStore('adminProjects', () => {
  const toastStore = useToastStore();
  const competitionsStore = useAdminCompetitionsStore();
  const mentorStore = useAdminMentorAssignmentsStore();
  const usersStore = useAdminUsersStore();

  const isLiveApiEnabled = ref(false);
  const rawState = ref(createEmptyProjectsState());

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  const activeTab = ref('projects-list');

  const projectFilters = reactive({
    keyword: '',
    competitionId: '',
    category: '',
    status: '',
    level: '',
  });

  const cancelStatusFilter = ref('PENDING');
  const changeStatusFilter = ref('PENDING');

  const pagination = reactive({
    projects: { page: 1, pageSize: 5 },
    cancels: { page: 1, pageSize: 5 },
    changes: { page: 1, pageSize: 5 },
  });

  const localAuditLogs = ref([]);

  const projects = computed(() => rawState.value.projects || []);
  const cancellations = computed(() => rawState.value.cancellations || []);
  const changeRequests = computed(() => rawState.value.changeRequests || []);

  const pendingCancelsCount = computed(
    () => cancellations.value.filter((item) => item.status === 'PENDING').length
  );

  const pendingChangesCount = computed(
    () => changeRequests.value.filter((item) => item.status === 'PENDING').length
  );

  const competitionOptions = computed(() => competitionsStore.competitions || []);

  const competitionCodeMap = computed(() => {
    const map = new Map();
    competitionOptions.value.forEach((comp) => {
      if (comp?.id) map.set(comp.id, comp.code || '');
    });
    return map;
  });

  const categoryOptions = computed(() =>
    competitionsStore.getCompetitionCategories(projectFilters.competitionId, false)
  );

  const projectTitleByCodeMap = computed(() => {
    const map = new Map();
    projects.value.forEach((proj) => {
      if (proj?.code) map.set(proj.code, proj.title || '');
    });
    return map;
  });

  const hasProjectFilters = computed(() =>
    Boolean(
      projectFilters.keyword.trim() ||
        projectFilters.competitionId ||
        projectFilters.category ||
        projectFilters.status ||
        projectFilters.level
    )
  );

  const filteredProjects = computed(() => {
    const keyword = projectFilters.keyword.trim().toLowerCase();
    return projects.value.filter((proj) => {
      const searchable = `${proj.code} ${proj.title} ${proj.category || ''}`.toLowerCase();
      const matchKeyword = !keyword || searchable.includes(keyword);
      const matchCompetition =
        !projectFilters.competitionId || proj.competitionId === projectFilters.competitionId;
      const matchCategory = !projectFilters.category || proj.category === projectFilters.category;
      const matchStatus = !projectFilters.status || proj.status === projectFilters.status;
      const matchLevel = !projectFilters.level || proj.level === projectFilters.level;
      return matchKeyword && matchCompetition && matchCategory && matchStatus && matchLevel;
    });
  });

  const paginatedProjects = computed(() =>
    slicePaginatedItems(
      filteredProjects.value,
      pagination.projects.page,
      pagination.projects.pageSize
    )
  );

  const filteredCancellations = computed(() =>
    cancellations.value.filter(
      (item) => !cancelStatusFilter.value || item.status === cancelStatusFilter.value
    )
  );

  const paginatedCancellations = computed(() =>
    slicePaginatedItems(
      filteredCancellations.value,
      pagination.cancels.page,
      pagination.cancels.pageSize
    )
  );

  const filteredChangeRequests = computed(() =>
    changeRequests.value.filter(
      (item) => !changeStatusFilter.value || item.status === changeStatusFilter.value
    )
  );

  const paginatedChangeRequests = computed(() =>
    slicePaginatedItems(
      filteredChangeRequests.value,
      pagination.changes.page,
      pagination.changes.pageSize
    )
  );

  // Tự động xóa thể loại đang chọn nếu không thuộc cuộc thi mới chọn
  watch(categoryOptions, (categories) => {
    if (
      projectFilters.category &&
      !categories.some((cat) => cat.name === projectFilters.category)
    ) {
      projectFilters.category = '';
    }
  });

  function clampPage(kind, totalItems) {
    const pager = pagination[kind];
    if (!pager) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pager.pageSize)));
    if (pager.page > totalPages) {
      pager.page = totalPages;
    }
  }

  watch(() => filteredProjects.value.length, (total) => clampPage('projects', total));
  watch(() => filteredCancellations.value.length, (total) => clampPage('cancels', total));
  watch(() => filteredChangeRequests.value.length, (total) => clampPage('changes', total));

  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  function appendLocalAudit(entry) {
    localAuditLogs.value.unshift({
      id: `al-${Date.now()}`,
      timestamp: formatProjectTimestamp(new Date()),
      ...entry,
    });
  }

  function setActiveTab(tabKey) {
    if (!VALID_PROJECT_TABS.has(tabKey)) return;
    activeTab.value = tabKey;
  }

  function setProjectFilter(key, value) {
    if (!(key in projectFilters)) return;
    projectFilters[key] = String(value ?? '');
    if (key === 'competitionId') {
      const validCats = competitionsStore.getCompetitionCategories(projectFilters.competitionId, false);
      if (projectFilters.category && !validCats.some((c) => c.name === projectFilters.category)) {
        projectFilters.category = '';
      }
    }
    pagination.projects.page = 1;
  }

  function resetProjectFilters() {
    projectFilters.keyword = '';
    projectFilters.competitionId = '';
    projectFilters.category = '';
    projectFilters.status = '';
    projectFilters.level = '';
    pagination.projects.page = 1;
  }

  function setCancelStatusFilter(value) {
    const nextValue = String(value ?? '');
    if (!VALID_REQUEST_STATUS.has(nextValue)) return;
    cancelStatusFilter.value = nextValue;
    pagination.cancels.page = 1;
  }

  function setChangeStatusFilter(value) {
    const nextValue = String(value ?? '');
    if (!VALID_REQUEST_STATUS.has(nextValue)) return;
    changeStatusFilter.value = nextValue;
    pagination.changes.page = 1;
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

  function findProjectByIdOrCode(idOrCode) {
    const needle = String(idOrCode || '').trim();
    if (!needle) return null;
    return projects.value.find((item) => item.id === needle || item.code === needle) || null;
  }

  function getCompetitionCode(competitionId) {
    return competitionCodeMap.value.get(competitionId) || '';
  }

  function resolveCurrentMentorForProject(project) {
    if (!project) return null;
    const mentorList = mentorStore.mentors || [];
    const advisorEmail = String(project.advisorInfo?.email || '').trim().toLowerCase();
    if (advisorEmail) {
      const matchedByEmail = mentorList.find(
        (m) => String(m.email || '').trim().toLowerCase() === advisorEmail
      );
      if (matchedByEmail) return matchedByEmail;
      return {
        id: '',
        name: project.advisorInfo?.name || advisorEmail,
        email: advisorEmail,
      };
    }

    const matchedByActive = mentorList.find((m) =>
      (m.activeProjects || []).some((ap) => ap.code === project.code || ap.projectId === project.id)
    );
    if (matchedByActive) return matchedByActive;

    if (project.advisorInfo?.name) {
      return {
        id: '',
        name: project.advisorInfo.name,
        email: '',
      };
    }
    return null;
  }

  function getAvailableReassignMentors(project) {
    const currentMentor = resolveCurrentMentorForProject(project);
    return mentorStore.getAvailableReassignMentors(currentMentor?.id || '');
  }

  async function loadProjectsData({ silent = true } = {}) {
    errorMessage.value = '';
    if (!isLiveApiEnabled.value) {
      if (!silent) {
        notify('Đã làm mới danh sách dự án và yêu cầu xử lý.', 'info');
      }
      return true;
    }
    return true;
  }

  async function changeProjectStatus(
    projectId,
    { status, note = '', force = false, forceReason = '' }
  ) {
    const target = findProjectByIdOrCode(projectId);
    if (!target) return false;

    const nextStatus = String(status || '').trim();
    const { isTerminal, targets } = getAllowedProjectTransitions(target.status);
    if (!nextStatus || !targets.includes(nextStatus) || !PROJECT_STATUS[nextStatus]) {
      notify('Trạng thái đích không hợp lệ theo quy trình xét duyệt.', 'warning');
      return false;
    }

    const cleanForceReason = String(forceReason || '').trim();
    if (isTerminal && (!force || cleanForceReason.length < 10)) {
      notify('Vui lòng đánh dấu cưỡng chế và nhập lý do tối thiểu 10 ký tự.', 'warning');
      return false;
    }

    isSubmitting.value = true;
    try {
      const oldStatus = target.status;
      const cleanNote = String(note || '').trim();
      target.status = nextStatus;

      appendLocalAudit({
        action: 'CHANGE_PROJECT_STATUS',
        targetEntity: 'Projects',
        targetId: target.code,
        summary: `Chuyển trạng thái ${target.code} từ ${PROJECT_STATUS[oldStatus]?.label || oldStatus} sang ${PROJECT_STATUS[nextStatus].label}`,
        oldValues: { status: oldStatus },
        newValues: {
          status: nextStatus,
          note: cleanNote || undefined,
          force: isTerminal ? true : undefined,
          forceReason: isTerminal ? cleanForceReason : undefined,
        },
      });

      notify(`Đã chuyển ${target.code} sang trạng thái «${PROJECT_STATUS[nextStatus].label}».`);
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function promoteProject(projectId, { targetLevel, note = '' }) {
    const target = findProjectByIdOrCode(projectId);
    if (!target) return false;

    const allowedNext = getNextPromoteLevels(target.level);
    const nextLevel = String(targetLevel || '').trim();
    if (!allowedNext.length || !allowedNext.includes(nextLevel)) {
      notify('Dự án đã ở cấp cao nhất hoặc cấp thi đích không hợp lệ.', 'warning');
      return false;
    }

    isSubmitting.value = true;
    try {
      const oldLevel = target.level;
      const cleanNote = String(note || '').trim();
      target.level = nextLevel;

      appendLocalAudit({
        action: 'PROMOTE_PROJECT',
        targetEntity: 'Projects',
        targetId: target.code,
        summary: `Đề xuất ${target.code} vượt cấp từ ${LEVELS[oldLevel]} lên ${LEVELS[nextLevel]}`,
        oldValues: { level: oldLevel },
        newValues: { level: nextLevel, note: cleanNote || undefined },
      });

      notify(`Đã đề xuất ${target.code} lên ${LEVELS[nextLevel]}.`);
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function transferProjectOwner(projectId, { targetLeaderName, reason = '' }) {
    const target = findProjectByIdOrCode(projectId);
    if (!target) return false;

    const candidates = getTransferLeaderCandidates(target);
    const newLeader = String(targetLeaderName || '').trim();
    const cleanReason = String(reason || '').trim();

    if (!candidates.length || !candidates.includes(newLeader) || cleanReason.length < 5) {
      notify('Vui lòng chọn trưởng nhóm mới và nhập lý do tối thiểu 5 ký tự.', 'warning');
      return false;
    }

    isSubmitting.value = true;
    try {
      const oldLeader =
        target.leaderInfo?.name || stripLeaderSuffix(target.members?.[0]) || '—';
      const cleanedMembers = (target.members || []).map(stripLeaderSuffix).filter(Boolean);
      const others = cleanedMembers.filter((member) => member !== newLeader);
      target.members = [`${newLeader} (Trưởng nhóm)`, ...others];

      const whitelistMatch = (usersStore.studentWhitelist || []).find(
        (item) => String(item.fullName || '').toLowerCase() === newLeader.toLowerCase()
      );
      target.leaderInfo = {
        name: newLeader,
        studentId: whitelistMatch?.studentId || '—',
        email: whitelistMatch?.email || '—',
        phone: whitelistMatch?.phone || '—',
        className: whitelistMatch?.className || '—',
      };

      appendLocalAudit({
        action: 'TRANSFER_PROJECT_OWNER',
        targetEntity: 'Projects',
        targetId: target.code,
        summary: `Chuyển quyền trưởng nhóm ${target.code}: ${oldLeader} → ${newLeader}`,
        oldValues: { leader: oldLeader },
        newValues: { leader: newLeader, reason: cleanReason },
      });

      notify(`Đã chuyển quyền trưởng nhóm ${target.code} sang ${newLeader}.`);
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function reviewCancellation(requestId, { decision, note = '' }) {
    const req = cancellations.value.find((item) => item.id === requestId);
    if (!req || req.status !== 'PENDING') return false;

    const nextDecision = decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const cleanNote = String(note || '').trim();
    if (cleanNote.length < 5) {
      notify('Vui lòng nhập ghi chú xử lý tối thiểu 5 ký tự.', 'warning');
      return false;
    }

    isSubmitting.value = true;
    try {
      req.status = nextDecision;
      req.reviewNote = cleanNote;

      const proj = findProjectByIdOrCode(req.project);
      if (nextDecision === 'APPROVED' && proj) {
        proj.status = 'CANCELLED';
      }

      appendLocalAudit({
        action: 'CANCEL_PROJECT_REVIEW',
        targetEntity: 'CancellationRequests',
        targetId: req.project,
        summary: `${nextDecision === 'APPROVED' ? 'Chấp thuận hủy dự án' : 'Từ chối đơn hủy'} ${req.project}`,
        oldValues: { status: 'PENDING' },
        newValues: { status: nextDecision, reviewNote: cleanNote },
      });

      notify(
        nextDecision === 'APPROVED'
          ? `Đã duyệt hủy dự án ${req.project}.`
          : `Đã từ chối đơn xin hủy ${req.project}.`
      );
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function respondMemberChange(requestId, { decision, note = '' }) {
    const req = changeRequests.value.find((item) => item.id === requestId);
    if (!req || req.status !== 'PENDING') return false;

    const nextDecision = decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';
    const cleanReason = String(note || '').trim();

    isSubmitting.value = true;
    try {
      req.status = nextDecision;
      req.responseReason = cleanReason;

      const proj = findProjectByIdOrCode(req.project);
      if (nextDecision === 'APPROVED' && proj) {
        if (req.type === 'ADD') {
          const exists = (proj.members || []).some(
            (member) => stripLeaderSuffix(member) === req.student
          );
          if (!exists) {
            proj.members = [...(proj.members || []), req.student];
          }
        } else {
          proj.members = (proj.members || []).filter(
            (member) => stripLeaderSuffix(member) !== req.student
          );
        }
      }

      appendLocalAudit({
        action: 'MEMBER_CHANGE_REVIEW',
        targetEntity: 'MemberChangeRequests',
        targetId: req.project,
        summary: `${nextDecision === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} ${req.type === 'ADD' ? 'thêm' : 'rút'} thành viên ${req.student} (${req.project})`,
        oldValues: { status: 'PENDING' },
        newValues: { status: nextDecision, responseReason: cleanReason || undefined },
      });

      notify(
        `Đã ${nextDecision === 'APPROVED' ? 'phê duyệt' : 'từ chối'} yêu cầu biến động thành viên ${req.project}.`
      );
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function reassignProjectMentor(payload) {
    isSubmitting.value = true;
    try {
      const isSuccess = await mentorStore.reassignMentor(payload);
      if (!isSuccess) return false;

      const targetProject = findProjectByIdOrCode(payload.projectId || payload.projectCode);
      const nextMentor = (mentorStore.mentors || []).find((m) => m.id === payload.newMentorId);
      if (targetProject && nextMentor) {
        targetProject.advisorInfo = {
          name: nextMentor.name,
          email: nextMentor.email,
          unit: nextMentor.unit || '',
          phone: nextMentor.phone || '',
        };
      }
      return true;
    } finally {
      isSubmitting.value = false;
    }
  }

  function syncCatalogRename({ kind, oldName, newName } = {}) {
    if (!oldName || !newName || oldName === newName) return;
    if (kind === 'category') {
      (rawState.value.projects || []).forEach((proj) => {
        if (proj.category === oldName) proj.category = newName;
      });
      if (projectFilters.category === oldName) {
        projectFilters.category = newName;
      }
      return;
    }
    if (kind === 'faculty') {
      (rawState.value.projects || []).forEach((proj) => {
        if (proj.faculty === oldName) proj.faculty = newName;
      });
    }
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isSubmitting,
    errorMessage,
    activeTab,
    projectFilters,
    cancelStatusFilter,
    changeStatusFilter,
    pagination,
    localAuditLogs,
    projects,
    cancellations,
    changeRequests,
    pendingCancelsCount,
    pendingChangesCount,
    competitionOptions,
    competitionCodeMap,
    categoryOptions,
    projectTitleByCodeMap,
    hasProjectFilters,
    filteredProjects,
    paginatedProjects,
    filteredCancellations,
    paginatedCancellations,
    filteredChangeRequests,
    paginatedChangeRequests,
    setActiveTab,
    setProjectFilter,
    resetProjectFilters,
    setCancelStatusFilter,
    setChangeStatusFilter,
    setPage,
    setPageSize,
    findProjectByIdOrCode,
    getCompetitionCode,
    resolveCurrentMentorForProject,
    getAvailableReassignMentors,
    loadProjectsData,
    changeProjectStatus,
    promoteProject,
    transferProjectOwner,
    reviewCancellation,
    respondMemberChange,
    reassignProjectMentor,
    syncCatalogRename,
  };
});

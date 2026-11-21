import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { adminService } from '@/modules/administration/services/adminService';
import { notificationService } from '@/services/notificationService';
import { useToastStore } from '@/stores/toast';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';
import {
  CHART_PALETTE,
  FACULTY_SHORT_MAP,
  LEVELS,
  LEVEL_ORDER,
  PROJECT_STAGE_GROUPS,
  ROLES,
} from '@/modules/administration/constants/adminConstants';

function createEmptyDashboardState() {
  return {
    projects: [],
    users: [],
    mentors: [],
    competitions: [],
    evaluations: [],
    cancellations: [],
    changeRequests: [],
    emergencies: [],
    appeals: [],
    rewardClaims: [],
    publicVotes: [],
    notifications: [],
    auditLogs: [],
  };
}

const OVERVIEW_MAX_RECENT = 5;
const UNASSIGNED_ELIGIBLE_STATUSES = new Set(['SUBMITTED', 'IN_REVIEW', 'APPROVED']);
const COMPLETED_PROJECT_STATUSES = new Set(['APPROVED', 'EVALUATED', 'COMPLETED']);

function formatNowTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatShortTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseOverviewDateKey(rawDate, fallbackKey = 0) {
  const match = String(rawDate || '')
    .trim()
    .match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?(?:\s+(\d{2}):(\d{2}))?$/);
  if (!match) return fallbackKey;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3] || new Date().getFullYear());
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  return (((year * 100 + month) * 100 + day) * 100 + hour) * 100 + minute;
}

function extractItems(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function shortenAxisLabel(label) {
  return FACULTY_SHORT_MAP[label] || String(label || '').replace(/^Cấp\s+/i, '');
}

function buildChartGroups(projectList, mode) {
  const total = projectList.length;

  if (mode === 'level') {
    return LEVEL_ORDER.map((lvl, idx) => {
      const count = projectList.filter((p) => p.level === lvl).length;
      const label = LEVELS[lvl] || lvl;
      return {
        key: lvl,
        label,
        shortLabel: shortenAxisLabel(label),
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      };
    }).filter((g) => g.count > 0);
  }

  if (mode === 'faculty') {
    const counts = {};
    projectList.forEach((p) => {
      const key = p.faculty || 'Khác';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count], idx) => ({
        key: label,
        label,
        shortLabel: shortenAxisLabel(label),
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      }));
  }

  return PROJECT_STAGE_GROUPS.map((stage) => {
    const count = projectList.filter((p) => stage.statuses.includes(p.status)).length;
    return {
      key: stage.key,
      label: stage.label,
      shortLabel: stage.label,
      color: stage.color,
      count,
      percent: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

// Chuẩn hóa toàn bộ số liệu Dashboard từ dữ liệu thô để UI dùng chung cho cả Mock và Live API
function computeDashboardMetrics(rawState, backendSummary = null) {
  const projects = rawState.projects || [];
  const users = rawState.users || [];
  const mentors = rawState.mentors || [];
  const competitions = rawState.competitions || [];
  const evaluations = rawState.evaluations || [];
  const cancellations = rawState.cancellations || [];
  const changeRequests = rawState.changeRequests || [];
  const emergencies = rawState.emergencies || [];
  const appeals = rawState.appeals || [];
  const rewardClaims = rawState.rewardClaims || [];
  const publicVotes = rawState.publicVotes || [];
  const notifications = rawState.notifications || [];
  const auditLogs = rawState.auditLogs || [];

  const projectByCode = new Map(projects.map((p) => [p.code, p]));
  const unassignedProjects = projects.filter(
    (p) => UNASSIGNED_ELIGIBLE_STATUSES.has(p.status) && !p.advisorInfo
  );
  const pendingCancels = cancellations.filter((c) => c.status === 'PENDING');
  const pendingChanges = changeRequests.filter((r) => r.status === 'PENDING');
  const pendingEmergencies = emergencies.filter((e) => e.status === 'PENDING');
  const pendingAppeals = appeals.filter((a) => ['PENDING', 'SUBMITTED', 'IN_REVIEW'].includes(a.status));
  const deviationProjects = projects.filter((p) => p.needsAdminReview);
  const pendingRewards = rewardClaims.filter((r) => r.status === 'PENDING');
  const watchVotes = publicVotes.filter((v) => v.anomalyStatus === 'WATCH' && !v.isLocked);
  const liveAlertSortKey = parseOverviewDateKey(formatNowTimestamp());

  const rawQueue = [
    ...watchVotes.map((v) => ({
      id: `vote-${v.id}`,
      kind: 'AWARD_VOTE',
      kindLabel: 'Rà soát vote',
      tone: 'amber',
      code: v.projectCode,
      title: projectByCode.get(v.projectCode)?.title || v.competitionTitle,
      actor: `+${v.votes24h} vote/24h`,
      date: 'Cảnh báo IP',
      sortKey: liveAlertSortKey,
      targetNav: 'awards',
      targetSub: 'awards-votes',
    })),
    ...pendingAppeals.map((a) => ({
      id: `appeal-${a.id}`,
      kind: 'JUDGING',
      kindLabel: 'Khiếu nại',
      tone: 'amber',
      code: a.projectCode,
      title: projectByCode.get(a.projectCode)?.title || a.reason,
      actor: a.submittedBy,
      date: a.createdAt || '-',
      sortKey: parseOverviewDateKey(a.createdAt),
      targetNav: 'judging',
      targetSub: 'judging-override',
    })),
    ...pendingRewards.map((rc) => ({
      id: `reward-${rc.id}`,
      kind: 'AWARD_VOTE',
      kindLabel: 'Nhận giải',
      tone: 'amber',
      code: rc.projectCode,
      title: `${rc.awardRank} - ${rc.prizeAmount}`,
      actor: rc.submittedBy,
      date: rc.submittedAt || '-',
      sortKey: parseOverviewDateKey(rc.submittedAt),
      targetNav: 'awards',
      targetSub: 'awards-claims',
    })),
    ...pendingEmergencies.map((e) => ({
      id: `emergency-${e.id}`,
      kind: 'JUDGING',
      kindLabel: 'Đổi BGK',
      tone: 'rose',
      code: e.project,
      title: `${e.from} -> ${e.to}`,
      actor: e.reason,
      date: e.date || '-',
      sortKey: parseOverviewDateKey(e.date),
      targetNav: 'judging',
      targetSub: 'judging-emergency',
    })),
    ...pendingChanges.map((r) => ({
      id: `change-${r.id}`,
      kind: 'CHANGE',
      kindLabel: r.type === 'ADD' ? 'Thêm TV' : 'Rời nhóm',
      tone: 'amber',
      code: r.project,
      title: projectByCode.get(r.project)?.title || r.reason,
      actor: r.student,
      date: r.date || '-',
      sortKey: parseOverviewDateKey(r.date),
      targetNav: 'projects',
      targetSub: 'projects-change',
    })),
    ...unassignedProjects.map((p) => ({
      id: `mentor-${p.id}`,
      projectId: p.id,
      kind: 'MENTOR',
      kindLabel: 'Chờ cố vấn',
      tone: 'blue',
      code: p.code,
      title: p.title,
      actor: p.faculty,
      date: (p.submittedAt || '-').split(' ')[0],
      sortKey: parseOverviewDateKey(p.submittedAt),
      targetNav: 'mentors',
      targetSub: '',
    })),
    ...pendingCancels.map((c) => ({
      id: `cancel-${c.id}`,
      kind: 'CANCEL',
      kindLabel: 'Xin hủy',
      tone: 'rose',
      code: c.project,
      title: projectByCode.get(c.project)?.title || c.reason,
      actor: c.by,
      date: c.date || '-',
      sortKey: parseOverviewDateKey(c.date),
      targetNav: 'projects',
      targetSub: 'projects-cancel',
    })),
    ...deviationProjects.map((p) => ({
      id: `deviation-${p.id}`,
      kind: 'JUDGING',
      kindLabel: 'Lệch điểm',
      tone: 'rose',
      code: p.code,
      title: p.title,
      actor: 'Chênh lệch BGK',
      date: (p.submittedAt || '-').split(' ')[0],
      sortKey: parseOverviewDateKey(p.submittedAt),
      targetNav: 'judging',
      targetSub: 'judging-override',
    })),
  ];

  const queueItems = rawQueue
    .map((item, seq) => ({ ...item, seq }))
    .sort((a, b) => b.sortKey - a.sortKey || a.seq - b.seq);

  const submittedEvals = evaluations.filter((e) => e.status === 'SUBMITTED');
  const scoredEvals = submittedEvals.filter(
    (e) => e.score !== null && Number.isFinite(Number(e.score))
  );
  const avgScore = scoredEvals.length
    ? (scoredEvals.reduce((sum, e) => sum + Number(e.score), 0) / scoredEvals.length).toFixed(1)
    : '-';
  const evalRate = evaluations.length
    ? Math.round((submittedEvals.length / evaluations.length) * 100)
    : 0;

  const scoreBuckets = [
    { key: 'pending', label: 'Chờ chấm', count: evaluations.length - scoredEvals.length, color: '#94A3B8' },
    { key: 'low', label: '< 7.0', count: scoredEvals.filter((e) => Number(e.score) < 7).length, color: '#E11D48' },
    {
      key: 'mid',
      label: '7.0-7.9',
      count: scoredEvals.filter((e) => Number(e.score) >= 7 && Number(e.score) < 8).length,
      color: '#D97706',
    },
    { key: 'high', label: '>= 8.0', count: scoredEvals.filter((e) => Number(e.score) >= 8).length, color: '#059669' },
  ];

  const maxSlots = mentors.length * 2;
  const usedSlots = mentors.reduce((sum, m) => sum + (m.active?.length || 0), 0);
  const mentorRate = maxSlots ? Math.round((usedSlots / maxSlots) * 100) : 0;

  const activeComps = competitions.filter((c) => c.status === 'ACTIVE').length;
  const openRounds = competitions.reduce(
    (sum, c) => sum + (c.rounds || []).filter((r) => r.status === 'OPEN').length,
    0
  );
  const totalRounds = competitions.reduce((sum, c) => sum + (c.rounds || []).length, 0);

  const unreadNotifs = notifications.filter((n) => !n.isRead);
  const alertNotifs = notifications.filter((n) => n.type === 'warning' || n.type === 'error');

  const manageableUsers = users.filter((u) => String(u.role).toLowerCase() !== 'admin');
  const activeUsers = manageableUsers.filter((u) => u.status === 'ACTIVE').length;

  const completedProjects = projects.filter((p) => COMPLETED_PROJECT_STATUSES.has(p.status)).length;
  const totalProjects = backendSummary?.totals?.projects ?? projects.length;
  const completionRate = totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0;

  const pendingGroupBuckets = [
    pendingCancels.length,
    pendingChanges.length,
    unassignedProjects.length,
    pendingEmergencies.length + pendingAppeals.length + deviationProjects.length,
    pendingRewards.length + watchVotes.length,
  ].filter((count) => count > 0).length;

  return {
    totalProjects,
    projectCounts: {
      total: totalProjects,
      completed: completedProjects,
      completionRate,
    },
    pendingCounts: {
      total: queueItems.length,
      activeGroups: pendingGroupBuckets,
    },
    notifStats: {
      items: notifications,
      total: notifications.length,
      unread: unreadNotifs.length,
      alerts: alertNotifs.length,
    },
    userStats: {
      total: backendSummary?.totals?.users ?? manageableUsers.length,
      active: activeUsers,
      mentors: mentors.length,
    },
    chartGroupsByMode: {
      status: buildChartGroups(projects, 'status'),
      level: buildChartGroups(projects, 'level'),
      faculty: buildChartGroups(projects, 'faculty'),
    },
    opsStats: {
      openRounds,
      totalRounds: backendSummary?.totals?.rounds ?? totalRounds,
      evalProgress: {
        rate: evalRate,
        submitted: submittedEvals.length,
        total: evaluations.length,
      },
      mentorProgress: {
        rate: mentorRate,
        usedSlots,
        maxSlots,
      },
      avgScore,
      scoreBuckets,
      quickCounters: {
        activeCompetitions: activeComps,
        totalCompetitions: competitions.length,
        pendingAwardsAndVotes: pendingRewards.length + watchVotes.length,
        todayAuditCount: auditLogs.filter((l) => l.isToday).length,
      },
    },
    queueItems,
  };
}

export const useAdminDashboardStore = defineStore('adminDashboard', () => {
  const toastStore = useToastStore();
  const judgingStore = useAdminJudgingStore();

  // Trạng thái khởi tạo sạch; khi kết nối BE chỉ cần bật useLiveApi = true
  const isLiveApiEnabled = ref(false);
  const rawState = ref(createEmptyDashboardState());
  const backendSummary = ref(null);

  const isLoading = ref(false);
  const isBroadcasting = ref(false);
  const errorMessage = ref('');
  const lastSyncedAt = ref(formatNowTimestamp());

  const chartMode = ref('status');
  const queueType = ref('ALL');
  const notifFilter = ref('ALL');
  const isBroadcastModalOpen = ref(false);

  const systemHealth = ref({
    mongodb: true,
    redis: true,
    queueName: 'bullmq',
  });

  const dashboardMetricsState = computed(() => {
    if (isLiveApiEnabled.value) return rawState.value;
    return {
      ...rawState.value,
      evaluations: judgingStore.evaluations,
      emergencies: judgingStore.emergencies,
      auditLogs: [...judgingStore.auditLogs, ...rawState.value.auditLogs],
    };
  });
  const metrics = computed(() =>
    computeDashboardMetrics(dashboardMetricsState.value, backendSummary.value)
  );
  const currentChartGroups = computed(
    () => metrics.value.chartGroupsByMode[chartMode.value] || []
  );

  const filteredQueueItems = computed(() => {
    const items = metrics.value.queueItems;
    if (queueType.value === 'ALL') return items;
    return items.filter((item) => item.kind === queueType.value);
  });

  const recentQueueItems = computed(() => filteredQueueItems.value.slice(0, OVERVIEW_MAX_RECENT));

  const filteredNotifications = computed(() => {
    const items = metrics.value.notifStats.items;
    if (notifFilter.value === 'UNREAD') return items.filter((n) => !n.isRead);
    if (notifFilter.value === 'ALERT') {
      return items.filter((n) => n.type === 'warning' || n.type === 'error');
    }
    return items;
  });

  const recentNotifications = computed(() =>
    filteredNotifications.value.slice(0, OVERVIEW_MAX_RECENT)
  );

  // Adapter sẵn sàng kết nối BE theo contract GET /admin/dashboard/summary và các endpoint liên quan
  async function fetchLiveDashboardData() {
    const [summaryRes, projectsRes, cancelsRes, changesRes, appealsRes, notifsRes] =
      await Promise.all([
        adminService.getDashboardSummary(),
        adminService.listAdminProjects({ limit: 100 }),
        adminService.listCancellationRequests({ status: 'PENDING', limit: 20 }),
        adminService.listAdminMemberChangeRequests({ status: 'PENDING', limit: 20 }),
        adminService.listAppeals({ status: 'PENDING', limit: 20 }),
        notificationService.getNotifications({ page: 1, limit: 20 }),
      ]);

    backendSummary.value = summaryRes?.data || summaryRes || null;
    const baseState = createEmptyDashboardState();

    const apiProjects = extractItems(projectsRes);
    if (apiProjects.length > 0) {
      baseState.projects = apiProjects.map((p) => ({
        id: String(p._id || p.id),
        code: p.code || '—',
        title: p.title || p.name || 'Dự án chưa đặt tên',
        faculty: p.faculty || 'Khác',
        level: p.level || 'FACULTY',
        status: p.status || 'DRAFT',
        submittedAt: p.createdAt ? formatNowTimestamp(new Date(p.createdAt)) : '-',
        needsAdminReview: Boolean(p.needsAdminReview),
        advisorInfo: p.currentMentor || null,
      }));
    }

    const apiCancels = extractItems(cancelsRes);
    baseState.cancellations = apiCancels.map((c) => ({
      id: String(c._id || c.id),
      project: c.projectId?.code || '—',
      by: c.requesterId?.fullName || c.requesterId?.email || 'Sinh viên',
      reason: c.reason || '',
      date: c.createdAt ? formatShortTime(new Date(c.createdAt)) : '-',
      status: c.status || 'PENDING',
    }));

    const apiChanges = extractItems(changesRes);
    baseState.changeRequests = apiChanges.map((r) => ({
      id: String(r._id || r.id),
      project: r.projectId?.code || '—',
      type: r.type || 'ADD',
      student: r.targetUserId?.fullName || r.targetUserId?.email || 'Thành viên',
      reason: r.reason || '',
      date: r.createdAt ? formatShortTime(new Date(r.createdAt)) : '-',
      status: r.status || 'PENDING',
    }));

    const apiAppeals = extractItems(appealsRes);
    baseState.appeals = apiAppeals.map((a) => ({
      id: String(a._id || a.id),
      projectCode: a.projectId?.code || '—',
      submittedBy: a.submittedBy?.fullName || 'Sinh viên',
      reason: a.reason || '',
      status: a.status || 'PENDING',
      createdAt: a.createdAt ? formatShortTime(new Date(a.createdAt)) : '-',
    }));

    const apiNotifs = extractItems(notifsRes);
    baseState.notifications = apiNotifs.map((n) => ({
      id: String(n._id || n.id),
      recipientRole: n.recipientRole || 'admin',
      title: n.title || 'Thông báo hệ thống',
      content: n.content || n.message || '',
      type: n.type || 'info',
      isRead: Boolean(n.isRead),
      targetNav: 'projects',
      targetSub: '',
      createdAt: n.createdAt ? formatShortTime(new Date(n.createdAt)) : '-',
    }));

    rawState.value = baseState;
  }

  async function loadDashboard({ useLiveApi = isLiveApiEnabled.value, silent = false } = {}) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      if (useLiveApi) {
        await fetchLiveDashboardData();
      }
      lastSyncedAt.value = formatNowTimestamp();
      if (!silent) {
        toastStore.add({
          type: 'success',
          message: useLiveApi
            ? 'Đã đồng bộ dữ liệu tổng quan từ hệ thống.'
            : 'Đã làm mới số liệu thống kê tổng quan.',
        });
      }
    } catch (error) {
      errorMessage.value = error?.message || 'Không thể tải dữ liệu tổng quan hệ thống.';
      toastStore.add({ type: 'error', message: errorMessage.value });
    } finally {
      isLoading.value = false;
    }
  }

  function setChartMode(mode) {
    if (!['status', 'level', 'faculty'].includes(mode)) return;
    chartMode.value = mode;
  }

  function setQueueType(type) {
    queueType.value = type;
  }

  function setNotifFilter(filter) {
    if (!['ALL', 'UNREAD', 'ALERT'].includes(filter)) return;
    notifFilter.value = filter;
  }

  async function markNotificationRead(notifId, { silent = false } = {}) {
    const target = rawState.value.notifications.find((n) => n.id === notifId);
    if (!target || target.isRead) return;

    target.isRead = true;
    try {
      if (isLiveApiEnabled.value) {
        await notificationService.markAsRead(notifId);
      }
      if (!silent) {
        toastStore.add({ type: 'success', message: 'Đã đánh dấu thông báo là đã đọc.' });
      }
    } catch (error) {
      target.isRead = false;
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể cập nhật trạng thái thông báo.',
      });
    }
  }

  async function markAllNotificationsRead() {
    const unreadIds = rawState.value.notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (!unreadIds.length) return;

    rawState.value.notifications.forEach((n) => {
      n.isRead = true;
    });
    try {
      if (isLiveApiEnabled.value) {
        await notificationService.markAllAsRead();
      }
      toastStore.add({
        type: 'success',
        message: `Đã đánh dấu đã đọc ${unreadIds.length} thông báo.`,
      });
    } catch (error) {
      rawState.value.notifications.forEach((n) => {
        if (unreadIds.includes(n.id)) n.isRead = false;
      });
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể đánh dấu tất cả thông báo.',
      });
    }
  }

  async function broadcastNotification({ recipientRole = 'student', title = '', message = '' }) {
    const cleanTitle = String(title).trim();
    const cleanMessage = String(message).trim();
    if (!cleanTitle || !cleanMessage) {
      toastStore.add({
        type: 'warning',
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.',
      });
      return false;
    }

    isBroadcasting.value = true;
    try {
      const roleLabel = ROLES[recipientRole] || recipientRole;
      rawState.value.notifications.unshift({
        id: `ntf-${Date.now()}`,
        recipientRole,
        title: cleanTitle,
        content: `${roleLabel} - ${cleanMessage}`,
        type: 'success',
        isRead: true,
        targetNav: 'awards',
        targetSub: 'awards-news',
        createdAt: formatShortTime(),
      });
      isBroadcastModalOpen.value = false;
      toastStore.add({
        type: 'success',
        message: `Đã phát thông báo «${cleanTitle}» tới nhóm ${roleLabel}.`,
      });
      return true;
    } finally {
      isBroadcasting.value = false;
    }
  }

  function openBroadcastModal() {
    isBroadcastModalOpen.value = true;
  }

  function closeBroadcastModal() {
    isBroadcastModalOpen.value = false;
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isBroadcasting,
    errorMessage,
    lastSyncedAt,
    systemHealth,
    chartMode,
    queueType,
    notifFilter,
    isBroadcastModalOpen,
    metrics,
    currentChartGroups,
    filteredQueueItems,
    recentQueueItems,
    filteredNotifications,
    recentNotifications,
    maxRecent: OVERVIEW_MAX_RECENT,
    loadDashboard,
    setChartMode,
    setQueueType,
    setNotifFilter,
    markNotificationRead,
    markAllNotificationsRead,
    broadcastNotification,
    openBroadcastModal,
    closeBroadcastModal,
  };
});

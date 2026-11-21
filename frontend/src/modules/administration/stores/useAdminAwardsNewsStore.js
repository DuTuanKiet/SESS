import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToastStore } from '@/stores/toast';
import { REWARD_CLAIM_STATUS } from '@/modules/administration/constants/adminConstants';
import { useAdminAuditLogsStore } from '@/modules/administration/stores/useAdminAuditLogsStore';
import { useAdminCompetitionsStore } from '@/modules/administration/stores/useAdminCompetitionsStore';
import { useAdminProjectsStore } from '@/modules/administration/stores/useAdminProjectsStore';
import {
  computeVotingKpis,
  filterNewsItems,
  filterRewardClaims,
  filterVotingCampaigns,
  getCampaignProjectCandidates,
  sortAndFilterCampaignProjects,
} from '@/modules/administration/utils/awardsNewsHelpers';
import {
  formatProjectTimestamp,
  slicePaginatedItems,
} from '@/modules/administration/utils/projectManagementHelpers';

const VALID_AWARDS_TABS = new Set(['awards-claims', 'awards-votes', 'awards-news']);

function createEmptyAwardsNewsState() {
  return {
    competitions: [],
    projects: [],
    rewardClaims: [],
    votingCampaigns: [],
    newsItems: [],
  };
}

/**
 * Pinia store quản lý Trao giải, Bình chọn công khai và Tin tức & Thông báo.
 */
export const useAdminAwardsNewsStore = defineStore('adminAwardsNews', () => {
  const toastStore = useToastStore();

  const isLiveApiEnabled = ref(false);
  const rawState = ref(createEmptyAwardsNewsState());
  const isSubmitting = ref(false);

  const activeTab = ref('awards-claims');
  const selectedCampaignId = ref('');

  const rewardFilters = reactive({
    keyword: '',
    status: '',
  });

  const voteFilters = reactive({
    keyword: '',
    status: '',
    competitionId: '',
  });

  const voteProjectKeyword = ref('');

  const newsFilters = reactive({
    keyword: '',
    category: '',
  });

  const pagination = reactive({
    rewardClaims: { page: 1, pageSize: 5 },
    votingCampaigns: { page: 1, pageSize: 6 },
    campaignProjects: { page: 1, pageSize: 5 },
    newsItems: { page: 1, pageSize: 5 },
  });

  watch(rewardFilters, () => {
    pagination.rewardClaims.page = 1;
  });

  watch(voteFilters, () => {
    pagination.votingCampaigns.page = 1;
  });

  watch(voteProjectKeyword, () => {
    pagination.campaignProjects.page = 1;
  });

  watch(newsFilters, () => {
    pagination.newsItems.page = 1;
  });

  function notify(message, type = 'success') {
    toastStore.add({ message, type });
  }

  function recordAudit(entry) {
    useAdminAuditLogsStore().appendAuditLog(entry);
  }

  // Đọc danh sách cuộc thi & dự án theo phiên từ store tương ứng (fallback về snapshot mock nếu cần)
  const competitionOptions = computed(() => {
    const storeList = useAdminCompetitionsStore().competitions;
    return storeList?.length ? storeList : rawState.value.competitions || [];
  });

  const projectsLookup = computed(() => {
    const storeList = useAdminProjectsStore().projects;
    return storeList?.length ? storeList : rawState.value.projects || [];
  });

  const rewardClaims = computed(() => rawState.value.rewardClaims || []);
  const votingCampaigns = computed(() => rawState.value.votingCampaigns || []);
  const newsItems = computed(() => rawState.value.newsItems || []);

  // Dẫn xuất trực tiếp từ votingCampaigns để tránh lệch trạng thái giữa list chiến dịch và dự án
  const publicVotes = computed(() => votingCampaigns.value.flatMap((vc) => vc.projects || []));

  const hasRewardFilters = computed(() =>
    Boolean(rewardFilters.keyword.trim() || rewardFilters.status)
  );
  const filteredRewardClaims = computed(() =>
    filterRewardClaims(rewardClaims.value, rewardFilters)
  );
  const paginatedRewardClaims = computed(() =>
    slicePaginatedItems(
      filteredRewardClaims.value,
      pagination.rewardClaims.page,
      pagination.rewardClaims.pageSize
    )
  );

  const votingKpis = computed(() => computeVotingKpis(votingCampaigns.value));
  const hasVoteFilters = computed(() =>
    Boolean(voteFilters.keyword.trim() || voteFilters.status || voteFilters.competitionId)
  );
  const filteredVotingCampaigns = computed(() =>
    filterVotingCampaigns(votingCampaigns.value, voteFilters)
  );
  const paginatedVotingCampaigns = computed(() =>
    slicePaginatedItems(
      filteredVotingCampaigns.value,
      pagination.votingCampaigns.page,
      pagination.votingCampaigns.pageSize
    )
  );

  const selectedCampaign = computed(
    () => votingCampaigns.value.find((vc) => vc.id === selectedCampaignId.value) || null
  );

  const selectedCampaignDetail = computed(() =>
    sortAndFilterCampaignProjects(
      selectedCampaign.value,
      voteProjectKeyword.value,
      projectsLookup.value
    )
  );

  const paginatedCampaignProjects = computed(() =>
    slicePaginatedItems(
      selectedCampaignDetail.value.rows,
      pagination.campaignProjects.page,
      pagination.campaignProjects.pageSize
    )
  );

  const hasNewsFilters = computed(() =>
    Boolean(newsFilters.keyword.trim() || newsFilters.category)
  );
  const filteredNewsItems = computed(() => filterNewsItems(newsItems.value, newsFilters));
  const paginatedNewsItems = computed(() =>
    slicePaginatedItems(
      filteredNewsItems.value,
      pagination.newsItems.page,
      pagination.newsItems.pageSize
    )
  );

  function setActiveTab(tabKey) {
    if (!VALID_AWARDS_TABS.has(tabKey)) return;
    activeTab.value = tabKey;
  }

  function setRewardFilter(key, value) {
    if (!(key in rewardFilters)) return;
    rewardFilters[key] = String(value ?? '');
  }

  function resetRewardFilters() {
    rewardFilters.keyword = '';
    rewardFilters.status = '';
    pagination.rewardClaims.page = 1;
  }

  function setVoteFilter(key, value) {
    if (!(key in voteFilters)) return;
    voteFilters[key] = String(value ?? '');
  }

  function resetVoteFilters() {
    voteFilters.keyword = '';
    voteFilters.status = '';
    voteFilters.competitionId = '';
    pagination.votingCampaigns.page = 1;
  }

  function setVoteProjectKeyword(value) {
    voteProjectKeyword.value = String(value ?? '');
  }

  function setNewsFilter(key, value) {
    if (!(key in newsFilters)) return;
    newsFilters[key] = String(value ?? '');
  }

  function resetNewsFilters() {
    newsFilters.keyword = '';
    newsFilters.category = '';
    pagination.newsItems.page = 1;
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

  function openVotingDetail(campaignId) {
    const target = votingCampaigns.value.find((vc) => vc.id === campaignId);
    if (!target) return false;
    selectedCampaignId.value = target.id;
    voteProjectKeyword.value = '';
    pagination.campaignProjects.page = 1;
    return true;
  }

  function closeVotingDetail() {
    selectedCampaignId.value = '';
    voteProjectKeyword.value = '';
    pagination.campaignProjects.page = 1;
  }

  function getProjectCandidatesByCompetition(competitionId) {
    return getCampaignProjectCandidates(
      competitionOptions.value,
      projectsLookup.value,
      competitionId
    );
  }

  function findProjectByIdOrCode(identifier) {
    const key = String(identifier || '').trim();
    if (!key) return null;
    return projectsLookup.value.find((p) => p.id === key || p.code === key) || null;
  }

  function reviewRewardClaim(claimId, { status, note } = {}) {
    const target = rawState.value.rewardClaims.find((rc) => rc.id === claimId);
    if (!target) return false;

    const oldStatus = target.status;
    target.status = String(status || target.status);
    target.note = String(note ?? '').trim();

    recordAudit({
      action: 'REWARD_REVIEW',
      targetEntity: 'RewardClaims',
      targetId: target.projectCode,
      summary: `Cập nhật hồ sơ nhận giải ${target.projectCode} sang ${REWARD_CLAIM_STATUS[target.status]?.label || target.status}`,
      oldValues: { status: oldStatus },
      newValues: { status: target.status, note: target.note },
    });

    notify(`Đã cập nhật hồ sơ nhận giải ${target.projectCode}.`);
    return true;
  }

  function toggleCampaignPublic(campaignId) {
    const campaign = rawState.value.votingCampaigns.find((vc) => vc.id === campaignId);
    if (!campaign) return false;

    const oldPublic = campaign.isPublic;
    const oldStatus = campaign.status;
    campaign.isPublic = !campaign.isPublic;
    campaign.status = campaign.isPublic ? 'ACTIVE' : 'CLOSED';

    recordAudit({
      action: 'COMPETITION_UPDATE',
      targetEntity: 'VotingCampaigns',
      targetId: campaign.id,
      summary: `${campaign.isPublic ? 'Công khai' : 'Đóng bình chọn'} cuộc bình chọn «${campaign.title}»`,
      oldValues: { isPublic: oldPublic, status: oldStatus },
      newValues: { isPublic: campaign.isPublic, status: campaign.status },
    });

    notify(
      campaign.isPublic
        ? `Đã công khai cuộc bình chọn «${campaign.title}».`
        : `Đã đóng bình chọn «${campaign.title}».`
    );
    return true;
  }

  function saveVotingCampaign(campaignId, payload = {}) {
    const title = String(payload.title || '').trim();
    const competitionId = String(payload.competitionId || '').trim();
    const status = String(payload.status || 'PUBLISHED').trim();
    const startDate = String(payload.startDate || '').trim();
    const endDate = String(payload.endDate || '').trim();
    const description = String(payload.description || '').trim();
    const selectedCodes = Array.isArray(payload.selectedCodes)
      ? payload.selectedCodes.map(String).filter(Boolean)
      : [];

    if (!title) {
      notify('Vui lòng nhập tiêu đề cuộc bình chọn.', 'warning');
      return false;
    }
    if (!startDate || !endDate) {
      notify('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc bình chọn.', 'warning');
      return false;
    }
    if (!selectedCodes.length) {
      notify('Vui lòng chọn ít nhất một dự án tham gia cuộc bình chọn.', 'warning');
      return false;
    }

    const comp = competitionOptions.value.find((c) => c.id === competitionId);
    const compTitle = comp?.title || 'Cuộc thi Sáng tạo CTUT 2026';
    const isPublic = status === 'PUBLISHED';
    const nextStatus = isPublic ? 'ACTIVE' : status === 'CLOSED' ? 'CLOSED' : 'DRAFT';
    const existing = campaignId
      ? rawState.value.votingCampaigns.find((vc) => vc.id === campaignId)
      : null;

    if (existing) {
      const oldSummary = {
        title: existing.title,
        isPublic: existing.isPublic,
        projectCount: existing.projects.length,
      };
      const currentMap = new Map(existing.projects.map((p) => [p.projectCode, p]));
      existing.title = title;
      existing.competitionId = competitionId;
      existing.competitionTitle = compTitle;
      existing.startDate = startDate;
      existing.endDate = endDate;
      existing.isPublic = isPublic;
      existing.status = nextStatus;
      existing.description = description;
      existing.projects = selectedCodes.map((code, idx) => {
        if (currentMap.has(code)) {
          return { ...currentMap.get(code), competitionTitle: compTitle };
        }
        return {
          id: `pv-${Date.now()}-${idx}-${code}`,
          projectCode: code,
          competitionTitle: compTitle,
          totalVotes: 0,
          votes24h: 0,
          anomalyStatus: 'NORMAL',
          anomalyNote: 'Chưa có ghi nhận bất thường',
          isLocked: false,
        };
      });
      existing.totalVoters = existing.projects.reduce(
        (sum, p) => sum + (Number(p.totalVotes) || 0),
        0
      );

      recordAudit({
        action: 'COMPETITION_UPDATE',
        targetEntity: 'VotingCampaigns',
        targetId: title.slice(0, 36),
        summary: `Cập nhật cuộc bình chọn «${title}» (${isPublic ? 'Công khai' : nextStatus === 'CLOSED' ? 'Đã đóng bình chọn' : 'Bản nháp'})`,
        oldValues: oldSummary,
        newValues: { title, compTitle, startDate, endDate, isPublic, projectCount: selectedCodes.length },
      });

      notify(`Đã lưu cập nhật cuộc bình chọn «${title}».`);
      return true;
    }

    const newProjects = selectedCodes.map((code, idx) => ({
      id: `pv-${Date.now()}-${idx}-${code}`,
      projectCode: code,
      competitionTitle: compTitle,
      totalVotes: 0,
      votes24h: 0,
      anomalyStatus: 'NORMAL',
      anomalyNote: 'Chưa có ghi nhận bất thường',
      isLocked: false,
    }));

    rawState.value.votingCampaigns.unshift({
      id: `vc-${Date.now()}`,
      title,
      competitionId,
      competitionTitle: compTitle,
      startDate,
      endDate,
      isPublic,
      status: nextStatus,
      description,
      totalVoters: 0,
      votes24h: 0,
      projects: newProjects,
    });
    pagination.votingCampaigns.page = 1;

    recordAudit({
      action: 'COMPETITION_CREATE',
      targetEntity: 'VotingCampaigns',
      targetId: title.slice(0, 36),
      summary: `Tạo mới cuộc bình chọn «${title}» (${isPublic ? 'Công khai' : nextStatus === 'CLOSED' ? 'Đã đóng bình chọn' : 'Bản nháp'})`,
      oldValues: null,
      newValues: { title, compTitle, startDate, endDate, isPublic, projectCount: selectedCodes.length },
    });

    notify(`Đã tạo thành công cuộc bình chọn «${title}».`);
    return true;
  }

  function toggleVoteLock(voteId) {
    let targetProject = null;
    rawState.value.votingCampaigns.forEach((vc) => {
      const found = (vc.projects || []).find((p) => p.id === voteId);
      if (found) targetProject = found;
    });
    if (!targetProject) return false;

    targetProject.isLocked = !targetProject.isLocked;
    notify(
      targetProject.isLocked
        ? `Đã tạm khóa bình chọn cho ${targetProject.projectCode}.`
        : `Đã mở lại bình chọn cho ${targetProject.projectCode}.`
    );
    return true;
  }

  function saveNewsItem(newsId, payload = {}) {
    const title = String(payload.title || '').trim();
    if (!title) {
      notify('Vui lòng nhập tiêu đề bản tin.', 'warning');
      return false;
    }

    const nextPayload = {
      title,
      category: String(payload.category || 'Thông báo'),
      status: String(payload.status || 'PUBLISHED'),
      summary: String(payload.summary || '').trim(),
    };
    const existing = newsId
      ? rawState.value.newsItems.find((item) => item.id === newsId)
      : null;

    if (existing) {
      const oldValues = { category: existing.category, status: existing.status };
      Object.assign(existing, nextPayload);
      recordAudit({
        action: 'NEWS_PUBLISH',
        targetEntity: 'News',
        targetId: title.slice(0, 36),
        summary: `Cập nhật bản tin «${title}»`,
        oldValues,
        newValues: { category: nextPayload.category, status: nextPayload.status },
      });
    } else {
      const todayDate = formatProjectTimestamp(new Date()).split(' ')[0];
      rawState.value.newsItems.unshift({
        id: `nw-${Date.now()}`,
        ...nextPayload,
        publishedAt: todayDate,
        isPinned: false,
      });
      pagination.newsItems.page = 1;
      recordAudit({
        action: 'NEWS_PUBLISH',
        targetEntity: 'News',
        targetId: title.slice(0, 36),
        summary: `Đăng bản tin «${title}»`,
        oldValues: null,
        newValues: { category: nextPayload.category, status: nextPayload.status },
      });
    }

    notify(`Đã lưu bản tin «${title}».`);
    return true;
  }

  function toggleNewsPin(newsId) {
    const item = rawState.value.newsItems.find((n) => n.id === newsId);
    if (!item) return false;

    item.isPinned = !item.isPinned;
    notify(item.isPinned ? 'Đã ghim bản tin lên đầu cổng thông tin.' : 'Đã bỏ ghim bản tin.');
    return true;
  }

  return {
    isLiveApiEnabled,
    isSubmitting,
    activeTab,
    selectedCampaignId,
    rewardFilters,
    voteFilters,
    voteProjectKeyword,
    newsFilters,
    pagination,
    competitionOptions,
    projectsLookup,
    rewardClaims,
    votingCampaigns,
    publicVotes,
    newsItems,
    hasRewardFilters,
    filteredRewardClaims,
    paginatedRewardClaims,
    votingKpis,
    hasVoteFilters,
    filteredVotingCampaigns,
    paginatedVotingCampaigns,
    selectedCampaign,
    selectedCampaignDetail,
    paginatedCampaignProjects,
    hasNewsFilters,
    filteredNewsItems,
    paginatedNewsItems,
    setActiveTab,
    setRewardFilter,
    resetRewardFilters,
    setVoteFilter,
    resetVoteFilters,
    setVoteProjectKeyword,
    setNewsFilter,
    resetNewsFilters,
    setPage,
    setPageSize,
    openVotingDetail,
    closeVotingDetail,
    getProjectCandidatesByCompetition,
    findProjectByIdOrCode,
    reviewRewardClaim,
    toggleCampaignPublic,
    saveVotingCampaign,
    toggleVoteLock,
    saveNewsItem,
    toggleNewsPin,
  };
});

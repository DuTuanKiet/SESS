<template>
  <div class="space-y-5">
    <!-- Tiêu đề trang Trao giải, Bình chọn & Tin tức -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Trao giải, Bình chọn &amp; Tin tức
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Thẩm định hồ sơ nhận giải thưởng sinh viên, giám sát bình chọn công khai và quản lý tin
          tức cuộc thi
        </p>
      </div>
    </div>

    <!-- Thanh chuyển 3 phân mục không kèm badge đếm số -->
    <AdminSubTabs
      :tabs="subTabs"
      :active-key="awardsStore.activeTab"
      aria-label="Phân mục Trao giải, Bình chọn và Tin tức"
      @update:active-key="handleTabChange"
    />

    <AdminSmoothTabTransition>
      <AdminRewardClaimsTab
        v-if="awardsStore.activeTab === 'awards-claims'"
        key="awards-claims"
        :rows="awardsStore.paginatedRewardClaims"
        :filtered-count="awardsStore.filteredRewardClaims.length"
        :filters="awardsStore.rewardFilters"
        :has-filters="awardsStore.hasRewardFilters"
        :page="awardsStore.pagination.rewardClaims.page"
        :page-size="awardsStore.pagination.rewardClaims.pageSize"
        @update-filter="({ key, value }) => awardsStore.setRewardFilter(key, value)"
        @reset-filters="awardsStore.resetRewardFilters()"
        @review="openRewardModal"
        @update:page="(p) => awardsStore.setPage('rewardClaims', p)"
        @update:page-size="(s) => awardsStore.setPageSize('rewardClaims', s)"
      />

      <AdminVotingCampaignsTab
        v-else-if="awardsStore.activeTab === 'awards-votes'"
        key="awards-votes"
        :kpis="awardsStore.votingKpis"
        :rows="awardsStore.paginatedVotingCampaigns"
        :filtered-count="awardsStore.filteredVotingCampaigns.length"
        :filters="awardsStore.voteFilters"
        :has-filters="awardsStore.hasVoteFilters"
        :competition-options="awardsStore.competitionOptions"
        :page="awardsStore.pagination.votingCampaigns.page"
        :page-size="awardsStore.pagination.votingCampaigns.pageSize"
        :selected-campaign="awardsStore.selectedCampaign"
        :selected-campaign-detail="awardsStore.selectedCampaignDetail"
        :paginated-projects="awardsStore.paginatedCampaignProjects"
        :project-keyword="awardsStore.voteProjectKeyword"
        :project-page="awardsStore.pagination.campaignProjects.page"
        :project-page-size="awardsStore.pagination.campaignProjects.pageSize"
        @update-filter="({ key, value }) => awardsStore.setVoteFilter(key, value)"
        @reset-filters="awardsStore.resetVoteFilters()"
        @create-campaign="openVotingModal(null)"
        @edit-campaign="openVotingModal"
        @open-detail="awardsStore.openVotingDetail"
        @close-detail="awardsStore.closeVotingDetail()"
        @toggle-public="awardsStore.toggleCampaignPublic"
        @toggle-lock="awardsStore.toggleVoteLock"
        @view-project="handleOpenProjectDetail"
        @update:page="(p) => awardsStore.setPage('votingCampaigns', p)"
        @update:page-size="(s) => awardsStore.setPageSize('votingCampaigns', s)"
        @update:project-keyword="awardsStore.setVoteProjectKeyword"
        @update:project-page="(p) => awardsStore.setPage('campaignProjects', p)"
        @update:project-page-size="(s) => awardsStore.setPageSize('campaignProjects', s)"
      />

      <AdminNewsTab
        v-else
        key="awards-news"
        :rows="awardsStore.paginatedNewsItems"
        :filtered-count="awardsStore.filteredNewsItems.length"
        :filters="awardsStore.newsFilters"
        :has-filters="awardsStore.hasNewsFilters"
        :page="awardsStore.pagination.newsItems.page"
        :page-size="awardsStore.pagination.newsItems.pageSize"
        @update-filter="({ key, value }) => awardsStore.setNewsFilter(key, value)"
        @reset-filters="awardsStore.resetNewsFilters()"
        @add="openNewsModal(null)"
        @edit="openNewsModal"
        @toggle-pin="awardsStore.toggleNewsPin"
        @update:page="(p) => awardsStore.setPage('newsItems', p)"
        @update:page-size="(s) => awardsStore.setPageSize('newsItems', s)"
      />
    </AdminSmoothTabTransition>

    <AdminRewardClaimReviewModal
      :is-open="rewardModal.isOpen"
      :claim="rewardModal.claim"
      :is-submitting="awardsStore.isSubmitting"
      @close="closeRewardModal"
      @submit="handleRewardSubmit"
    />

    <AdminVotingCampaignModal
      :is-open="votingModal.isOpen"
      :campaign="votingModal.campaign"
      :competitions="awardsStore.competitionOptions"
      :get-candidates="awardsStore.getProjectCandidatesByCompetition"
      :is-submitting="awardsStore.isSubmitting"
      @close="closeVotingModal"
      @submit="handleVotingSubmit"
    />

    <AdminNewsFormModal
      :is-open="newsModal.isOpen"
      :news-item="newsModal.item"
      :is-submitting="awardsStore.isSubmitting"
      @close="closeNewsModal"
      @submit="handleNewsSubmit"
    />

    <AdminProjectDetailModal
      :is-open="Boolean(viewingProject)"
      :project="viewingProject"
      :competition-code="selectedProjectCompetitionCode"
      @close="viewingProject = null"
      @open-attachment="handleOpenProjectAttachment"
      @download-deliverable="handleDownloadDeliverable"
      @trigger-action="handleProjectOperationalAction"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useAdminAwardsNewsStore } from '@/modules/administration/stores/useAdminAwardsNewsStore';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminProjectDetailModal from '@/modules/administration/common/components/projects/AdminProjectDetailModal.vue';
import AdminRewardClaimsTab from '@/modules/administration/components/awards/AdminRewardClaimsTab.vue';
import AdminRewardClaimReviewModal from '@/modules/administration/components/awards/AdminRewardClaimReviewModal.vue';
import AdminVotingCampaignsTab from '@/modules/administration/components/awards/AdminVotingCampaignsTab.vue';
import AdminVotingCampaignModal from '@/modules/administration/components/awards/AdminVotingCampaignModal.vue';
import AdminNewsTab from '@/modules/administration/components/awards/AdminNewsTab.vue';
import AdminNewsFormModal from '@/modules/administration/components/awards/AdminNewsFormModal.vue';

// Trang Trao giải, Bình chọn & Tin tức chuyển đổi từ StaticFE, điều phối 3 subtabs và modal qua Pinia store
const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const awardsStore = useAdminAwardsNewsStore();

const DEFAULT_TAB = 'awards-claims';
const subTabs = [
  { key: 'awards-claims', label: 'Hồ sơ nhận giải' },
  { key: 'awards-votes', label: 'Bình chọn công khai' },
  { key: 'awards-news', label: 'Tin tức & Thông báo' },
];

const rewardModal = reactive({
  isOpen: false,
  claim: null,
});

const votingModal = reactive({
  isOpen: false,
  campaign: null,
});

const newsModal = reactive({
  isOpen: false,
  item: null,
});

const viewingProject = ref(null);

const selectedProjectCompetitionCode = computed(() => {
  const compId = viewingProject.value?.competitionId;
  if (!compId) return '';
  const comp = awardsStore.competitionOptions.find((c) => c.id === compId);
  return comp?.code || '';
});

watch(
  () => route.query.tab,
  (queryTab) => {
    const target = subTabs.some((t) => t.key === queryTab) ? String(queryTab) : DEFAULT_TAB;
    awardsStore.setActiveTab(target);
  },
  { immediate: true }
);

function handleTabChange(tabKey) {
  if (!subTabs.some((t) => t.key === tabKey) || tabKey === awardsStore.activeTab) return;
  awardsStore.setActiveTab(tabKey);
  const nextQuery = { ...route.query };
  if (tabKey === DEFAULT_TAB) delete nextQuery.tab;
  else nextQuery.tab = tabKey;
  router.replace({ query: Object.keys(nextQuery).length ? nextQuery : undefined });
}

function openRewardModal(claim) {
  if (!claim) return;
  rewardModal.claim = claim;
  rewardModal.isOpen = true;
}

function closeRewardModal() {
  rewardModal.isOpen = false;
  rewardModal.claim = null;
}

function handleRewardSubmit({ claimId, status, note }) {
  const isSuccess = awardsStore.reviewRewardClaim(claimId, { status, note });
  if (isSuccess) closeRewardModal();
}

function openVotingModal(campaign) {
  votingModal.campaign = campaign || null;
  votingModal.isOpen = true;
}

function closeVotingModal() {
  votingModal.isOpen = false;
  votingModal.campaign = null;
}

function handleVotingSubmit(payload) {
  const isSuccess = awardsStore.saveVotingCampaign(payload.campaignId, payload);
  if (isSuccess) closeVotingModal();
}

function openNewsModal(item) {
  newsModal.item = item || null;
  newsModal.isOpen = true;
}

function closeNewsModal() {
  newsModal.isOpen = false;
  newsModal.item = null;
}

function handleNewsSubmit(payload) {
  const isSuccess = awardsStore.saveNewsItem(payload.newsId, payload);
  if (isSuccess) closeNewsModal();
}

function handleOpenProjectDetail(project) {
  if (!project) return;
  viewingProject.value = project;
}

function handleOpenProjectAttachment(attachment) {
  if (!attachment) return;
  toastStore.add({
    type: 'info',
    message: `Mở file thuyết minh: ${attachment.name}`,
  });
}

function handleDownloadDeliverable(item) {
  if (!item) return;
  toastStore.add({
    type: 'info',
    message: `Tải về: ${item.name}`,
  });
}

function handleProjectOperationalAction({ action, project }) {
  if (!project || !action) return;
  viewingProject.value = null;
  if (action === 'assignMentor') {
    toastStore.add({
      type: 'info',
      message: `Đang chuyển sang điều phối cố vấn cho dự án ${project.code}.`,
    });
    router.push({
      path: '/admin/mentor-assignments',
      query: { projectId: project.id },
    });
    return;
  }
  toastStore.add({
    type: 'info',
    message: `Đang chuyển sang khu vực điều hành dự án ${project.code}.`,
  });
  router.push({ path: '/admin/projects', query: { projectId: project.id, action } });
}
</script>

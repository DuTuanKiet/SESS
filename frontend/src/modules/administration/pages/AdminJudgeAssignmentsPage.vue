<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-[#0F172A]">Chấm điểm &amp; Phúc khảo</h1>
      <p class="mt-1 text-sm text-slate-500">
        Quản lý hội đồng, phân công phiếu chấm, điều chuyển giám khảo và lưu lịch sử điều chỉnh điểm.
      </p>
    </div>

    <AdminSubTabs
      :tabs="tabs"
      :active-key="activeTab"
      aria-label="Phân hệ Chấm điểm và Phúc khảo"
      @update:active-key="handleTabChange"
    />

    <AdminSmoothTabTransition>
      <component
        :is="activeTabComponent"
        :key="activeTab"
        @create-council="openModal('council-form')"
        @view-council="openModal('council-detail', { councilId: $event })"
        @edit-council="handleEditCouncil"
        @assign-round="handleAssignRound"
        @create-emergency="openModal('emergency')"
        @create-override="openModal('override')"
        @revoke="handleRevokeRequest"
        @view-project="openProject"
      />
    </AdminSmoothTabTransition>

    <AdminJudgingCouncilFormModal
      v-if="modal.key === 'council-form'"
      :is-open="true"
      :council-id="modal.payload.councilId || ''"
      @close="closeModal"
      @saved="closeModal"
    />
    <AdminJudgingCouncilDetailModal
      v-if="modal.key === 'council-detail'"
      :is-open="true"
      :council-id="modal.payload.councilId"
      @close="closeModal"
      @edit-council="handleEditCouncil"
      @assign-round="handleAssignRound"
      @view-project="openProject"
    />
    <AdminJudgingAssignRoundModal
      v-if="modal.key === 'assign-round'"
      :is-open="true"
      :council-id="modal.payload.councilId || ''"
      @close="closeModal"
      @saved="closeModal"
    />
    <AdminJudgingEmergencyModal
      v-if="modal.key === 'emergency'"
      :is-open="true"
      @close="closeModal"
      @saved="closeModal"
    />
    <AdminJudgingOverrideModal
      v-if="modal.key === 'override'"
      :is-open="true"
      @close="closeModal"
      @saved="closeModal"
    />
    <AdminJudgingRevokeModal
      v-if="modal.key === 'revoke'"
      :is-open="true"
      :kind="modal.payload.kind"
      :record-id="modal.payload.recordId"
      @close="closeModal"
      @saved="closeModal"
    />
    <AdminProjectDetailModal
      v-if="modal.key === 'project'"
      :is-open="true"
      :project="selectedProject"
      :competition-code="selectedCompetition?.code || ''"
      @close="closeModal"
      @open-attachment="handleOpenAttachment"
      @download-deliverable="handleDownloadDeliverable"
      @trigger-action="handleProjectAction"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import AdminProjectDetailModal from '@/modules/administration/common/components/projects/AdminProjectDetailModal.vue';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminJudgingAssignRoundModal from '@/modules/administration/components/judging/AdminJudgingAssignRoundModal.vue';
import AdminJudgingAssignmentsTab from '@/modules/administration/components/judging/AdminJudgingAssignmentsTab.vue';
import AdminJudgingCouncilDetailModal from '@/modules/administration/components/judging/AdminJudgingCouncilDetailModal.vue';
import AdminJudgingCouncilFormModal from '@/modules/administration/components/judging/AdminJudgingCouncilFormModal.vue';
import AdminJudgingCouncilsTab from '@/modules/administration/components/judging/AdminJudgingCouncilsTab.vue';
import AdminJudgingEmergenciesTab from '@/modules/administration/components/judging/AdminJudgingEmergenciesTab.vue';
import AdminJudgingEmergencyModal from '@/modules/administration/components/judging/AdminJudgingEmergencyModal.vue';
import AdminJudgingOverrideModal from '@/modules/administration/components/judging/AdminJudgingOverrideModal.vue';
import AdminJudgingOverridesTab from '@/modules/administration/components/judging/AdminJudgingOverridesTab.vue';
import AdminJudgingRevokeModal from '@/modules/administration/components/judging/AdminJudgingRevokeModal.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const judgingStore = useAdminJudgingStore();

const tabs = [
  { key: 'judging-councils', label: 'Hội đồng giám khảo' },
  { key: 'judging-assign', label: 'Phân công chấm vòng thi' },
  { key: 'judging-emergency', label: 'Điều chuyển khẩn cấp' },
  { key: 'judging-override', label: 'Điều chỉnh điểm' },
];
const defaultTab = 'judging-councils';
const activeTab = ref(defaultTab);
const modal = ref({ key: '', payload: {} });

const activeTabComponent = computed(() => {
  const components = {
    'judging-councils': AdminJudgingCouncilsTab,
    'judging-assign': AdminJudgingAssignmentsTab,
    'judging-emergency': AdminJudgingEmergenciesTab,
    'judging-override': AdminJudgingOverridesTab,
  };
  return components[activeTab.value] || AdminJudgingCouncilsTab;
});
const selectedProject = computed(() =>
  judgingStore.getProjectByIdOrCode(modal.value.payload.projectId)
);
const selectedCompetition = computed(() =>
  judgingStore.competitions.find((item) => item.id === selectedProject.value?.competitionId)
);

// Query giữ tab đang chọn khi mở trực tiếp từ Tổng quan và khi dùng Back/Forward.
watch(
  () => route.query.tab,
  (queryTab) => {
    activeTab.value = tabs.some((tab) => tab.key === queryTab) ? queryTab : defaultTab;
  },
  { immediate: true }
);

function openModal(key, payload = {}) {
  modal.value = { key, payload };
}

function closeModal() {
  modal.value = { key: '', payload: {} };
}

async function handleTabChange(tabKey) {
  if (!tabs.some((tab) => tab.key === tabKey) || tabKey === activeTab.value) return;
  const query = { ...route.query };
  if (tabKey === defaultTab) delete query.tab;
  else query.tab = tabKey;
  await router.push({ query: Object.keys(query).length ? query : undefined });
}

function handleEditCouncil(councilId) {
  closeModal();
  openModal('council-form', { councilId });
}

async function handleAssignRound(councilId = '') {
  closeModal();
  const council = judgingStore.councils.find((item) => item.id === councilId);
  if (council) {
    judgingStore.setFilter(
      'assignmentsRoundKey',
      `${council.competitionId}:${council.roundNumber}`
    );
  }
  if (activeTab.value !== 'judging-assign') await handleTabChange('judging-assign');
  openModal('assign-round', { councilId });
}

function handleRevokeRequest(payload) {
  if (!payload?.kind || !payload?.recordId) return;
  openModal('revoke', payload);
}

function openProject(projectId) {
  if (!judgingStore.getProjectByIdOrCode(projectId)) return;
  openModal('project', { projectId });
}

function handleOpenAttachment(attachment) {
  if (!attachment) return;
  toastStore.add({ type: 'info', message: `Mô phỏng mở file thuyết minh: ${attachment.name}` });
}

function handleDownloadDeliverable(item) {
  if (!item) return;
  toastStore.add({ type: 'info', message: `Mô phỏng tải về: ${item.name}` });
}

function handleProjectAction({ action, project }) {
  if (!project || !action) return;
  closeModal();
  router.push({ path: '/admin/projects', query: { projectId: project.id, action } });
}
</script>

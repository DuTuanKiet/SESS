<template>
  <div class="space-y-5">
    <!-- Thanh tiêu đề trang quản lý dự án & thành viên -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dự án &amp; Thành viên</h1>
        <p class="mt-1 text-xs text-slate-500">
          Theo dõi vòng đời dự án toàn trường, xét duyệt đơn xin hủy và xử lý thay đổi thành viên nhóm.
        </p>
      </div>
    </div>

    <div
      v-if="projectsStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ projectsStore.errorMessage }}
    </div>

    <!-- Thanh chuyển 3 phân mục kèm badge số lượng yêu cầu đang chờ duyệt -->
    <AdminSubTabs
      :tabs="subTabs"
      :active-key="projectsStore.activeTab"
      aria-label="Phân mục quản lý dự án và thành viên"
      @update:active-key="projectsStore.setActiveTab"
    />

    <AdminSmoothTabTransition>
      <AdminProjectsLifecycleTab
        v-if="projectsStore.activeTab === 'projects-list'"
        key="projects-list"
        :rows="projectsStore.paginatedProjects"
        :total-count="projectsStore.projects.length"
        :filtered-count="projectsStore.filteredProjects.length"
        :filters="projectsStore.projectFilters"
        :has-filters="projectsStore.hasProjectFilters"
        :competition-options="projectsStore.competitionOptions"
        :category-options="projectsStore.categoryOptions"
        :competition-code-map="projectsStore.competitionCodeMap"
        :page="projectsStore.pagination.projects.page"
        :page-size="projectsStore.pagination.projects.pageSize"
        @update-filter="handleProjectFilterUpdate"
        @reset-filters="projectsStore.resetProjectFilters()"
        @view-detail="handleOpenProjectDetail"
        @update:page="(p) => projectsStore.setPage('projects', p)"
        @update:page-size="(s) => projectsStore.setPageSize('projects', s)"
      />

      <AdminProjectCancellationsTab
        v-else-if="projectsStore.activeTab === 'projects-cancel'"
        key="projects-cancel"
        :rows="projectsStore.paginatedCancellations"
        :filtered-count="projectsStore.filteredCancellations.length"
        :status-filter="projectsStore.cancelStatusFilter"
        :project-title-map="projectsStore.projectTitleByCodeMap"
        :page="projectsStore.pagination.cancels.page"
        :page-size="projectsStore.pagination.cancels.pageSize"
        @update:status-filter="projectsStore.setCancelStatusFilter"
        @preview-file="handlePreviewCancellationFile"
        @review="openCancellationReviewModal"
        @update:page="(p) => projectsStore.setPage('cancels', p)"
        @update:page-size="(s) => projectsStore.setPageSize('cancels', s)"
      />

      <AdminMemberChangesTab
        v-else
        key="projects-change"
        :rows="projectsStore.paginatedChangeRequests"
        :filtered-count="projectsStore.filteredChangeRequests.length"
        :status-filter="projectsStore.changeStatusFilter"
        :page="projectsStore.pagination.changes.page"
        :page-size="projectsStore.pagination.changes.pageSize"
        @update:status-filter="projectsStore.setChangeStatusFilter"
        @respond="openMemberChangeModal"
        @update:page="(p) => projectsStore.setPage('changes', p)"
        @update:page-size="(s) => projectsStore.setPageSize('changes', s)"
      />
    </AdminSmoothTabTransition>

    <!-- Tái sử dụng modal xem chi tiết hồ sơ dự án và các modal thao tác vòng đời -->
    <AdminProjectDetailModal
      :is-open="Boolean(viewingProject)"
      :project="viewingProject"
      :competition-code="projectsStore.getCompetitionCode(viewingProject?.competitionId)"
      @close="viewingProjectId = ''"
      @open-attachment="handleOpenProjectAttachment"
      @download-deliverable="handleDownloadDeliverable"
      @trigger-action="handleProjectOperationalAction"
    />

    <AdminProjectStatusModal
      :is-open="Boolean(statusModalProject)"
      :project="statusModalProject"
      :is-submitting="projectsStore.isSubmitting"
      @close="statusModalProjectId = ''"
      @submit="handleStatusModalSubmit"
    />

    <AdminProjectPromoteModal
      :is-open="Boolean(promoteModalProject)"
      :project="promoteModalProject"
      :is-submitting="projectsStore.isSubmitting"
      @close="promoteModalProjectId = ''"
      @submit="handlePromoteModalSubmit"
    />

    <AdminProjectTransferOwnerModal
      :is-open="Boolean(transferModalProject)"
      :project="transferModalProject"
      :is-submitting="projectsStore.isSubmitting"
      @close="transferModalProjectId = ''"
      @submit="handleTransferModalSubmit"
    />

    <AdminReassignMentorModal
      :is-open="Boolean(reassignModalProject)"
      :project="reassignTargetAdapter"
      :current-mentor="reassignCurrentMentor"
      :available-mentors="reassignAvailableMentors"
      :is-submitting="projectsStore.isSubmitting"
      @close="reassignModalProjectId = ''"
      @submit="handleReassignMentorSubmit"
    />

    <AdminProjectRequestReviewModal
      :is-open="requestReviewModal.isOpen"
      :mode="requestReviewModal.mode"
      :item="requestReviewModal.item"
      :is-submitting="projectsStore.isSubmitting"
      @close="closeRequestReviewModal"
      @submit="handleRequestReviewSubmit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { useAdminProjectsStore } from '@/modules/administration/stores/useAdminProjectsStore';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminProjectDetailModal from '@/modules/administration/common/components/projects/AdminProjectDetailModal.vue';
import AdminReassignMentorModal from '@/modules/administration/components/mentors/AdminReassignMentorModal.vue';
import AdminProjectsLifecycleTab from '@/modules/administration/components/projects/AdminProjectsLifecycleTab.vue';
import AdminProjectCancellationsTab from '@/modules/administration/components/projects/AdminProjectCancellationsTab.vue';
import AdminMemberChangesTab from '@/modules/administration/components/projects/AdminMemberChangesTab.vue';
import AdminProjectStatusModal from '@/modules/administration/components/projects/AdminProjectStatusModal.vue';
import AdminProjectPromoteModal from '@/modules/administration/components/projects/AdminProjectPromoteModal.vue';
import AdminProjectTransferOwnerModal from '@/modules/administration/components/projects/AdminProjectTransferOwnerModal.vue';
import AdminProjectRequestReviewModal from '@/modules/administration/components/projects/AdminProjectRequestReviewModal.vue';

// Trang Dự án & Thành viên chuyển đổi từ StaticFE, điều phối 3 subtabs và modal qua Pinia store
const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const projectsStore = useAdminProjectsStore();

const viewingProjectId = ref('');
const statusModalProjectId = ref('');
const promoteModalProjectId = ref('');
const transferModalProjectId = ref('');
const reassignModalProjectId = ref('');

const requestReviewModal = reactive({
  isOpen: false,
  mode: 'cancel',
  item: null,
});

const subTabs = computed(() => [
  { key: 'projects-list', label: 'Vòng đời dự án' },
  {
    key: 'projects-cancel',
    label: 'Đơn xin hủy'
  },
  {
    key: 'projects-change',
    label: 'Thay đổi thành viên'
  },
]);

const viewingProject = computed(() =>
  projectsStore.findProjectByIdOrCode(viewingProjectId.value)
);
const statusModalProject = computed(() =>
  projectsStore.findProjectByIdOrCode(statusModalProjectId.value)
);
const promoteModalProject = computed(() =>
  projectsStore.findProjectByIdOrCode(promoteModalProjectId.value)
);
const transferModalProject = computed(() =>
  projectsStore.findProjectByIdOrCode(transferModalProjectId.value)
);
const reassignModalProject = computed(() =>
  projectsStore.findProjectByIdOrCode(reassignModalProjectId.value)
);

const reassignTargetAdapter = computed(() => {
  const proj = reassignModalProject.value;
  if (!proj) return null;
  return {
    projectId: proj.id,
    code: proj.code,
    displayLabel: proj.code,
  };
});

const reassignCurrentMentor = computed(() =>
  projectsStore.resolveCurrentMentorForProject(reassignModalProject.value)
);

const reassignAvailableMentors = computed(() =>
  projectsStore.getAvailableReassignMentors(reassignModalProject.value)
);

function handleProjectFilterUpdate({ key, value }) {
  projectsStore.setProjectFilter(key, value);
}

function handleOpenProjectDetail(project) {
  if (!project) return;
  viewingProjectId.value = project.id;
}

function handlePreviewCancellationFile(fileName) {
  if (!fileName) return;
  toastStore.add({
    type: 'info',
    message: `Mở tệp ${fileName}`,
  });
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

function openActionModalByKey(action, project) {
  if (!project) return;
  if (action === 'assignMentor') {
    router.push({
      path: '/admin/mentor-assignments',
      query: { projectId: project.id },
    });
    return;
  }
  if (action === 'projectStatus') {
    statusModalProjectId.value = project.id;
    return;
  }
  if (action === 'promote') {
    promoteModalProjectId.value = project.id;
    return;
  }
  if (action === 'transferOwner') {
    transferModalProjectId.value = project.id;
    return;
  }
  if (action === 'reassignMentor') {
    reassignModalProjectId.value = project.id;
    return;
  }
  viewingProjectId.value = project.id;
}

function handleProjectOperationalAction({ action, project }) {
  if (!project) return;
  viewingProjectId.value = '';
  openActionModalByKey(action, project);
}

async function handleStatusModalSubmit(payload) {
  if (!statusModalProject.value) return;
  const isSuccess = await projectsStore.changeProjectStatus(statusModalProject.value.id, payload);
  if (isSuccess) {
    statusModalProjectId.value = '';
  }
}

async function handlePromoteModalSubmit(payload) {
  if (!promoteModalProject.value) return;
  const isSuccess = await projectsStore.promoteProject(promoteModalProject.value.id, payload);
  if (isSuccess) {
    promoteModalProjectId.value = '';
  }
}

async function handleTransferModalSubmit(payload) {
  if (!transferModalProject.value) return;
  const isSuccess = await projectsStore.transferProjectOwner(
    transferModalProject.value.id,
    payload
  );
  if (isSuccess) {
    transferModalProjectId.value = '';
  }
}

async function handleReassignMentorSubmit(payload) {
  const isSuccess = await projectsStore.reassignProjectMentor(payload);
  if (isSuccess) {
    reassignModalProjectId.value = '';
  }
}

function openCancellationReviewModal(item) {
  if (!item) return;
  requestReviewModal.mode = 'cancel';
  requestReviewModal.item = item;
  requestReviewModal.isOpen = true;
}

function openMemberChangeModal(item) {
  if (!item) return;
  requestReviewModal.mode = 'change';
  requestReviewModal.item = item;
  requestReviewModal.isOpen = true;
}

function closeRequestReviewModal() {
  requestReviewModal.isOpen = false;
  requestReviewModal.item = null;
}

async function handleRequestReviewSubmit(payload) {
  if (!requestReviewModal.item) return;
  const isSuccess =
    requestReviewModal.mode === 'cancel'
      ? await projectsStore.reviewCancellation(requestReviewModal.item.id, payload)
      : await projectsStore.respondMemberChange(requestReviewModal.item.id, payload);
  if (isSuccess) {
    closeRequestReviewModal();
  }
}

// Đồng bộ deep-link từ Dashboard (?tab=...) và Quản lý cuộc thi (?competitionId=... / ?projectId=...&action=...)
function syncRouteQuery(query = {}) {
  const tab = String(query?.tab || '').trim();
  if (tab) {
    projectsStore.setActiveTab(tab);
  }

  const competitionId = String(query?.competitionId || '').trim();
  if (competitionId) {
    projectsStore.setActiveTab('projects-list');
    projectsStore.setProjectFilter('competitionId', competitionId);
  }

  const projectId = String(query?.projectId || '').trim();
  const action = String(query?.action || '').trim();
  if (projectId) {
    const matched = projectsStore.findProjectByIdOrCode(projectId);
    if (matched) {
      projectsStore.setActiveTab('projects-list');
      openActionModalByKey(action || 'detail', matched);
    }
    const nextQuery = { ...query };
    delete nextQuery.projectId;
    delete nextQuery.action;
    router.replace({ query: Object.keys(nextQuery).length ? nextQuery : undefined });
  }
}

watch(
  () => [
    route.query?.tab,
    route.query?.competitionId,
    route.query?.projectId,
    route.query?.action,
  ],
  () => {
    syncRouteQuery(route.query);
  }
);

onMounted(async () => {
  await projectsStore.loadProjectsData({ silent: true });
  syncRouteQuery(route.query);
});
</script>

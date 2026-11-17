<template>
  <div class="space-y-5">
    <!-- Thanh tiêu đề trang điều phối cố vấn -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Điều phối cố vấn</h1>
        <p class="mt-1 text-xs text-slate-500">
          Chọn dự án chưa có cố vấn ở cột trái và phân công cố vấn còn chỉ tiêu hướng dẫn (tối đa 2 dự án/cố vấn).
        </p>
      </div>

      <button
        type="button"
        :disabled="mentorStore.isLoading"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="handleRefresh"
      >
        {{ mentorStore.isLoading ? 'Đang đồng bộ...' : 'Làm mới' }}
      </button>
    </div>

    <div
      v-if="mentorStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ mentorStore.errorMessage }}
    </div>

    <!-- Bố cục 2 cột: Dự án chờ phân công (trái) & Bảng cố vấn/chỉ tiêu (phải) -->
    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      <div class="min-w-0 xl:col-span-5">
        <AdminUnassignedProjectsPanel
          :rows="mentorStore.paginatedUnassignedProjects"
          :filtered-count="mentorStore.filteredUnassignedProjects.length"
          :selected-project-id="mentorStore.selectedProjectId"
          :filters="mentorStore.unassignedFilters"
          :has-filters="mentorStore.hasUnassignedFilters"
          :is-loading="mentorStore.isLoading"
          :page="mentorStore.unassignedPagination.page"
          :page-size="mentorStore.unassignedPagination.pageSize"
          @update-filter="handleUnassignedFilterUpdate"
          @reset-filters="mentorStore.resetUnassignedFilters()"
          @toggle-select="mentorStore.toggleSelectProject"
          @update:page="mentorStore.setUnassignedPage"
          @update:page-size="mentorStore.setUnassignedPageSize"
        />
      </div>

      <div class="min-w-0 xl:col-span-7">
        <AdminMentorsQuotaTable
          :rows="mentorStore.paginatedMentors"
          :filtered-count="mentorStore.filteredMentors.length"
          :availability="mentorStore.availability"
          :selected-project="mentorStore.selectedProject"
          :is-loading="mentorStore.isLoading"
          :page="mentorStore.mentorsPagination.page"
          :page-size="mentorStore.mentorsPagination.pageSize"
          @update:availability="mentorStore.setAvailability"
          @clear-selected-project="mentorStore.clearSelectedProject()"
          @assign="openAssignModal"
          @reassign="openReassignModal"
          @view-history="openHistoryModal"
          @update:page="mentorStore.setMentorsPage"
          @update:page-size="mentorStore.setMentorsPageSize"
        />
      </div>
    </div>

    <AdminAssignMentorModal
      :is-open="assignModal.isOpen"
      :project="mentorStore.selectedProject"
      :mentor="assignModal.mentor"
      :is-submitting="mentorStore.isSubmitting"
      @close="closeAssignModal"
      @submit="handleAssignSubmit"
    />

    <AdminReassignMentorModal
      :is-open="reassignModal.isOpen"
      :project="reassignModal.project"
      :current-mentor="reassignModal.currentMentor"
      :available-mentors="availableReassignMentors"
      :is-submitting="mentorStore.isSubmitting"
      @close="closeReassignModal"
      @submit="handleReassignSubmit"
    />

    <AdminMentorHistoryModal
      :is-open="historyModal.isOpen"
      :project="historyModal.project"
      :entries="historyModal.entries"
      :is-loading="mentorStore.isLoadingHistory"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminMentorAssignmentsStore } from '@/modules/administration/stores/useAdminMentorAssignmentsStore';
import AdminUnassignedProjectsPanel from '@/modules/administration/components/mentors/AdminUnassignedProjectsPanel.vue';
import AdminMentorsQuotaTable from '@/modules/administration/components/mentors/AdminMentorsQuotaTable.vue';
import AdminAssignMentorModal from '@/modules/administration/components/mentors/AdminAssignMentorModal.vue';
import AdminReassignMentorModal from '@/modules/administration/components/mentors/AdminReassignMentorModal.vue';
import AdminMentorHistoryModal from '@/modules/administration/components/mentors/AdminMentorHistoryModal.vue';

// Trang điều phối cố vấn chuyển đổi từ StaticFE, điều phối dữ liệu qua Pinia store sẵn sàng cho Live API
const route = useRoute();
const mentorStore = useAdminMentorAssignmentsStore();

const assignModal = reactive({
  isOpen: false,
  mentor: null,
});

const reassignModal = reactive({
  isOpen: false,
  project: null,
  currentMentor: null,
});

const historyModal = reactive({
  isOpen: false,
  project: null,
  entries: [],
});

const availableReassignMentors = computed(() =>
  mentorStore.getAvailableReassignMentors(reassignModal.currentMentor?.id || '')
);

function handleRefresh() {
  mentorStore.loadMentorAssignments({ silent: false });
}

function handleUnassignedFilterUpdate({ key, value }) {
  mentorStore.setUnassignedFilter(key, value);
}

function openAssignModal(mentor) {
  if (!mentorStore.selectedProject || !mentor) return;
  assignModal.mentor = mentor;
  assignModal.isOpen = true;
}

function closeAssignModal() {
  assignModal.isOpen = false;
  assignModal.mentor = null;
}

async function handleAssignSubmit(payload) {
  const isSuccess = await mentorStore.assignMentor(payload);
  if (isSuccess) {
    closeAssignModal();
  }
}

function openReassignModal({ project, mentor }) {
  if (!project || !mentor) return;
  reassignModal.project = project;
  reassignModal.currentMentor = mentor;
  reassignModal.isOpen = true;
}

function closeReassignModal() {
  reassignModal.isOpen = false;
  reassignModal.project = null;
  reassignModal.currentMentor = null;
}

async function handleReassignSubmit(payload) {
  const isSuccess = await mentorStore.reassignMentor(payload);
  if (isSuccess) {
    closeReassignModal();
  }
}

async function openHistoryModal(project) {
  if (!project) return;
  historyModal.project = project;
  historyModal.entries = [];
  historyModal.isOpen = true;
  historyModal.entries = await mentorStore.fetchProjectAssignmentHistory(project);
}

function closeHistoryModal() {
  historyModal.isOpen = false;
  historyModal.project = null;
  historyModal.entries = [];
}

watch(
  () => route.query?.projectId,
  (nextProjectId) => {
    if (nextProjectId) {
      mentorStore.preselectProject(nextProjectId);
    }
  }
);

onMounted(async () => {
  await mentorStore.loadMentorAssignments({ silent: true });
  if (route.query?.projectId) {
    mentorStore.preselectProject(route.query.projectId);
  }
});
</script>

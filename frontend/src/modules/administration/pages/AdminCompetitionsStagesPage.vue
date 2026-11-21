<template>
  <div class="space-y-5">
    <AdminSmoothTabTransition>
      <!-- View 1: Danh sách thẻ cuộc thi gọn (mặc định khi vào trang) -->
      <div v-if="!isDetailMode" key="comp-list" class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Quản lý cuộc thi</h1>
          <p class="mt-1 text-sm text-slate-500">
            Chọn một cuộc thi để xem chi tiết, chỉnh sửa thông tin, quản lý vòng thi và cơ cấu giải thưởng
          </p>
        </div>

        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="openCreateCompetitionModal"
        >
          + Tạo cuộc thi
        </button>
      </div>

      <div
        v-if="competitionsStore.errorMessage"
        class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
        role="alert"
      >
        {{ competitionsStore.errorMessage }}
      </div>

      <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]">
              Danh sách cuộc thi
            </h2>
            <span class="text-xs text-slate-400">
              Hiển thị {{ competitionsStore.filteredCompetitions.length }}/{{
                competitionsStore.competitions.length
              }}
              cuộc thi
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="competitionsStore.filters.keyword"
              type="text"
              placeholder="Tìm tên, mã hoặc đơn vị..."
              class="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            />

            <select
              v-model="competitionsStore.filters.status"
              aria-label="Lọc theo trạng thái cuộc thi"
              class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="UPCOMING">Sắp mở</option>
              <option value="CLOSED">Đã kết thúc</option>
            </select>

            <select
              v-model="competitionsStore.filters.faculty"
              aria-label="Lọc theo khoa tham gia"
              class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            >
              <option value="">Tất cả khoa tham gia</option>
              <option
                v-for="fac in competitionsStore.activeFaculties"
                :key="fac.id"
                :value="fac.name"
              >
                {{ fac.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="competitionsStore.isLoading" class="py-12 text-center text-xs text-slate-400">
          Đang tải danh sách cuộc thi...
        </div>

        <ul v-else class="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="comp in competitionsStore.filteredCompetitions"
            :key="comp.id"
            class="list-none"
          >
            <AdminCompetitionCard
              :competition="comp"
              :projects-count="competitionsStore.getCompetitionProjectsCount(comp)"
              :prize-formatted="calculateCompetitionPrizeSummary(comp).formatted"
              :faculty-summary="competitionsStore.formatCompetitionFacultiesSummary(comp)"
              @select="handleSelectCompetition"
            />
          </li>

          <li
            v-if="!competitionsStore.filteredCompetitions.length"
            class="col-span-full py-10 text-center text-xs text-slate-400"
          >
            Không có cuộc thi phù hợp với bộ lọc hiện tại
          </li>
        </ul>
      </section>
    </div>

      <!-- View 2: Trang chi tiết cuộc thi (hiển thị khi admin chọn một cuộc thi) -->
      <div v-else-if="selectedComp" key="comp-detail" class="space-y-5">
        <AdminCompetitionDetailHeader
          :competition="selectedComp"
          :projects-count="competitionsStore.selectedCompetitionProjects.length"
          :prize-formatted="competitionsStore.selectedCompetitionPrizeSummary.formatted"
          @back="handleBackToList"
          @edit="openEditCompetitionModal"
          @change-status="isStatusModalOpen = true"
        />

        <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]">
          <div class="px-5 pt-3.5">
            <AdminSubTabs
              :tabs="detailTabs"
              :active-key="competitionsStore.detailTab"
              aria-label="Phân mục chi tiết cuộc thi"
              @update:active-key="competitionsStore.setDetailTab"
            />
          </div>

          <AdminSmoothTabTransition>
            <AdminCompetitionOverviewTab
              v-if="competitionsStore.detailTab === 'overview'"
              key="comp-tab-overview"
              :competition="selectedComp"
              :linked-categories="competitionsStore.selectedCompetitionCategories"
              :active-faculties-count="competitionsStore.activeFaculties.length"
              :prize-formatted="competitionsStore.selectedCompetitionPrizeSummary.formatted"
              @edit="openEditCompetitionModal"
              @open-guideline="handleOpenGuideline"
            />

            <AdminCompetitionRoundsTab
              v-else-if="competitionsStore.detailTab === 'rounds'"
              key="comp-tab-rounds"
              :competition="selectedComp"
              @add-round="openRoundModal(null)"
              @edit-round="openRoundModal"
              @delete-round="handleDeleteRound"
            />

            <AdminCompetitionAwardsTab
              v-else-if="competitionsStore.detailTab === 'awards'"
              key="comp-tab-awards"
              :competition="selectedComp"
              :prize-summary="competitionsStore.selectedCompetitionPrizeSummary"
              @add-award="openAwardModal(null)"
              @edit-award="openAwardModal"
              @delete-award="handleDeleteAward"
            />

            <AdminCompetitionProjectsTab
              v-else
              key="comp-tab-projects"
              :competition-id="selectedComp.id"
              :projects="competitionsStore.paginatedCompetitionProjects"
              :total-projects="competitionsStore.selectedCompetitionProjects.length"
              :page="competitionsStore.projectsPagination.page"
              :page-size="competitionsStore.projectsPagination.pageSize"
              @view-project="handleOpenProjectDetail"
              @open-projects-page="handleOpenProjectsPage"
              @update:page="competitionsStore.setProjectsPage"
              @update:page-size="competitionsStore.setProjectsPageSize"
            />
          </AdminSmoothTabTransition>
        </section>
      </div>
    </AdminSmoothTabTransition>

    <!-- Các modal quản trị cuộc thi, vòng thi, giải thưởng và chi tiết dự án -->
    <AdminCompetitionFormModal
      :is-open="isCompetitionFormOpen"
      :competition="editingCompetition"
      :faculties="competitionsStore.faculties"
      :categories="competitionsStore.activeCategories"
      :linked-category-ids="editingLinkedCategoryIds"
      :is-submitting="competitionsStore.isSubmitting"
      @close="closeCompetitionFormModal"
      @submit="handleCompetitionFormSubmit"
    />

    <AdminCompetitionStatusModal
      :is-open="isStatusModalOpen"
      :competition="selectedComp"
      :is-submitting="competitionsStore.isSubmitting"
      @close="isStatusModalOpen = false"
      @submit="handleStatusModalSubmit"
    />

    <AdminCompetitionRoundModal
      :is-open="isRoundModalOpen"
      :competition="selectedComp"
      :round="editingRound"
      :evidence-types="competitionsStore.selectedCompetitionEvidenceTypes"
      :rubric-options="competitionsStore.rubricOptions"
      :is-submitting="competitionsStore.isSubmitting"
      @close="closeRoundModal"
      @submit="handleRoundModalSubmit"
    />

    <AdminCompetitionAwardModal
      :is-open="isAwardModalOpen"
      :competition-code="selectedComp?.code || ''"
      :award="editingAward"
      :is-submitting="competitionsStore.isSubmitting"
      @close="closeAwardModal"
      @submit="handleAwardModalSubmit"
    />

    <AdminProjectDetailModal
      :is-open="Boolean(viewingProject)"
      :project="viewingProject"
      :competition-code="selectedComp?.code || ''"
      @close="viewingProject = null"
      @open-attachment="handleOpenProjectAttachment"
      @download-deliverable="handleDownloadDeliverable"
      @trigger-action="handleProjectOperationalAction"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import {
  calculateCompetitionPrizeSummary,
  useAdminCompetitionsStore,
} from '@/modules/administration/stores/useAdminCompetitionsStore';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminSmoothTabTransition from '@/modules/administration/common/components/ui/AdminSmoothTabTransition.vue';
import AdminProjectDetailModal from '@/modules/administration/common/components/projects/AdminProjectDetailModal.vue';
import AdminCompetitionCard from '@/modules/administration/components/competitions/AdminCompetitionCard.vue';
import AdminCompetitionDetailHeader from '@/modules/administration/components/competitions/AdminCompetitionDetailHeader.vue';
import AdminCompetitionOverviewTab from '@/modules/administration/components/competitions/AdminCompetitionOverviewTab.vue';
import AdminCompetitionRoundsTab from '@/modules/administration/components/competitions/AdminCompetitionRoundsTab.vue';
import AdminCompetitionAwardsTab from '@/modules/administration/components/competitions/AdminCompetitionAwardsTab.vue';
import AdminCompetitionProjectsTab from '@/modules/administration/components/competitions/AdminCompetitionProjectsTab.vue';
import AdminCompetitionFormModal from '@/modules/administration/components/competitions/AdminCompetitionFormModal.vue';
import AdminCompetitionStatusModal from '@/modules/administration/components/competitions/AdminCompetitionStatusModal.vue';
import AdminCompetitionRoundModal from '@/modules/administration/components/competitions/AdminCompetitionRoundModal.vue';
import AdminCompetitionAwardModal from '@/modules/administration/components/competitions/AdminCompetitionAwardModal.vue';

// Trang quản lý cuộc thi quản trị theo mô hình Master-Detail, sẵn sàng chuyển sang Live API qua Pinia store
const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const competitionsStore = useAdminCompetitionsStore();

const isCompetitionFormOpen = ref(false);
const editingCompetition = ref(null);
const isStatusModalOpen = ref(false);
const isRoundModalOpen = ref(false);
const editingRoundIndex = ref(null);
const isAwardModalOpen = ref(false);
const editingAwardIndex = ref(null);
const viewingProject = ref(null);

const selectedComp = computed(() => competitionsStore.selectedCompetition);
const isDetailMode = computed(
  () => competitionsStore.viewMode === 'detail' && Boolean(selectedComp.value)
);

const detailTabs = [
  { key: 'overview', label: 'Thông tin & Khoa tham gia' },
  { key: 'rounds', label: 'Quản lý vòng thi' },
  { key: 'awards', label: 'Cơ cấu giải thưởng' },
  { key: 'projects', label: 'Dự án tham gia' },
];

const editingLinkedCategoryIds = computed(() => {
  if (!editingCompetition.value) return [];
  return competitionsStore.getCompetitionCategories(editingCompetition.value.id, true).map((c) => c.id);
});

const editingRound = computed(() => {
  if (editingRoundIndex.value === null || !selectedComp.value) return null;
  return selectedComp.value.rounds?.[editingRoundIndex.value] || null;
});

const editingAward = computed(() => {
  if (editingAwardIndex.value === null || !selectedComp.value) return null;
  return selectedComp.value.awards?.[editingAwardIndex.value] || null;
});

function handleSelectCompetition(competitionId) {
  if (!competitionsStore.selectCompetition(competitionId)) return;
  window.scrollTo({ top: 0 });
}

function handleBackToList() {
  competitionsStore.backToList();
  window.scrollTo({ top: 0 });
}

function openCreateCompetitionModal() {
  editingCompetition.value = null;
  isCompetitionFormOpen.value = true;
}

function openEditCompetitionModal() {
  if (!selectedComp.value) return;
  editingCompetition.value = selectedComp.value;
  isCompetitionFormOpen.value = true;
}

function closeCompetitionFormModal() {
  isCompetitionFormOpen.value = false;
  editingCompetition.value = null;
}

async function handleCompetitionFormSubmit(payload) {
  const isSuccess = editingCompetition.value
    ? await competitionsStore.updateCompetition(editingCompetition.value.id, payload)
    : await competitionsStore.createCompetition(payload);
  if (isSuccess) {
    closeCompetitionFormModal();
  }
}

async function handleStatusModalSubmit(payload) {
  if (!selectedComp.value) return;
  const isSuccess = await competitionsStore.updateCompetitionStatus(selectedComp.value.id, payload);
  if (isSuccess) {
    isStatusModalOpen.value = false;
  }
}

function openRoundModal(roundIndex) {
  editingRoundIndex.value = typeof roundIndex === 'number' ? roundIndex : null;
  isRoundModalOpen.value = true;
}

function closeRoundModal() {
  isRoundModalOpen.value = false;
  editingRoundIndex.value = null;
}

async function handleRoundModalSubmit(payload) {
  if (!selectedComp.value) return;
  const isSuccess = await competitionsStore.saveRound(
    selectedComp.value.id,
    editingRoundIndex.value,
    payload
  );
  if (isSuccess) {
    closeRoundModal();
  }
}

async function handleDeleteRound(roundIndex) {
  if (!selectedComp.value) return;
  await competitionsStore.deleteRound(selectedComp.value.id, roundIndex);
}

function openAwardModal(awardIndex) {
  editingAwardIndex.value = typeof awardIndex === 'number' ? awardIndex : null;
  isAwardModalOpen.value = true;
}

function closeAwardModal() {
  isAwardModalOpen.value = false;
  editingAwardIndex.value = null;
}

async function handleAwardModalSubmit(payload) {
  if (!selectedComp.value) return;
  const isSuccess = await competitionsStore.saveAward(
    selectedComp.value.id,
    editingAwardIndex.value,
    payload
  );
  if (isSuccess) {
    closeAwardModal();
  }
}

async function handleDeleteAward(awardIndex) {
  if (!selectedComp.value) return;
  await competitionsStore.deleteAward(selectedComp.value.id, awardIndex);
}

function handleOpenGuideline(comp) {
  if (!comp?.guidelineFile) return;
  if (comp.guidelineFileData) {
    const link = document.createElement('a');
    link.href = comp.guidelineFileData;
    link.download = comp.guidelineFile;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toastStore.add({
      type: 'info',
      message: `Đang tải xuống tệp thể lệ «${comp.guidelineFile}».`,
    });
    return;
  }
  toastStore.add({
    type: 'info',
    message: `Mở tệp thể lệ ${comp.guidelineFile}`,
  });
}

function handleOpenProjectDetail(project) {
  viewingProject.value = project;
}

function handleOpenProjectsPage(competitionId) {
  router.push({
    path: '/admin/projects',
    query: { competitionId },
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

function handleProjectOperationalAction({ action, project }) {
  if (!project) return;
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
  const query = { projectId: project.id, action };
  toastStore.add({
    type: 'info',
    message: `Đang chuyển sang khu vực điều hành dự án ${project.code}.`,
  });
  router.push({ path: '/admin/projects', query });
}

onMounted(async () => {
  await competitionsStore.loadCompetitions({ silent: true });
  const deepCompId = String(route.query?.competitionId || '').trim();
  const deepTab = String(route.query?.tab || 'overview').trim();
  if (deepCompId) {
    competitionsStore.selectCompetition(deepCompId, deepTab);
  } else {
    competitionsStore.backToList();
  }
});
</script>

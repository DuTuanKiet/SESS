<template>
  <div class="space-y-5">
    <!-- Thông báo lỗi hệ thống (nếu có) -->
    <div
      v-if="rubricsStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ rubricsStore.errorMessage }}
    </div>

    <!-- Chuyển đổi mượt mà giữa Grid View và Detail View (tránh giật lag giao diện) -->
    <Transition name="fade-slide" mode="out-in">
      <AdminRubricGridView
        v-if="rubricsStore.viewMode === 'grid'"
        key="grid-view"
        @create-rubric="handleOpenCreateRubric"
        @edit-rubric="handleOpenEditRubric"
        @import-excel="handleOpenImport"
      />

      <AdminRubricDetailView
        v-else
        key="detail-view"
        @edit-rubric="handleOpenEditRubric"
        @view-versions="handleOpenVersions"
        @import-excel="handleOpenImport"
        @add-criterion="handleOpenAddCriterion"
        @edit-criterion="handleOpenEditCriterion"
      />
    </Transition>

    <!-- Modal Tạo / Sửa Bộ tiêu chí -->
    <AdminRubricFormModal
      :is-open="rubricModalState.isOpen"
      :item="rubricModalState.item"
      @close="rubricModalState.isOpen = false"
    />

    <!-- Modal Thêm / Sửa Tiêu chí -->
    <AdminRubricCriterionModal
      :is-open="criterionModalState.isOpen"
      :rubric-id="criterionModalState.rubricId"
      :item="criterionModalState.item"
      @close="criterionModalState.isOpen = false"
    />

    <!-- Modal Nhập Excel / CSV (UI xem trước) -->
    <AdminRubricImportModal
      :is-open="importModalState.isOpen"
      :target-rubric-id="importModalState.targetId"
      @close="importModalState.isOpen = false"
    />

    <!-- Modal Lịch sử các phiên bản -->
    <AdminRubricVersionsModal
      :is-open="versionsModalState.isOpen"
      :rubric-name="versionsModalState.rubricName"
      @close="versionsModalState.isOpen = false"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';

import AdminRubricGridView from '../components/rubrics/AdminRubricGridView.vue';
import AdminRubricDetailView from '../components/rubrics/AdminRubricDetailView.vue';
import AdminRubricFormModal from '../components/rubrics/AdminRubricFormModal.vue';
import AdminRubricCriterionModal from '../components/rubrics/AdminRubricCriterionModal.vue';
import AdminRubricImportModal from '../components/rubrics/AdminRubricImportModal.vue';
import AdminRubricVersionsModal from '../components/rubrics/AdminRubricVersionsModal.vue';

const rubricsStore = useAdminRubricsStore();

// Quản lý trạng thái các Modal
const rubricModalState = reactive({
  isOpen: false,
  item: null,
});

const criterionModalState = reactive({
  isOpen: false,
  rubricId: '',
  item: null,
});

const importModalState = reactive({
  isOpen: false,
  targetId: null,
});

const versionsModalState = reactive({
  isOpen: false,
  rubricName: '',
});

// Các hàm mở Modal
function handleOpenCreateRubric() {
  rubricModalState.item = null;
  rubricModalState.isOpen = true;
}

function handleOpenEditRubric(rubric) {
  rubricModalState.item = rubric;
  rubricModalState.isOpen = true;
}

function handleOpenAddCriterion() {
  criterionModalState.rubricId = rubricsStore.selectedRubricId;
  criterionModalState.item = null;
  criterionModalState.isOpen = true;
}

function handleOpenEditCriterion(criterion) {
  criterionModalState.rubricId = rubricsStore.selectedRubricId;
  criterionModalState.item = criterion;
  criterionModalState.isOpen = true;
}

function handleOpenImport(targetId) {
  importModalState.targetId = targetId;
  importModalState.isOpen = true;
}

function handleOpenVersions(rubricName) {
  versionsModalState.rubricName = rubricName;
  versionsModalState.isOpen = true;
}

onMounted(() => {
  rubricsStore.initialize();
});
</script>

<style scoped>
/* Hiệu ứng chuyển động mượt mà giữa Grid View và Detail View */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.22s ease-out, transform 0.22s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

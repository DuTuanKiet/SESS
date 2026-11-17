<template>
  <div class="space-y-5">
    <!-- Thanh tiêu đề trang Danh mục dữ liệu & Minh chứng -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Danh mục dữ liệu &amp; Minh chứng
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Quản lý lĩnh vực đề tài, loại minh chứng nộp bài gắn theo cuộc thi và danh mục khoa chuyên
          môn toàn trường
        </p>
      </div>
    </div>

    <div
      v-if="catalogsStore.errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
      role="alert"
    >
      {{ catalogsStore.errorMessage }}
    </div>

    <!-- 3 thẻ KPI tương tác: bấm để chuyển nhanh tới từng phân mục danh mục -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AdminKpiCard
        label="Thể loại đề tài đang mở"
        :value="catalogsStore.activeCategoriesCount"
        tone="navy"
        subtext="Gắn theo từng cuộc thi hoặc toàn hệ thống"
        hover-action-text="Xem →"
        @select="catalogsStore.jumpFromKpi('catalog-categories')"
      />

      <AdminKpiCard
        label="Loại minh chứng & sản phẩm nộp"
        :value="catalogsStore.activeEvidenceTypesCount"
        tone="blue"
        subtext="Cấu hình cho vòng thi, thuyết minh & mốc tiến độ"
        hover-action-text="Xem →"
        @select="catalogsStore.jumpFromKpi('catalog-evidences')"
      />

      <AdminKpiCard
        label="Khoa chuyên môn đang hoạt động"
        :value="catalogsStore.activeFacultiesCount"
        tone="emerald"
        subtext="Đồng bộ bộ lọc cuộc thi, dự án & whitelist"
        hover-action-text="Xem →"
        @select="catalogsStore.jumpFromKpi('catalog-faculties')"
      />
    </div>

    <!-- Thanh chuyển 3 phân mục danh mục -->
    <AdminSubTabs
      :tabs="subTabs"
      :active-key="catalogsStore.activeTab"
      aria-label="Phân mục danh mục dữ liệu"
      @update:active-key="catalogsStore.setActiveTab"
    />

    <AdminCatalogCategoriesTab
      v-if="catalogsStore.activeTab === 'catalog-categories'"
      :rows="catalogsStore.paginatedCategories"
      :total-count="catalogsStore.projectCategories.length"
      :filtered-count="catalogsStore.filteredCategories.length"
      :filters="catalogsStore.categoryFilters"
      :has-filters="catalogsStore.hasCategoryFilters"
      :competition-options="catalogsStore.competitionOptions"
      :competition-by-id-map="catalogsStore.competitionByIdMap"
      :project-counts-map="catalogsStore.categoryProjectCountsMap"
      :page="catalogsStore.pagination.categories.page"
      :page-size="catalogsStore.pagination.categories.pageSize"
      @update-filter="({ key, value }) => catalogsStore.setCategoryFilter(key, value)"
      @reset-filters="catalogsStore.resetCategoryFilters()"
      @add="openCategoryModal(null)"
      @edit="openCategoryModal"
      @toggle-status="(id) => catalogsStore.toggleCatalogStatus('category', id)"
      @update:page="(p) => catalogsStore.setPage('categories', p)"
      @update:page-size="(s) => catalogsStore.setPageSize('categories', s)"
    />

    <AdminCatalogEvidenceTypesTab
      v-else-if="catalogsStore.activeTab === 'catalog-evidences'"
      :rows="catalogsStore.paginatedEvidenceTypes"
      :total-count="catalogsStore.evidenceTypes.length"
      :filtered-count="catalogsStore.filteredEvidenceTypes.length"
      :filters="catalogsStore.evidenceFilters"
      :has-filters="catalogsStore.hasEvidenceFilters"
      :competition-options="catalogsStore.competitionOptions"
      :competition-by-id-map="catalogsStore.competitionByIdMap"
      :page="catalogsStore.pagination.evidences.page"
      :page-size="catalogsStore.pagination.evidences.pageSize"
      @update-filter="({ key, value }) => catalogsStore.setEvidenceFilter(key, value)"
      @reset-filters="catalogsStore.resetEvidenceFilters()"
      @add="openEvidenceModal(null)"
      @edit="openEvidenceModal"
      @toggle-status="(id) => catalogsStore.toggleCatalogStatus('evidence', id)"
      @update:page="(p) => catalogsStore.setPage('evidences', p)"
      @update:page-size="(s) => catalogsStore.setPageSize('evidences', s)"
    />

    <AdminCatalogFacultiesTab
      v-else
      :rows="catalogsStore.paginatedFaculties"
      :total-count="catalogsStore.faculties.length"
      :filtered-count="catalogsStore.filteredFaculties.length"
      :keyword="catalogsStore.facultyFilters.keyword"
      :has-filters="catalogsStore.hasFacultyFilters"
      :faculty-stats-map="catalogsStore.facultyStatsMap"
      :page="catalogsStore.pagination.faculties.page"
      :page-size="catalogsStore.pagination.faculties.pageSize"
      @update:keyword="catalogsStore.setFacultyFilter"
      @reset-filters="catalogsStore.resetFacultyFilters()"
      @add="openFacultyModal(null)"
      @edit="openFacultyModal"
      @toggle-status="(id) => catalogsStore.toggleCatalogStatus('faculty', id)"
      @update:page="(p) => catalogsStore.setPage('faculties', p)"
      @update:page-size="(s) => catalogsStore.setPageSize('faculties', s)"
    />

    <!-- Các modal thêm/sửa Thể loại, Loại minh chứng và Khoa chuyên môn -->
    <AdminCatalogCategoryModal
      :is-open="categoryModal.isOpen"
      :category="categoryModal.item"
      :competitions="catalogsStore.competitionOptions"
      :is-submitting="catalogsStore.isSubmitting"
      @close="closeCategoryModal"
      @submit="handleCategorySubmit"
    />

    <AdminCatalogEvidenceModal
      :is-open="evidenceModal.isOpen"
      :evidence-type="evidenceModal.item"
      :competitions="catalogsStore.competitionOptions"
      :is-submitting="catalogsStore.isSubmitting"
      @close="closeEvidenceModal"
      @submit="handleEvidenceSubmit"
    />

    <AdminCatalogFacultyModal
      :is-open="facultyModal.isOpen"
      :faculty="facultyModal.item"
      :is-submitting="catalogsStore.isSubmitting"
      @close="closeFacultyModal"
      @submit="handleFacultySubmit"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAdminCatalogsStore } from '@/modules/administration/stores/useAdminCatalogsStore';
import AdminKpiCard from '@/modules/administration/components/dashboard/AdminKpiCard.vue';
import AdminSubTabs from '@/modules/administration/common/components/ui/AdminSubTabs.vue';
import AdminCatalogCategoriesTab from '@/modules/administration/components/catalogs/AdminCatalogCategoriesTab.vue';
import AdminCatalogEvidenceTypesTab from '@/modules/administration/components/catalogs/AdminCatalogEvidenceTypesTab.vue';
import AdminCatalogFacultiesTab from '@/modules/administration/components/catalogs/AdminCatalogFacultiesTab.vue';
import AdminCatalogCategoryModal from '@/modules/administration/components/catalogs/AdminCatalogCategoryModal.vue';
import AdminCatalogEvidenceModal from '@/modules/administration/components/catalogs/AdminCatalogEvidenceModal.vue';
import AdminCatalogFacultyModal from '@/modules/administration/components/catalogs/AdminCatalogFacultyModal.vue';

// Trang quản lý Danh mục dữ liệu & Minh chứng chuyển đổi từ StaticFE, điều phối 3 subtabs và đồng bộ SSOT qua Pinia store
const route = useRoute();
const catalogsStore = useAdminCatalogsStore();

const subTabs = [
  { key: 'catalog-categories', label: 'Thể loại / Lĩnh vực đề tài' },
  { key: 'catalog-evidences', label: 'Loại minh chứng & Tài liệu nộp' },
  { key: 'catalog-faculties', label: 'Khoa chuyên môn & Cấp thi' },
];

const categoryModal = reactive({
  isOpen: false,
  item: null,
});

const evidenceModal = reactive({
  isOpen: false,
  item: null,
});

const facultyModal = reactive({
  isOpen: false,
  item: null,
});

function openCategoryModal(item) {
  categoryModal.item = item || null;
  categoryModal.isOpen = true;
}

function closeCategoryModal() {
  categoryModal.isOpen = false;
  categoryModal.item = null;
}

async function handleCategorySubmit(payload) {
  const isSuccess = await catalogsStore.saveCategory(categoryModal.item?.id || null, payload);
  if (isSuccess) {
    closeCategoryModal();
  }
}

function openEvidenceModal(item) {
  evidenceModal.item = item || null;
  evidenceModal.isOpen = true;
}

function closeEvidenceModal() {
  evidenceModal.isOpen = false;
  evidenceModal.item = null;
}

async function handleEvidenceSubmit(payload) {
  const isSuccess = await catalogsStore.saveEvidenceType(evidenceModal.item?.id || null, payload);
  if (isSuccess) {
    closeEvidenceModal();
  }
}

function openFacultyModal(item) {
  facultyModal.item = item || null;
  facultyModal.isOpen = true;
}

function closeFacultyModal() {
  facultyModal.isOpen = false;
  facultyModal.item = null;
}

async function handleFacultySubmit(payload) {
  const isSuccess = await catalogsStore.saveFaculty(facultyModal.item?.id || null, payload);
  if (isSuccess) {
    closeFacultyModal();
  }
}

function syncTabFromQuery(tabQuery) {
  const normalized = String(tabQuery || '').trim();
  if (normalized) {
    catalogsStore.setActiveTab(normalized);
  }
}

watch(
  () => route.query?.tab,
  (nextTab) => {
    syncTabFromQuery(nextTab);
  }
);

onMounted(async () => {
  await catalogsStore.loadCatalogs({ silent: true });
  syncTabFromQuery(route.query?.tab);
});
</script>

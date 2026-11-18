<template>
  <div v-if="rubric" class="space-y-6">
    <!-- Breadcrumb & Back Navigation Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:border-[#1E56D9] hover:bg-[#F1F7FF] hover:text-[#1E56D9]"
          @click="rubricsStore.backToGrid"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại danh sách bộ tiêu chí
        </button>
        <span class="text-slate-300">/</span>
        <span class="text-xs font-bold text-slate-800">{{ rubric.name }}</span>
        <span class="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1E56D9]">
          v{{ rubric.version }}
        </span>
        <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="emit('view-versions', rubric.name)"
        >
          Các phiên bản
        </button>
        <button
          type="button"
          :disabled="!isEditable"
          class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          @click="emit('edit-rubric', rubric)"
        >
          Sửa thông tin
        </button>
        <button
          type="button"
          :disabled="rubric.status !== 'Draft' || !isComplete"
          class="rounded-xl bg-[#1E56D9] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
          @click="rubricsStore.activateRubric(rubric.id)"
        >
          Kích hoạt áp dụng
        </button>
      </div>
    </div>

    <!-- Khối Thông tin & Kiểm soát Tổng trọng số -->
    <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-6">
        <div>
          <div class="flex flex-wrap items-center gap-2.5">
            <h2 class="text-xl font-bold tracking-tight text-slate-900">{{ rubric.name }}</h2>
            <span class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#1E56D9]">
              Phiên bản {{ rubric.version }}
            </span>
            <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
          </div>
          <p class="mt-1.5 text-xs text-slate-500">
            Mã định danh: <code class="font-mono text-slate-700">{{ rubric.id }}</code> - Quy mô:
            <strong>{{ criteriaCount }} tiêu chí</strong> - Thang điểm chuẩn:
            <strong>0 – 10 điểm</strong>
          </p>
          <p v-if="rubric.description" class="mt-2 text-xs text-slate-600">
            {{ rubric.description }}
          </p>
        </div>

        <!-- Đồng hồ đo trọng số trực quan -->
        <div
          class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-[#F8FAFC] px-5 py-3.5"
        >
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tổng trọng số hiện tại
            </p>
            <div class="mt-0.5 flex items-center gap-2">
              <span
                class="text-2xl font-black transition-colors duration-300"
                :class="isComplete ? 'text-emerald-600' : 'text-amber-600'"
              >
                {{ totalWeight }}%
              </span>
              <span class="text-xs font-medium text-slate-400">/ 100%</span>
            </div>
          </div>
          <div class="w-36">
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="isComplete ? 'bg-emerald-500' : 'bg-amber-400'"
                :style="{ width: `${Math.min(totalWeight, 100)}%` }"
              />
            </div>
            <p
              class="mt-1 text-[10px] font-medium transition-colors duration-300"
              :class="isComplete ? 'text-emerald-700' : 'text-amber-700'"
            >
              {{ isComplete ? '✓ Đủ điều kiện kích hoạt' : `Thiếu ${100 - totalWeight}% nữa` }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Thanh Thao Tác Excel & Quản lý Tiêu chí -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Thao tác Excel:
        </span>
        <button
          type="button"
          :disabled="!isEditable"
          class="flex items-center gap-1.5 rounded-xl bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
          @click="emit('import-excel', rubric.id)"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Nhập tiêu chí từ Excel / CSV
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="rubricsStore.downloadTemplate"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Tải file mẫu (.csv)
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="rubricsStore.exportRubricCsv(rubric.id)"
        >
          <svg class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Xuất danh sách ra CSV
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="isEditable"
          type="button"
          class="rounded-xl border border-[#1E56D9]/30 bg-[#F1F7FF] px-3.5 py-2 text-xs font-semibold text-[#1E56D9] shadow-sm transition hover:bg-[#1E56D9]/10"
          @click="emit('add-criterion')"
        >
          + Thêm tiêu chí thủ công
        </button>
      </div>
    </div>

    <!-- Bảng Dữ Liệu Tiêu Chí Đầy Đủ -->
    <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-600 font-semibold">
              <th class="w-12 py-3 px-4 text-center">#</th>
              <th class="min-w-[260px] py-3 px-4">Tiêu chí &amp; Hướng dẫn đánh giá</th>
              <th class="w-32 py-3 px-4 text-center">Trọng số (%)</th>
              <th class="w-32 py-3 px-4 text-center">Thang điểm</th>
              <th class="w-44 py-3 px-4">Tỷ lệ đóng góp</th>
              <th class="w-28 py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(c, i) in rubric.criteria"
              :key="c.id || i"
              class="transition-colors duration-150 hover:bg-slate-50/50"
            >
              <td class="whitespace-nowrap py-3.5 px-4 text-center text-xs font-semibold text-slate-400">
                {{ i + 1 }}
              </td>
              <td class="min-w-[260px] py-3.5 px-4">
                <p class="text-sm font-bold text-slate-800">{{ c.name }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-500">
                  {{ c.desc || 'Chưa có mô tả hướng dẫn chi tiết.' }}
                </p>
              </td>
              <td class="whitespace-nowrap py-3.5 px-4 text-center">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#1E56D9]'"
                >
                  {{ c.weight }}%
                </span>
              </td>
              <td class="whitespace-nowrap py-3.5 px-4 text-center text-xs font-medium text-slate-700">
                {{ c.min }} – {{ c.max }} điểm
              </td>
              <td class="py-3.5 px-4">
                <div class="w-full">
                  <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-[#1E56D9] transition-all duration-300"
                      :style="{ width: `${Math.min(c.weight, 100)}%` }"
                    />
                  </div>
                  <span class="mt-1 block text-[10px] font-medium text-slate-400">
                    {{ c.weight }} / 100 phần trăm
                  </span>
                </div>
              </td>
              <td class="py-3.5 px-4 text-right">
                <div class="flex justify-end gap-1.5 whitespace-nowrap">
                  <template v-if="isEditable">
                    <button
                      type="button"
                      class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      @click="emit('edit-criterion', c)"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      class="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                      @click="handleDelete(c)"
                    >
                      Xóa
                    </button>
                  </template>
                  <span v-else class="text-xs italic text-slate-400">Đã khóa</span>
                </div>
              </td>
            </tr>

            <!-- Empty state tiêu chí -->
            <tr v-if="!rubric.criteria || rubric.criteria.length === 0">
              <td colspan="6" class="py-14 text-center">
                <div class="mx-auto max-w-sm">
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h4 class="mt-3 text-sm font-bold text-slate-700">
                    Chưa có tiêu chí nào trong bộ này
                  </h4>
                  <p class="mt-1 text-xs text-slate-400">
                    Bạn có thể nạp nhanh bảng tiêu chí từ tệp Excel / CSV hoặc thêm từng tiêu chí bằng tay.
                  </p>
                  <div v-if="isEditable" class="mt-4 flex justify-center gap-2">
                    <button
                      type="button"
                      class="rounded-xl bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                      @click="emit('import-excel', rubric.id)"
                    >
                      Nhập từ Excel / CSV
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      @click="emit('add-criterion')"
                    >
                      + Thêm tiêu chí
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { RUBRIC_STATUS } from '@/modules/administration/constants/adminConstants';

const rubricsStore = useAdminRubricsStore();

const emit = defineEmits([
  'edit-rubric',
  'view-versions',
  'import-excel',
  'add-criterion',
  'edit-criterion',
]);

const rubric = computed(() => rubricsStore.selectedRubric);

const statusMeta = computed(() => {
  return RUBRIC_STATUS[rubric.value?.status] || {
    label: rubric.value?.status || 'Chưa rõ',
    tone: 'slate',
  };
});

const totalWeight = computed(() => rubricsStore.selectedRubricTotalWeight);
const isComplete = computed(() => rubricsStore.isSelectedRubricComplete);
const isEditable = computed(() => rubricsStore.isSelectedRubricEditable);
const criteriaCount = computed(() => rubric.value?.criteria?.length || 0);

function handleDelete(criterion) {
  if (!rubric.value) return;
  const ok = window.confirm(`Bạn có chắc chắn muốn xóa tiêu chí «${criterion.name}» không?`);
  if (ok) {
    rubricsStore.deleteCriterion(rubric.value.id, criterion.id);
  }
}
</script>

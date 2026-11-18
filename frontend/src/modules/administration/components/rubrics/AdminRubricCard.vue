<template>
  <div
    class="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#1E56D9]/50 hover:shadow-md cursor-pointer"
    @click="emit('view-detail', rubric.id)"
  >
    <div>
      <!-- Thẻ Header: Phiên bản & Trạng thái -->
      <div class="flex items-center justify-between gap-3">
        <span class="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1E56D9]">
          Phiên bản {{ rubric.version }}
        </span>
        <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
      </div>

      <!-- Tên bộ tiêu chí -->
      <h3
        class="mt-3.5 text-base font-bold text-slate-800 transition-colors duration-200 group-hover:text-[#1E56D9] line-clamp-1"
      >
        {{ rubric.name }}
      </h3>

      <!-- Thông số tóm tắt -->
      <div class="mt-2.5 flex items-center gap-4 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5 font-medium text-slate-700">
          <svg class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          {{ criteriaCount }} tiêu chí
        </span>
        <span class="text-slate-300">•</span>
        <span class="inline-flex items-center gap-1.5 text-slate-500">
          <svg class="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
          </svg>
          Thang 0 – 10 điểm
        </span>
      </div>

      <!-- Khối Tổng trọng số -->
      <div class="mt-4 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-600">Tổng trọng số tiêu chí</span>
          <span class="font-bold" :class="isComplete ? 'text-emerald-700' : 'text-amber-700'">
            {{ totalWeight }}% <span class="font-normal text-slate-400">/ 100%</span>
          </span>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="isComplete ? 'bg-emerald-500' : 'bg-amber-400'"
            :style="{ width: `${Math.min(totalWeight, 100)}%` }"
          />
        </div>
        <div class="mt-2 flex items-center justify-between text-[11px]">
          <span
            :class="isComplete ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'"
          >
            {{
              isComplete
                ? '✓ Đạt chuẩn 100%'
                : `Chưa đủ 100% (còn ${Math.abs(100 - totalWeight)}%)`
            }}
          </span>
          <span class="text-slate-400">{{
            isComplete ? 'Sẵn sàng áp dụng' : 'Cần điều chỉnh'
          }}</span>
        </div>
      </div>
    </div>

    <!-- Footer thao tác -->
    <div class="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
      <button
        type="button"
        class="flex-1 justify-center rounded-xl bg-[#1E56D9] py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        @click.stop="emit('view-detail', rubric.id)"
      >
        Xem chi tiết tiêu chí →
      </button>
      <button
        type="button"
        title="Nhập tiêu chí từ Excel vào bộ này"
        :disabled="!isEditable"
        class="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
        @click.stop="emit('import-excel', rubric.id)"
      >
        Excel
      </button>
      <button
        type="button"
        title="Sửa tên bộ tiêu chí"
        :disabled="!isEditable"
        class="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        @click.stop="emit('edit-rubric', rubric)"
      >
        Sửa
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { RUBRIC_STATUS } from '@/modules/administration/constants/adminConstants';

const props = defineProps({
  rubric: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view-detail', 'import-excel', 'edit-rubric']);

// Meta hiển thị trạng thái của bộ tiêu chí
const statusMeta = computed(() => {
  return RUBRIC_STATUS[props.rubric?.status] || { label: props.rubric?.status || 'Chưa rõ', tone: 'slate' };
});

// Tổng trọng số hiện tại của bộ tiêu chí
const totalWeight = computed(() => {
  if (!props.rubric?.criteria || !Array.isArray(props.rubric.criteria)) return 0;
  return props.rubric.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
});

// Đạt chuẩn khi tổng trọng số đúng 100%
const isComplete = computed(() => totalWeight.value === 100);

// Số lượng tiêu chí trong bộ
const criteriaCount = computed(() => props.rubric?.criteria?.length || 0);

// Có cho phép chỉnh sửa hay không (khóa khi Deprecated)
const isEditable = computed(() => props.rubric?.status !== 'Deprecated');
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-[#F8FAFC]/70"
    :class="compact ? 'px-4 py-2.5' : 'px-5 py-3'"
  >
    <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
      <span>{{ infoText }}</span>
      <select
        :value="pageSize"
        aria-label="Số dòng mỗi trang"
        class="h-8 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="handlePageSizeChange"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ compact ? `${size}/trang` : `${size} dòng / trang` }}
        </option>
      </select>
    </div>

    <div v-if="total > 0" class="flex flex-wrap items-center gap-1">
      <button
        type="button"
        :disabled="safePage === 1"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('update:page', safePage - 1)"
      >
        Trước
      </button>

      <template v-for="(item, idx) in pageNumbers" :key="`${item}-${idx}`">
        <span v-if="item === '...'" class="px-1.5 text-xs text-slate-400">...</span>
        <button
          v-else
          type="button"
          class="inline-flex min-w-[30px] shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition"
          :class="
            item === safePage
              ? 'bg-[#1E56D9] font-semibold text-white'
              : 'border border-slate-200 bg-white font-medium text-slate-700 hover:border-[#1E56D9] hover:text-[#1E56D9]'
          "
          @click="emit('update:page', item)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        :disabled="safePage >= totalPages"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('update:page', safePage + 1)"
      >
        Sau
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 5,
  },
  total: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: 'bản ghi',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [5, 10, 20],
  },
});

const emit = defineEmits(['update:page', 'update:pageSize']);

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / Math.max(1, props.pageSize))));
const safePage = computed(() => Math.min(Math.max(1, props.page), totalPages.value));

const infoText = computed(() => {
  if (!props.total) return `0 ${props.unit}`;
  const start = (safePage.value - 1) * props.pageSize + 1;
  const end = Math.min(props.total, start + props.pageSize - 1);
  if (props.compact) return `${start}–${end} / ${props.total}`;
  return `Hiển thị ${start}–${end} trên tổng số ${props.total} ${props.unit}`;
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  if (!props.total) return [];
  if (total <= 7) return Array.from({ length: total }, (_, idx) => idx + 1);
  const current = safePage.value;
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
    result.push(sorted[i]);
  }
  return result;
});

function handlePageSizeChange(event) {
  const nextSize = Math.max(1, Number(event.target.value) || 5);
  emit('update:pageSize', nextSize);
}
</script>

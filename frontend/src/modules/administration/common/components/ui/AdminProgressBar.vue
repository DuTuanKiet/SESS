<template>
  <div class="flex items-center gap-2 whitespace-nowrap">
    <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
      <div
        class="h-full rounded-full bg-[#1E56D9] transition-[width] duration-200"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <span class="text-[11px] tabular-nums text-slate-500">{{ done }}/{{ total }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  done: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
});

const percent = computed(() => {
  if (!props.total) return 0;
  return Math.max(0, Math.min(100, Math.round((props.done / props.total) * 100)));
});
</script>

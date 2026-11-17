<template>
  <span
    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset"
    :class="toneClass"
  >
    {{ initial }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { TONES } from '@/modules/administration/constants/adminConstants';

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'blue',
  },
});

// Tách chữ cái đầu của tên chính sau khi bỏ tiền tố học hàm, học vị hoặc xưng hô
const initial = computed(() => {
  const cleaned = String(props.name || '')
    .replace(/^(PGS\.?|TS\.?|ThS\.?|Ông|Bà|Cô|Thầy)\s+/i, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] || cleaned || 'U')[0].toUpperCase();
});

const toneClass = computed(() => TONES[props.tone] || TONES.blue);
</script>

<template>
  <span
    class="inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
    :class="toneClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { TONES } from '@/modules/administration/constants/adminConstants';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'slate',
  },
});

const toneClass = computed(() => TONES[props.tone] || TONES.slate);
</script>

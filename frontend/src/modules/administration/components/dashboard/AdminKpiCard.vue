<template>
  <button
    type="button"
    class="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-left transition duration-150 hover:border-[#1E56D9]/50 focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20"
    @click="emit('select')"
  >
    <div class="flex w-full items-center justify-between gap-2">
      <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {{ label }}
      </span>
      <span
        v-if="hoverActionText"
        class="text-[11px] font-semibold text-[#1E56D9] opacity-0 transition group-hover:opacity-100"
      >
        {{ hoverActionText }}
      </span>
    </div>
    <p
      class="mt-2 text-3xl font-bold tracking-tight tabular-nums"
      :class="toneClass"
    >
      <slot name="value">{{ value }}</slot>
    </p>
    <p class="mt-1 w-full truncate text-xs text-slate-500">
      {{ subtext }}
    </p>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    default: '',
  },
  subtext: {
    type: String,
    default: '',
  },
  tone: {
    type: String,
    default: 'navy',
  },
  hoverActionText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select']);

const toneClass = computed(() => {
  if (props.tone === 'amber') return 'text-amber-700';
  if (props.tone === 'blue') return 'text-[#1E56D9]';
  if (props.tone === 'emerald') return 'text-emerald-700';
  return 'text-[#0B1F4B]';
});
</script>

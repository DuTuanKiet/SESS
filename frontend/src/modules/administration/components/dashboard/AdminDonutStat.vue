<template>
  <button
    type="button"
    class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-[#F8FAFC]/60 p-2.5 text-left transition hover:border-[#1E56D9]/40 focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20"
    @click="emit('select')"
  >
    <svg
      viewBox="0 0 68 68"
      class="h-14 w-14 shrink-0"
      role="img"
      :aria-label="`${label} ${safePercent}%`"
    >
      <circle
        cx="34"
        cy="34"
        :r="RADIUS"
        fill="none"
        stroke="#E2E8F0"
        stroke-width="6"
      />
      <circle
        cx="34"
        cy="34"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        stroke-width="6"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 34 34)"
        class="transition-[stroke-dashoffset] duration-300 ease-out"
      />
      <text
        x="34"
        y="38"
        text-anchor="middle"
        fill="#0F172A"
        font-size="12"
        font-weight="700"
        font-family="Inter, sans-serif"
      >
        {{ safePercent }}%
      </text>
    </svg>
    <div class="min-w-0">
      <p class="truncate text-xs font-semibold text-slate-800">{{ label }}</p>
      <p class="mt-0.5 truncate font-mono text-[11px] tabular-nums text-slate-500">
        {{ subtext }}
      </p>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const RADIUS = 26;
const CIRCUMFERENCE = Number((2 * Math.PI * RADIUS).toFixed(2));

const props = defineProps({
  percent: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    default: '#1E56D9',
  },
  label: {
    type: String,
    required: true,
  },
  subtext: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select']);

const safePercent = computed(() => Math.max(0, Math.min(100, Number(props.percent) || 0)));
const dashOffset = computed(() =>
  Number((CIRCUMFERENCE * (1 - safePercent.value / 100)).toFixed(2))
);
</script>

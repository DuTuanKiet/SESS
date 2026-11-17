<template>
  <section class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]">
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2 class="whitespace-nowrap text-[14px] font-semibold tracking-tight text-slate-900">
        Cơ cấu dự án
      </h2>
      <div
        class="flex items-center gap-0.5 rounded-lg bg-slate-100/90 p-0.5"
        role="tablist"
        aria-label="Chế độ xem cơ cấu dự án"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeMode === tab.key"
          class="inline-flex cursor-pointer flex-col items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] transition-all duration-200 ease-out"
          :class="
            activeMode === tab.key
              ? 'bg-white font-semibold text-[#0B1F4B] shadow-sm'
              : 'font-medium text-slate-500 hover:text-slate-800'
          "
          @click="emit('update:activeMode', tab.key)"
        >
          <span>{{ tab.label }}</span>
          <span class="pointer-events-none h-0 overflow-hidden font-semibold opacity-0" aria-hidden="true">
            {{ tab.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Giữ tỷ lệ khung cố định aspect-[540/214] để chuyển giữa các tab không bị giật chiều cao -->
    <div class="flex flex-1 items-center px-5 py-4">
      <div class="relative aspect-[540/214] w-full">
        <Transition name="chart-tab-fade" mode="out-in">
          <div
            v-if="!totalProjects || !groups.length"
            key="empty"
            class="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400"
          >
            Chưa có dữ liệu dự án
          </div>

          <svg
            v-else
            :key="activeMode"
            :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
            class="h-full w-full select-none"
            role="img"
            aria-label="Biểu đồ cơ cấu dự án"
          >
            <g v-for="tick in gridTicks" :key="tick.value">
              <line
                :x1="PLOT_LEFT"
                :y1="tick.y"
                :x2="PLOT_RIGHT"
                :y2="tick.y"
                :stroke="tick.value === 0 ? '#CBD5E1' : '#F1F5F9'"
                stroke-width="1"
              />
              <text
                :x="PLOT_LEFT - 8"
                :y="tick.y + 3"
                text-anchor="end"
                fill="#94A3B8"
                font-size="10"
                font-family="Inter, sans-serif"
              >
                {{ tick.value }}
              </text>
            </g>

            <g
              v-for="bar in bars"
              :key="bar.key"
              class="cursor-pointer transition-opacity duration-150 hover:opacity-85"
              @click="emit('select-bar', bar.raw)"
            >
              <title>{{ bar.titleTooltip }}</title>
              <rect
                v-if="bar.barHeight > 0"
                :x="bar.barX"
                :y="bar.barY"
                :width="barWidth"
                :height="bar.barHeight"
                rx="5"
                :fill="bar.color"
              />
              <text
                :x="bar.cx"
                :y="bar.valueY"
                text-anchor="middle"
                fill="#0F172A"
                font-size="11"
                font-weight="600"
                font-family="Inter, sans-serif"
              >
                {{ bar.valueLabel }}
              </text>
              <text
                :x="bar.cx"
                y="198"
                text-anchor="middle"
                fill="#475569"
                font-size="11"
                font-weight="500"
                font-family="Inter, sans-serif"
              >
                {{ bar.shortLabel }}
              </text>
            </g>
          </svg>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const CHART_WIDTH = 540;
const CHART_HEIGHT = 214;
const PLOT_LEFT = 36;
const PLOT_RIGHT = 524;
const PLOT_TOP = 34;
const PLOT_BOTTOM = 178;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;

const props = defineProps({
  activeMode: {
    type: String,
    default: 'status',
  },
  groups: {
    type: Array,
    required: true,
  },
  totalProjects: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:activeMode', 'select-bar']);

const tabs = [
  { key: 'status', label: 'Giai đoạn' },
  { key: 'level', label: 'Cấp thi' },
  { key: 'faculty', label: 'Khoa' },
];

const yScaleMax = computed(() => {
  const maxCount = Math.max(...props.groups.map((g) => Number(g.count) || 0), 1);
  return Math.max(maxCount, 2);
});

const gridTicks = computed(() => {
  const maxVal = yScaleMax.value;
  const uniqueValues = [...new Set([0, Math.ceil(maxVal / 2), maxVal])];
  return uniqueValues.map((value) => ({
    value,
    y: Math.round(PLOT_BOTTOM - (value / maxVal) * PLOT_HEIGHT),
  }));
});

const slotWidth = computed(() => {
  const len = props.groups.length || 1;
  return PLOT_WIDTH / len;
});

const barWidth = computed(() => Math.min(44, Math.max(26, Math.round(slotWidth.value * 0.42))));

const bars = computed(() => {
  const total = props.totalProjects || 1;
  return props.groups.map((g, idx) => {
    const count = Number(g.count) || 0;
    const cx = Math.round(PLOT_LEFT + slotWidth.value * idx + slotWidth.value / 2);
    const barHeight = count ? Math.max(6, Math.round((count / yScaleMax.value) * PLOT_HEIGHT)) : 0;
    const barY = PLOT_BOTTOM - barHeight;
    const barX = Math.round(cx - barWidth.value / 2);
    const pct = Math.round((count / total) * 100);
    return {
      key: g.key || g.label || idx,
      cx,
      barX,
      barY,
      barHeight,
      valueY: Math.max(16, barY - 8),
      color: g.color,
      shortLabel: g.shortLabel || g.label,
      valueLabel: `${count} (${pct}%)`,
      titleTooltip: `${g.label}: ${count} dự án (${pct}%)`,
      raw: g,
    };
  });
});
</script>

<style scoped>
.chart-tab-fade-enter-active,
.chart-tab-fade-leave-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.chart-tab-fade-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.chart-tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>

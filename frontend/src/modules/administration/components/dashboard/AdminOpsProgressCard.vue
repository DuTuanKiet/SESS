<template>
  <section class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]">
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2 class="whitespace-nowrap text-[14px] font-semibold tracking-tight text-slate-900">
        Tiến độ &amp; Phổ điểm
      </h2>
      <span class="text-xs text-slate-500">
        {{ stats.openRounds }}/{{ stats.totalRounds }} vòng mở
      </span>
    </div>

    <div class="px-5 py-4">
      <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <AdminDonutStat
          :percent="stats.evalProgress.rate"
          color="#1E56D9"
          label="Phiếu chấm"
          :subtext="`${stats.evalProgress.submitted}/${stats.evalProgress.total} đã nộp`"
          @select="emit('navigate', { targetNav: 'judging', targetSub: 'judging-override' })"
        />
        <AdminDonutStat
          :percent="stats.mentorProgress.rate"
          color="#0D9488"
          label="Slot cố vấn"
          :subtext="`${stats.mentorProgress.usedSlots}/${stats.mentorProgress.maxSlots} slot`"
          @select="emit('navigate', { targetNav: 'mentors' })"
        />
      </div>

      <div class="mt-3.5 border-t border-slate-100 pt-3">
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="font-medium text-slate-600">Phổ điểm chấm</span>
          <span class="font-mono font-semibold tabular-nums text-[#0B1F4B]">
            ĐTB {{ stats.avgScore }}
          </span>
        </div>

        <svg
          :viewBox="`0 0 ${MINI_WIDTH} 92`"
          class="w-full cursor-pointer select-none"
          role="img"
          aria-label="Phổ điểm chấm"
          @click="emit('navigate', { targetNav: 'judging', targetSub: 'judging-override' })"
        >
          <line
            x1="12"
            :y1="MINI_BOTTOM"
            :x2="MINI_WIDTH - 12"
            :y2="MINI_BOTTOM"
            stroke="#CBD5E1"
            stroke-width="1"
          />
          <g v-for="bar in miniBars" :key="bar.key">
            <rect
              v-if="bar.height > 0"
              :x="bar.cx - 14"
              :y="bar.y"
              width="28"
              :height="bar.height"
              rx="4"
              :fill="bar.color"
            />
            <text
              :x="bar.cx"
              :y="bar.countY"
              text-anchor="middle"
              fill="#0F172A"
              font-size="10.5"
              font-weight="600"
              font-family="Inter, sans-serif"
            >
              {{ bar.count }}
            </text>
            <text
              :x="bar.cx"
              y="84"
              text-anchor="middle"
              fill="#64748B"
              font-size="10"
              font-weight="500"
              font-family="Inter, sans-serif"
            >
              {{ bar.label }}
            </text>
          </g>
        </svg>
      </div>

      <div class="mt-2 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-2.5 text-center">
        <button
          type="button"
          class="cursor-pointer px-1 py-0.5 transition hover:text-[#1E56D9]"
          @click="emit('navigate', { targetNav: 'competitions' })"
        >
          <p class="text-[11px] text-slate-500">Cuộc thi mở</p>
          <p class="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#0B1F4B]">
            {{ stats.quickCounters.activeCompetitions }}/{{ stats.quickCounters.totalCompetitions }}
          </p>
        </button>

        <button
          type="button"
          class="cursor-pointer px-1 py-0.5 transition hover:text-[#1E56D9]"
          @click="emit('navigate', { targetNav: 'awards', targetSub: 'awards-claims' })"
        >
          <p class="text-[11px] text-slate-500">Giải &amp; Vote</p>
          <p
            class="mt-0.5 font-mono text-sm font-bold tabular-nums"
            :class="stats.quickCounters.pendingAwardsAndVotes ? 'text-amber-700' : 'text-[#0B1F4B]'"
          >
            {{ stats.quickCounters.pendingAwardsAndVotes }}
          </p>
        </button>

        <button
          type="button"
          class="cursor-pointer px-1 py-0.5 transition hover:text-[#1E56D9]"
          @click="emit('navigate', { targetNav: 'audit' })"
        >
          <p class="text-[11px] text-slate-500">Audit hôm nay</p>
          <p class="mt-0.5 font-mono text-sm font-bold tabular-nums text-[#0B1F4B]">
            {{ stats.quickCounters.todayAuditCount }}
          </p>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import AdminDonutStat from './AdminDonutStat.vue';

const MINI_WIDTH = 360;
const MINI_TOP = 20;
const MINI_BOTTOM = 68;
const MINI_HEIGHT = MINI_BOTTOM - MINI_TOP;

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['navigate']);

const miniBars = computed(() => {
  const buckets = props.stats?.scoreBuckets || [];
  const maxBucket = Math.max(...buckets.map((b) => Number(b.count) || 0), 1);
  const slotWidth = (MINI_WIDTH - 24) / (buckets.length || 1);

  return buckets.map((bucket, idx) => {
    const count = Number(bucket.count) || 0;
    const cx = Math.round(12 + slotWidth * idx + slotWidth / 2);
    const height = count ? Math.max(5, Math.round((count / maxBucket) * MINI_HEIGHT)) : 0;
    const y = MINI_BOTTOM - height;
    return {
      key: bucket.key || idx,
      cx,
      y,
      height,
      countY: Math.max(12, y - 5),
      count,
      label: bucket.label,
      color: bucket.color,
    };
  });
});
</script>

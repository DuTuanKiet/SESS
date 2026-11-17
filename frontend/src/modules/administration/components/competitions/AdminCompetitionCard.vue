<template>
  <article
    role="button"
    tabindex="0"
    class="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#1E56D9]/60 hover:shadow-[0_10px_24px_-8px_rgba(30,86,217,0.18)] focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/30"
    @click="emit('select', competition.id)"
    @keydown.enter.prevent="emit('select', competition.id)"
    @keydown.space.prevent="emit('select', competition.id)"
  >
    <div class="relative h-28 w-full shrink-0 overflow-hidden bg-slate-900">
      <img
        :src="bannerSrc"
        :alt="`Banner ${competition.code}`"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        @error="handleBannerError"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#0B1F4B]/85 via-[#0B1F4B]/20 to-transparent" />
      <div class="absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
        <span class="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#0B1F4B] backdrop-blur-sm">
          {{ levelLabel }}
        </span>
        <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
      </div>
      <div class="absolute inset-x-3 bottom-2 flex items-center justify-between gap-2">
        <span class="font-mono text-[11px] font-semibold tracking-wide text-white/95 drop-shadow">
          {{ competition.code }}
        </span>
        <span class="text-[10.5px] font-medium text-white/80">
          {{ competition.academicYear || '' }}
        </span>
      </div>
    </div>

    <div class="flex flex-1 flex-col justify-between p-4">
      <h3 class="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug text-slate-900 transition group-hover:text-[#1E56D9]">
        {{ competition.title }}
      </h3>

      <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[11.5px]">
        <div class="min-w-0">
          <dt class="text-[10px] font-medium uppercase tracking-wide text-slate-400">Thời gian</dt>
          <dd class="mt-0.5 truncate font-medium text-slate-700">
            {{ competition.startDate }} – {{ competition.endDate }}
          </dd>
        </div>

        <div class="min-w-0">
          <dt class="text-[10px] font-medium uppercase tracking-wide text-slate-400">Vòng thi</dt>
          <dd class="mt-0.5 truncate font-medium text-slate-700">{{ roundSummary }}</dd>
        </div>

        <div class="min-w-0">
          <dt class="text-[10px] font-medium uppercase tracking-wide text-slate-400">Giải thưởng</dt>
          <dd class="mt-0.5 truncate font-semibold text-[#1E56D9]">{{ prizeFormatted }}</dd>
        </div>

        <div class="min-w-0">
          <dt class="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Khoa tham gia
          </dt>
          <dd class="mt-0.5 truncate font-medium text-slate-700" :title="facultySummary">
            {{ facultySummary }}
          </dd>
        </div>
      </dl>

      <div class="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
        <span class="truncate">
          {{ projectsCount }} dự án • Hạn: {{ competition.registrationDeadline || '—' }}
        </span>
        <span class="shrink-0 font-semibold text-[#1E56D9] group-hover:underline">
          Chi tiết →
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { COMPETITION_STATUS, LEVELS } from '@/modules/administration/constants/adminConstants';
import { BANNER_PRESETS } from '@/modules/administration/mocks/adminCompetitionsMockData';
import {
  getCompetitionBannerUrl,
  getRoundSummaryLabel,
} from '@/modules/administration/stores/useAdminCompetitionsStore';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  competition: {
    type: Object,
    required: true,
  },
  projectsCount: {
    type: Number,
    default: 0,
  },
  prizeFormatted: {
    type: String,
    default: 'Chưa thiết lập',
  },
  facultySummary: {
    type: String,
    default: 'Chưa chọn khoa',
  },
});

const emit = defineEmits(['select']);

const hasImageError = ref(false);
watch(
  () => props.competition?.bannerUrl,
  () => {
    hasImageError.value = false;
  }
);

const bannerSrc = computed(() =>
  hasImageError.value ? BANNER_PRESETS[0].url : getCompetitionBannerUrl(props.competition)
);
const levelLabel = computed(() => LEVELS[props.competition.level] || props.competition.level);
const statusMeta = computed(
  () =>
    COMPETITION_STATUS[props.competition.status] || {
      label: props.competition.status,
      tone: 'slate',
    }
);
const roundSummary = computed(() => getRoundSummaryLabel(props.competition));

function handleBannerError() {
  hasImageError.value = true;
}
</script>

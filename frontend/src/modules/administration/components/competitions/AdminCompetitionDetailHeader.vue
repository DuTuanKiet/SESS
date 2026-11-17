<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('back')"
        >
          ← Quay lại danh sách cuộc thi
        </button>
        <span class="font-mono text-xs text-slate-400">{{ competition.code }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="emit('edit')"
        >
          Sửa thông tin cuộc thi
        </button>
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
          @click="emit('change-status')"
        >
          Đổi trạng thái
        </button>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div class="relative h-44 w-full overflow-hidden bg-slate-900 sm:h-52">
        <img
          :src="bannerSrc"
          :alt="`Banner ${competition.title}`"
          class="h-full w-full object-cover"
          @error="handleBannerError"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#0B1F4B]/95 via-[#0B1F4B]/45 to-[#0B1F4B]/15" />

        <div class="absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <AdminStatusBadge :label="statusMeta.label" :tone="statusMeta.tone" />
            <span class="rounded-md bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-[#0B1F4B]">
              {{ scopeDisplay }}
            </span>
          </div>
          <span class="rounded-md bg-white/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur-sm">
            Năm học {{ competition.academicYear || '2026–2027' }}
          </span>
        </div>

        <div class="absolute inset-x-5 bottom-4">
          <p class="font-mono text-xs font-semibold tracking-wider text-blue-200">
            {{ competition.code }}
          </p>
          <h1 class="mt-1 text-lg font-bold leading-snug text-white sm:text-2xl">
            {{ competition.title }}
          </h1>
          <p class="mt-1 text-xs text-slate-200">
            Đơn vị tổ chức: {{ competition.organizer || 'CTUT' }} •
            {{ competition.location || 'Cổng trực tuyến SESS' }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 divide-y divide-slate-100 border-t border-slate-100 bg-[#F8FAFC] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
        <div class="p-3.5 sm:px-4">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Thời gian diễn ra
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ competition.startDate }} – {{ competition.endDate }}
          </p>
        </div>

        <div class="p-3.5 sm:px-4">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Hạn nộp hồ sơ
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ competition.registrationDeadline || '—' }}
          </p>
        </div>

        <div class="p-3.5 sm:px-4">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Số vòng thi
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ roundsCount }} vòng
            <template v-if="openRound"> • Mở V{{ openRound.roundNumber }}</template>
          </p>
        </div>

        <div class="p-3.5 sm:px-4">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Tổng giá trị giải
          </p>
          <p class="mt-1 text-xs font-semibold text-[#1E56D9]">{{ prizeFormatted }}</p>
        </div>

        <div class="col-span-2 p-3.5 sm:col-span-1 sm:px-4">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Quy mô tham gia
          </p>
          <p class="mt-1 text-xs font-semibold text-slate-800">
            {{ projectsCount }} dự án • {{ participatingFacultiesCount }} khoa
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { COMPETITION_STATUS, LEVELS } from '@/modules/administration/constants/adminConstants';
import { BANNER_PRESETS } from '@/modules/administration/mocks/adminCompetitionsMockData';
import { getCompetitionBannerUrl } from '@/modules/administration/stores/useAdminCompetitionsStore';
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
});

const emit = defineEmits(['back', 'edit', 'change-status']);

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

const statusMeta = computed(
  () =>
    COMPETITION_STATUS[props.competition.status] || {
      label: props.competition.status,
      tone: 'slate',
    }
);

const scopeDisplay = computed(() => {
  const baseLabel = LEVELS[props.competition.level] || props.competition.level;
  if (props.competition.level === 'FACULTY' && props.competition.hostFaculty) {
    return `${baseLabel} • Khoa ${props.competition.hostFaculty}`;
  }
  return baseLabel;
});

const roundsCount = computed(() => (props.competition.rounds || []).length);
const openRound = computed(() =>
  (props.competition.rounds || []).find((round) => round.status === 'OPEN')
);
const participatingFacultiesCount = computed(
  () => (props.competition.participatingFaculties || []).length
);

function handleBannerError() {
  hasImageError.value = true;
}
</script>

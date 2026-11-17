<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div>
        <h3 class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]">
          Quản lý vòng thi &amp; Đợt đánh giá
        </h3>
        <p class="mt-0.5 text-xs text-slate-400">
          Thêm, chỉnh sửa hoặc xóa vòng thi chưa phát sinh điểm chấm
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
        @click="emit('add-round')"
      >
        + Thêm vòng thi
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Vòng thi &amp; Giai đoạn</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Thời gian nộp &amp; Chấm điểm</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Bộ tiêu chí &amp; Hồ sơ</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(round, idx) in rounds"
            :key="round.id || `${round.roundNumber}-${idx}`"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="min-w-[230px] px-4 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  Vòng {{ round.roundNumber }}
                </span>
                <span class="rounded bg-[#F1F7FF] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#1E56D9]">
                  {{ STAGE_TYPES[round.stageType] || 'Vòng thi' }}
                </span>
                <span class="font-semibold text-slate-800">
                  {{ formatRoundDisplayName(round.roundName) }}
                </span>
              </div>
              <p v-if="round.description" class="mt-1 text-xs leading-relaxed text-slate-500">
                {{ round.description }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs text-slate-600">
              <p>
                <span class="text-slate-400">Nộp:</span>
                {{ round.opensAt }} – {{ round.closesAt }}
              </p>
              <p class="mt-0.5 text-[11px] text-slate-500">
                <span class="text-slate-400">Chấm:</span>
                {{ round.scoringOpensAt || round.opensAt }} –
                {{ round.scoringClosesAt || round.closesAt }}
              </p>
            </td>

            <td class="min-w-[200px] px-4 py-3 align-middle text-xs">
              <p class="font-medium text-slate-700">
                {{ round.rubricName || 'Chưa gắn bộ tiêu chí' }}
              </p>
              <p class="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                Hồ sơ: {{ round.requiredDocs || 'Chưa quy định' }}
              </p>
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="roundStatusMeta(round.status).label"
                :tone="roundStatusMeta(round.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <div class="inline-flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit-round', idx)"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  @click="emit('delete-round', idx)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!rounds.length">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
              Cuộc thi chưa có vòng thi nào. Bấm «+ Thêm vòng thi» để thiết lập.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ROUND_STATUS, STAGE_TYPES } from '@/modules/administration/constants/adminConstants';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

const props = defineProps({
  competition: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['add-round', 'edit-round', 'delete-round']);

const rounds = computed(() => props.competition.rounds || []);

function formatRoundDisplayName(name) {
  return String(name || '').replace(/^Vòng\s*\d+\s*[—-]\s*/i, '');
}

function roundStatusMeta(status) {
  return ROUND_STATUS[status] || { label: status || '—', tone: 'slate' };
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div>
        <h3 class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]">
          Cơ cấu giải thưởng
        </h3>
        <p class="mt-0.5 text-xs text-slate-400">
          Tổng cơ cấu:
          <strong class="text-slate-700">{{ prizeSummary.totalCount }} suất</strong> • Tổng giá trị
          tiền mặt:
          <strong class="text-[#1E56D9]">{{ prizeSummary.formatted }}</strong>
        </p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
        @click="emit('add-award')"
      >
        + Thêm giải thưởng
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Hạng giải</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Số lượng</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Giá trị / Suất</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Thành tiền</th>
            <th class="whitespace-nowrap px-4 py-2.5 font-semibold">Quyền lợi kèm theo</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(award, idx) in awards"
            :key="award.id || `${award.rank}-${idx}`"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="whitespace-nowrap px-4 py-3 align-middle font-semibold text-slate-800">
              {{ award.rank }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle text-slate-600">
              {{ Number(award.quantity) || 1 }} giải
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle font-semibold text-[#1E56D9]">
              {{ award.cashAmount || '—' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs font-medium text-slate-700">
              {{ formatAwardSubtotal(award) }}
            </td>
            <td class="min-w-[200px] px-4 py-3 align-middle text-xs leading-relaxed text-slate-600">
              {{ award.perk || '—' }}
            </td>
            <td class="px-4 py-3 text-right align-middle">
              <div class="inline-flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('edit-award', idx)"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  @click="emit('delete-award', idx)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!awards.length">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">
              Chưa thiết lập cơ cấu giải thưởng
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { parsePrizeCashValue } from '@/modules/administration/stores/useAdminCompetitionsStore';

const props = defineProps({
  competition: {
    type: Object,
    required: true,
  },
  prizeSummary: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['add-award', 'edit-award', 'delete-award']);

const awards = computed(() => props.competition.awards || []);

function formatAwardSubtotal(award) {
  const qty = Number(award.quantity) || 1;
  const unitCash = parsePrizeCashValue(award.cashAmount);
  return unitCash > 0 ? `${(unitCash * qty).toLocaleString('vi-VN')} đ` : '—';
}
</script>

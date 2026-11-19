<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Hồ sơ nhận giải thưởng
      </h2>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
      <input
        :value="filters.keyword"
        type="text"
        placeholder="Tìm mã dự án, sinh viên, số tài khoản"
        aria-label="Tìm hồ sơ nhận giải"
        class="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @input="emit('update-filter', { key: 'keyword', value: $event.target.value })"
      />

      <select
        :value="filters.status"
        aria-label="Lọc theo trạng thái hồ sơ nhận giải"
        class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update-filter', { key: 'status', value: $event.target.value })"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="PENDING">Chờ xác minh</option>
        <option value="APPROVED">Đã duyệt chi</option>
        <option value="PAID">Đã giải ngân</option>
        <option value="REJECTED">Từ chối / Cần sửa</option>
      </select>

      <button
        v-if="hasFilters"
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('reset-filters')"
      >
        Đặt lại
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
          >
            <th class="whitespace-nowrap px-4 py-2.5">Dự án &amp; Hạng giải</th>
            <th class="whitespace-nowrap px-4 py-2.5">Người nhận thưởng</th>
            <th class="whitespace-nowrap px-4 py-2.5">Ngân hàng &amp; Số tài khoản</th>
            <th class="whitespace-nowrap px-4 py-2.5">CCCD / MST</th>
            <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="claim in rows"
            :key="claim.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="min-w-[200px] px-4 py-3 align-middle">
              <p class="font-mono text-xs font-semibold text-[#1E56D9]">{{ claim.projectCode }}</p>
              <p class="mt-0.5 text-xs font-medium text-slate-800">
                {{ claim.awardRank }} - {{ claim.prizeAmount }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <p class="font-medium text-slate-800">{{ claim.submittedBy }}</p>
              <p class="text-xs text-slate-400">Nộp {{ claim.submittedAt }}</p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle text-xs text-slate-600">
              <p class="font-medium text-slate-800">{{ claim.bankName }}</p>
              <p class="font-mono text-[11px] text-slate-500">
                {{ claim.accountNumber }} - {{ claim.accountHolder }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-500">
              <p>CCCD: {{ claim.idCardNumber }}</p>
              <p>MST: {{ claim.taxCode || 'Chưa bổ sung' }}</p>
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="getStatusMeta(claim.status).label"
                :tone="getStatusMeta(claim.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <button
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                @click="emit('review', claim)"
              >
                Thẩm định
              </button>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">
              Không có hồ sơ nhận giải phù hợp
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="hồ sơ"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { REWARD_CLAIM_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  filteredCount: {
    type: Number,
    default: 0,
  },
  filters: {
    type: Object,
    required: true,
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits([
  'update-filter',
  'reset-filters',
  'review',
  'update:page',
  'update:pageSize',
]);

function getStatusMeta(status) {
  return REWARD_CLAIM_STATUS[status] || { label: status || '—', tone: 'slate' };
}
</script>

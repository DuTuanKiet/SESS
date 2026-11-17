<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <h2
        class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
      >
        Đơn xin hủy dự án
      </h2>

      <select
        :value="statusFilter"
        aria-label="Lọc trạng thái đơn xin hủy"
        class="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        @change="emit('update:statusFilter', $event.target.value)"
      >
        <option value="PENDING">Đang chờ</option>
        <option value="APPROVED">Đã duyệt</option>
        <option value="REJECTED">Đã từ chối</option>
        <option value="">Tất cả</option>
      </select>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
          >
            <th class="whitespace-nowrap px-4 py-2.5">Dự án</th>
            <th class="whitespace-nowrap px-4 py-2.5">Người gửi</th>
            <th class="whitespace-nowrap px-4 py-2.5">Lý do</th>
            <th class="whitespace-nowrap px-4 py-2.5">Minh chứng</th>
            <th class="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
            <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in rows"
            :key="item.id"
            class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
          >
            <td class="min-w-[200px] px-4 py-3 align-middle">
              <p class="whitespace-nowrap font-medium text-slate-800">{{ item.project }}</p>
              <p
                v-if="projectTitleMap.get(item.project)"
                class="text-xs leading-relaxed text-slate-400"
              >
                {{ projectTitleMap.get(item.project) }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle text-slate-600">
              <p>{{ item.by }}</p>
              <p class="text-[11px] text-slate-400">{{ item.date || '—' }}</p>
            </td>

            <td class="min-w-[200px] max-w-sm px-4 py-3 align-middle leading-relaxed text-slate-600">
              <p>{{ item.reason }}</p>
              <p v-if="item.reviewNote" class="mt-1 text-xs text-slate-400">
                Ghi chú: {{ item.reviewNote }}
              </p>
            </td>

            <td class="whitespace-nowrap px-4 py-3 align-middle">
              <button
                v-if="item.file"
                type="button"
                class="cursor-pointer text-xs font-medium text-[#1E56D9] hover:underline"
                @click="emit('preview-file', item.file)"
              >
                {{ item.file }}
              </button>
              <span v-else class="text-xs text-slate-400">—</span>
            </td>

            <td class="px-4 py-3 align-middle">
              <AdminStatusBadge
                :label="getStatusMeta(item.status).label"
                :tone="getStatusMeta(item.status).tone"
              />
            </td>

            <td class="px-4 py-3 text-right align-middle">
              <button
                v-if="item.status === 'PENDING'"
                type="button"
                class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
                @click="emit('review', item)"
              >
                Xét duyệt
              </button>
              <span v-else class="text-xs text-slate-400">Đã xử lý</span>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
              Không có đơn xin hủy phù hợp
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="page"
      :page-size="pageSize"
      :total="filteredCount"
      unit="đơn"
      @update:page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
    />
  </section>
</template>

<script setup>
import { CANCELLATION_STATUS } from '@/modules/administration/constants/adminConstants';
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
  statusFilter: {
    type: String,
    default: 'PENDING',
  },
  projectTitleMap: {
    type: Map,
    required: true,
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
  'update:statusFilter',
  'preview-file',
  'review',
  'update:page',
  'update:pageSize',
]);

function getStatusMeta(status) {
  return CANCELLATION_STATUS[status] || CANCELLATION_STATUS.PENDING;
}
</script>

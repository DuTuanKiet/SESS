<template>
  <div class="space-y-5">
    <!-- Tiêu đề trang Nhật ký kiểm toán & thao tác xuất CSV -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Nhật ký kiểm toán</h1>
        <p class="mt-1 text-sm text-slate-500">
          Theo dõi lịch sử thay đổi dữ liệu trọng yếu trước và sau chỉnh sửa, người thực hiện và
          địa chỉ IP
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="auditStore.exportCsv()"
        >
          Xuất CSV nhật ký
        </button>
      </div>
    </div>

    <!-- 3 thẻ KPI tổng hợp trạng thái nhật ký -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Tổng bản ghi nhật ký
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {{ auditStore.kpiStats.total }}
        </p>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Thao tác trong ngày
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-[#1E56D9]">
          {{ auditStore.kpiStats.todayCount }}
        </p>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Thao tác nhạy cảm / khẩn cấp
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-rose-600">
          {{ auditStore.kpiStats.sensitiveCount }}
        </p>
      </div>
    </div>

    <!-- Bảng lịch sử thao tác hệ thống -->
    <section
      class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.06)]"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2
          class="relative whitespace-nowrap pl-3 text-[14px] font-semibold tracking-tight text-slate-900 before:absolute before:bottom-0.5 before:left-0 before:top-0.5 before:w-1 before:rounded-full before:bg-[#1E56D9]"
        >
          Lịch sử thao tác hệ thống
        </h2>

        <div class="flex flex-wrap items-center gap-2">
          <input
            :value="auditStore.filters.keyword"
            type="text"
            placeholder="Tìm email, đối tượng, mô tả..."
            aria-label="Tìm email, đối tượng, mô tả nhật ký"
            class="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @input="auditStore.setFilter('keyword', $event.target.value)"
          />

          <select
            :value="auditStore.filters.action"
            aria-label="Lọc theo hành động"
            class="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @change="auditStore.setFilter('action', $event.target.value)"
          >
            <option value="">Tất cả hành động</option>
            <option v-for="actionKey in AUDIT_FILTER_ACTION_KEYS" :key="actionKey" :value="actionKey">
              {{ getActionMeta(actionKey).label }}
            </option>
          </select>

          <select
            :value="auditStore.filters.targetEntity"
            aria-label="Lọc theo đối tượng"
            class="w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @change="auditStore.setFilter('targetEntity', $event.target.value)"
          >
            <option value="">Tất cả đối tượng</option>
            <option v-for="entity in AUDIT_ENTITY_OPTIONS" :key="entity" :value="entity">
              {{ entity }}
            </option>
          </select>

          <button
            v-if="auditStore.hasFilters"
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="auditStore.resetFilters()"
          >
            Đặt lại
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500"
            >
              <th class="whitespace-nowrap px-4 py-2.5">Thời gian</th>
              <th class="whitespace-nowrap px-4 py-2.5">Người thực hiện &amp; IP</th>
              <th class="whitespace-nowrap px-4 py-2.5">Hành động</th>
              <th class="whitespace-nowrap px-4 py-2.5">Đối tượng &amp; Tóm tắt thay đổi</th>
              <th class="whitespace-nowrap px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in auditStore.paginatedLogs"
              :key="log.id"
              class="border-b border-slate-100 last:border-0 hover:bg-[#F8FAFC]"
            >
              <td class="whitespace-nowrap px-4 py-3 align-middle font-mono text-xs text-slate-500">
                {{ log.timestamp }}
              </td>

              <td class="px-4 py-3 align-middle">
                <p class="whitespace-nowrap text-xs font-medium text-slate-800">
                  {{ log.actorEmail }}
                </p>
                <p class="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                  {{ log.actorRole }} - IP {{ log.ipAddress || '—' }}
                </p>
              </td>

              <td class="px-4 py-3 align-middle">
                <AdminStatusBadge
                  :label="getActionMeta(log.action).label"
                  :tone="getActionMeta(log.action).tone"
                />
              </td>

              <td class="min-w-[260px] px-4 py-3 align-middle">
                <p class="font-mono text-xs font-semibold text-[#1E56D9]">{{ log.targetId }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-600">{{ log.summary }}</p>
              </td>

              <td class="px-4 py-3 text-right align-middle">
                <button
                  type="button"
                  class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="selectedLog = log"
                >
                  Xem chi tiết
                </button>
              </td>
            </tr>

            <tr v-if="!auditStore.paginatedLogs.length">
              <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-400">
                Không có bản ghi nhật ký phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminPagination
        :page="auditStore.pagination.page"
        :page-size="auditStore.pagination.pageSize"
        :total="auditStore.filteredLogs.length"
        unit="bản ghi"
        @update:page="auditStore.setPage"
        @update:page-size="auditStore.setPageSize"
      />
    </section>

    <AdminAuditLogDetailModal
      :is-open="Boolean(selectedLog)"
      :log="selectedLog"
      @close="selectedLog = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  AUDIT_ACTION_META,
  AUDIT_ENTITY_OPTIONS,
  AUDIT_FILTER_ACTION_KEYS,
} from '@/modules/administration/constants/adminConstants';
import { useAdminAuditLogsStore } from '@/modules/administration/stores/useAdminAuditLogsStore';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import AdminAuditLogDetailModal from '@/modules/administration/components/audit/AdminAuditLogDetailModal.vue';

// Trang Nhật ký kiểm toán vận hành với mock state và gộp read-only các thao tác phát sinh trong phiên
const auditStore = useAdminAuditLogsStore();
const selectedLog = ref(null);

function getActionMeta(actionKey) {
  return AUDIT_ACTION_META[actionKey] || { label: actionKey || '—', tone: 'slate' };
}
</script>

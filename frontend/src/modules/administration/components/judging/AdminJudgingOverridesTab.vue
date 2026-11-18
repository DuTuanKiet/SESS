<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 class="text-sm font-semibold text-slate-900">Lịch sử điều chỉnh điểm</h2>
        <p class="mt-1 text-xs text-slate-500">Bản ghi mock chỉ lưu lịch sử, không thay đổi phiếu chấm gốc.</p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
        @click="emit('create-override')"
      >
        + Điều chỉnh điểm
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[960px] text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            <th class="px-5 py-3">Dự án</th>
            <th class="px-4 py-3">Tiêu chí</th>
            <th class="px-4 py-3">Điểm</th>
            <th class="px-4 py-3">Lý do</th>
            <th class="px-4 py-3">Người thực hiện</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="override in store.overridePagination.items" :key="override.id" class="border-b border-slate-100 last:border-0">
            <td class="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">{{ override.project }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{{ override.criterion }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs">
              <span class="text-slate-400 line-through">{{ override.from }}</span>
              <span class="mx-1.5 text-slate-300">→</span>
              <span class="font-semibold text-slate-800">{{ override.to }}</span>
            </td>
            <td class="min-w-52 max-w-sm px-4 py-3.5 text-xs leading-relaxed text-slate-600">{{ override.reason }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{{ override.by }}</td>
            <td class="px-4 py-3.5">
              <AdminStatusBadge
                :label="override.status === 'ACTIVE' ? 'Hiệu lực' : 'Đã thu hồi'"
                :tone="override.status === 'ACTIVE' ? 'green' : 'slate'"
              />
            </td>
            <td class="px-5 py-3.5 text-right">
              <button
                v-if="override.status === 'ACTIVE'"
                type="button"
                class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                @click="emit('revoke', { kind: 'override', recordId: override.id })"
              >
                Thu hồi
              </button>
            </td>
          </tr>
          <tr v-if="!store.overridePagination.total">
            <td colspan="7" class="px-5 py-10 text-center text-sm text-slate-400">Chưa có lịch sử điều chỉnh điểm.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="store.overridePagination.page"
      :page-size="store.overridePagination.pageSize"
      :total="store.overridePagination.total"
      unit="bản ghi"
      @update:page="store.setPage('overrides', $event)"
      @update:page-size="store.setPageSize('overrides', $event)"
    />
  </section>
</template>

<script setup>
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const emit = defineEmits(['create-override', 'revoke']);
const store = useAdminJudgingStore();
</script>

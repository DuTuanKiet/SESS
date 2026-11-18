<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 class="text-sm font-semibold text-slate-900">Lệnh điều chuyển giám khảo</h2>
        <p class="mt-1 text-xs text-slate-500">Lệnh hoàn tất chỉ chuyển giám khảo trên các phiếu nháp.</p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
        @click="emit('create-emergency')"
      >
        + Tạo lệnh
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[900px] text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            <th class="px-5 py-3">Dự án</th>
            <th class="px-4 py-3">Giám khảo cũ → mới</th>
            <th class="px-4 py-3">Lý do</th>
            <th class="px-4 py-3">Ngày tạo</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emergency in store.emergencyPagination.items" :key="emergency.id" class="border-b border-slate-100 last:border-0">
            <td class="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">{{ emergency.project }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs">
              <span class="text-slate-600">{{ emergency.from }}</span>
              <span class="mx-1.5 text-slate-300">→</span>
              <span class="font-medium text-slate-800">{{ emergency.to }}</span>
            </td>
            <td class="min-w-52 max-w-sm px-4 py-3.5 text-xs leading-relaxed text-slate-600">{{ emergency.reason }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{{ emergency.date }}</td>
            <td class="px-4 py-3.5">
              <AdminStatusBadge
                :label="emergency.status === 'PENDING' ? 'Đang xử lý' : 'Hoàn tất'"
                :tone="emergency.status === 'PENDING' ? 'amber' : 'green'"
              />
            </td>
            <td class="px-5 py-3.5">
              <div v-if="emergency.status === 'PENDING'" class="flex justify-end gap-1.5 whitespace-nowrap">
                <button type="button" class="rounded-lg bg-[#1E56D9] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-700" @click="handleComplete(emergency)">
                  Hoàn tất
                </button>
                <button type="button" class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50" @click="emit('revoke', { kind: 'emergency', recordId: emergency.id })">
                  Thu hồi
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!store.emergencyPagination.total">
            <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">Chưa có lệnh điều chuyển nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="store.emergencyPagination.page"
      :page-size="store.emergencyPagination.pageSize"
      :total="store.emergencyPagination.total"
      unit="lệnh"
      @update:page="store.setPage('emergencies', $event)"
      @update:page-size="store.setPageSize('emergencies', $event)"
    />
  </section>
</template>

<script setup>
import { useToastStore } from '@/stores/toast';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const emit = defineEmits(['create-emergency', 'revoke']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();

function handleComplete(emergency) {
  if (!store.completeEmergency(emergency.id)) return;
  toastStore.add({ type: 'success', message: `Đã hoàn tất điều chuyển giám khảo cho ${emergency.project}.` });
}
</script>

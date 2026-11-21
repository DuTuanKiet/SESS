<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">Hội đồng Giám khảo theo đợt</h2>
          <p class="mt-1 text-xs text-slate-500">Theo dõi thành viên và tiến độ đánh giá theo vòng.</p>
        </div>
        <label class="text-xs font-medium text-slate-600">
          <select
            :value="store.filters.councilCompetitionId"
            class="h-9 min-w-64 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @change="store.setFilter('councilCompetitionId', $event.target.value)"
          >
            <option value="">Tất cả cuộc thi</option>
            <option v-for="competition in store.competitions" :key="competition.id" :value="competition.id">
              {{ competition.code }} — {{ competition.title }}
            </option>
          </select>
        </label>
      </div>
      <button
        type="button"
        class="inline-flex cursor-pointer items-center rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
        @click="emit('create-council')"
      >
        + Thành lập hội đồng
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[900px] text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            <th class="px-5 py-3">Hội đồng giám khảo</th>
            <th class="px-4 py-3">Cuộc thi &amp; Vòng thi</th>
            <th class="px-4 py-3">Chủ tịch hội đồng</th>
            <th class="px-4 py-3">Dự án phụ trách</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.council.id" class="border-b border-slate-100 last:border-0">
            <td class="min-w-48 px-5 py-3.5">
              <p class="font-semibold text-slate-800">{{ row.council.name }}</p>
              <p class="mt-0.5 text-[11px] text-slate-400">{{ row.council.decisionNumber }}</p>
            </td>
            <td class="whitespace-nowrap px-4 py-3.5">
              <span class="font-mono text-xs font-semibold text-[#1E56D9]">{{ row.competition?.code || '—' }}</span>
              <p class="mt-0.5 text-xs text-slate-500">{{ row.round?.roundName || `Vòng ${row.council.roundNumber}` }}</p>
            </td>
            <td class="whitespace-nowrap px-4 py-3.5">
              <p class="text-xs font-medium text-slate-800">{{ row.chair?.name || row.council.chairEmail }}</p>
              <p class="mt-0.5 text-[11px] text-slate-400">{{ row.chair?.unit || 'Hội đồng chuyên môn' }}</p>
            </td>
            <td class="whitespace-nowrap px-4 py-3.5">
              <span class="font-semibold text-[#1E56D9]">{{ row.summary.projects.length }}</span>
              <span class="ml-1 text-xs text-slate-500">dự án</span>
            </td>
            <td class="px-4 py-3.5">
              <AdminStatusBadge
                :label="row.council.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'"
                :tone="row.council.status === 'ACTIVE' ? 'green' : 'slate'"
              />
            </td>
            <td class="px-5 py-3.5">
              <div class="flex justify-end gap-1.5 whitespace-nowrap">
                <button
                  type="button"
                  class="rounded-lg bg-[#1E56D9] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-700"
                  @click="emit('view-council', row.council.id)"
                >
                  Chi tiết
                </button>
                <button
                  type="button"
                  class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                  @click="handleDelete(row.council)"
                >
                  Xóa
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">
              Chưa có hội đồng giám khảo nào trong cuộc thi này.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="store.councilPagination.page"
      :page-size="store.councilPagination.pageSize"
      :total="store.councilPagination.total"
      unit="hội đồng"
      @update:page="store.setPage('councils', $event)"
      @update:page-size="store.setPageSize('councils', $event)"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useToastStore } from '@/stores/toast';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const emit = defineEmits(['create-council', 'view-council']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();

const rows = computed(() =>
  store.councilPagination.items.map((council) => {
    const competition = store.competitions.find((item) => item.id === council.competitionId);
    return {
      council,
      competition,
      round: competition?.rounds?.find(
        (item) => Number(item.roundNumber) === Number(council.roundNumber)
      ),
      chair: store.getJudgeByEmail(council.chairEmail),
      summary: store.getCouncilSummary(council.id),
    };
  })
);

function handleDelete(council) {
  if (!window.confirm(`Xóa hội đồng «${council.name}»? Các phiếu chấm đã tạo sẽ được giữ lại.`)) return;
  if (!store.deleteCouncil(council.id)) return;
  toastStore.add({ type: 'success', message: `Đã xóa hội đồng «${council.name}».` });
}
</script>

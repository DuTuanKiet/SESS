<template>
  <div class="space-y-4">
  <section class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">Đợt đánh giá theo vòng thi</h2>
          <p class="mt-1 text-xs text-slate-500">Danh sách phiếu và tiến độ nộp điểm.</p>
        </div>
        <label class="text-xs font-medium text-slate-600">
          <select
            :value="store.filters.assignmentsRoundKey"
            class="h-9 min-w-72 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
            @change="store.setFilter('assignmentsRoundKey', $event.target.value)"
          >
            <option value="all">Tất cả đợt chấm</option>
            <option v-for="round in store.roundOptions" :key="round.key" :value="round.key">
              {{ round.label }}
            </option>
          </select>
        </label>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
          @click="legacyCheckOpen = true"
        >
          Kiểm tra dữ liệu cũ
        </button>
        <button
          type="button"
          class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          @click="emit('assign-round')"
        >
          + Phân công vòng thi
        </button>
      </div>
    </div>

    <div class="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 text-center">
      <div class="py-3">
        <p class="text-lg font-bold text-slate-900">{{ store.evaluationCounts.total }}</p>
        <p class="text-[11px] text-slate-500">Phiếu đã giao</p>
      </div>
      <div class="py-3">
        <p class="text-lg font-bold text-emerald-700">{{ store.evaluationCounts.submitted }}</p>
        <p class="text-[11px] text-slate-500">Đã nộp</p>
      </div>
      <div class="py-3">
        <p class="text-lg font-bold text-amber-700">{{ store.evaluationCounts.draft }}</p>
        <p class="text-[11px] text-slate-500">Đang chấm</p>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[880px] text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            <th class="px-5 py-3">Dự án</th>
            <th class="px-4 py-3">Giám khảo</th>
            <th class="px-4 py-3">Bộ tiêu chí</th>
            <th class="px-4 py-3">Trạng thái phiếu</th>
            <th class="px-4 py-3">Tổng điểm</th>
            <th class="px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="evaluation in store.evaluationPagination.items" :key="evaluation.id" class="border-b border-slate-100 last:border-0">
            <td class="min-w-52 px-5 py-3.5">
              <p class="whitespace-nowrap font-medium text-slate-800">{{ evaluation.project }}</p>
              <p class="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                {{ store.getProjectByIdOrCode(evaluation.projectId)?.title || 'Dự án' }}
              </p>
            </td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600">{{ evaluation.judge }}</td>
            <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">{{ evaluation.rubric }}</td>
            <td class="px-4 py-3.5">
              <AdminStatusBadge
                :label="evaluation.status === 'SUBMITTED' ? 'Đã nộp' : 'Đang chấm'"
                :tone="evaluation.status === 'SUBMITTED' ? 'green' : 'amber'"
              />
            </td>
            <td class="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-800">{{ evaluation.score ?? '—' }}</td>
            <td class="px-5 py-3.5">
              <div class="flex justify-end gap-1.5 whitespace-nowrap">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
                  @click="emit('view-project', evaluation.projectId)"
                >
                  Xem dự án
                </button>
                <button
                  type="button"
                  :disabled="evaluation.status !== 'SUBMITTED'"
                  class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#1E56D9] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  @click="openEvaluation(evaluation.id)"
                >
                  Xem phiếu
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!store.evaluationPagination.total">
            <td colspan="6" class="px-5 py-10 text-center text-sm text-slate-400">
              Chưa có phiếu chấm trong đợt đánh giá này.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination
      :page="store.evaluationPagination.page"
      :page-size="store.evaluationPagination.pageSize"
      :total="store.evaluationPagination.total"
      unit="phiếu chấm"
      @update:page="store.setPage('evaluations', $event)"
      @update:page-size="store.setPageSize('evaluations', $event)"
    />
  </section>

  <AdminModal
    :is-open="Boolean(selectedEvaluation)"
    title="Chi tiết phiếu chấm"
    subtitle="Điểm tiêu chí được dựng để minh họa từ tổng điểm trong dữ liệu mock."
    @close="selectedEvaluationId = ''"
  >
    <template v-if="selectedEvaluation">
      <div class="grid gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 sm:grid-cols-2">
        <p class="text-xs text-slate-600"><strong>Dự án:</strong> {{ selectedEvaluation.project }}</p>
        <p class="text-xs text-slate-600"><strong>Giám khảo:</strong> {{ selectedEvaluation.judge }}</p>
        <p class="text-xs text-slate-600"><strong>Bộ tiêu chí:</strong> {{ selectedEvaluation.rubric }}</p>
        <p class="text-xs text-slate-600"><strong>Tổng điểm:</strong> {{ selectedEvaluation.score }}</p>
      </div>
      <div class="overflow-hidden rounded-xl border border-slate-200">
        <div
          v-for="criterion in selectedCriteria"
          :key="criterion.id"
          class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
        >
          <div>
            <p class="text-xs font-semibold text-slate-800">{{ criterion.name }}</p>
            <p class="mt-0.5 text-[11px] text-slate-400">Trọng số {{ criterion.weight }}%</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-[#1E56D9]">{{ criterion.score }}</p>
            <p class="text-[10px] text-slate-400">Điểm quy đổi {{ criterion.weightedScore }}</p>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="selectedEvaluationId = ''">
        Đóng
      </button>
    </template>
  </AdminModal>

  <AdminModal
    :is-open="legacyCheckOpen"
    title="Kiểm tra dữ liệu cũ"
    subtitle="Mô phỏng kiểm tra số lượng phiếu; thao tác này không thay đổi dữ liệu."
    :is-form="true"
    @close="legacyCheckOpen = false"
    @submit="handleLegacyCheck"
  >
    <label class="block text-xs font-medium text-slate-700">
      Số bản ghi cần kiểm tra
      <input
        v-model="legacyCheckLimit"
        type="number"
        min="0"
        max="5000"
        step="1"
        required
        class="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#1E56D9]"
      />
      <span class="mt-1 block text-[11px] font-normal text-slate-400">Nhập số nguyên từ 0 đến 5.000.</span>
    </label>
    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="legacyCheckOpen = false">
        Hủy
      </button>
      <button type="submit" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white">Chạy mô phỏng</button>
    </template>
  </AdminModal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useToastStore } from '@/stores/toast';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import AdminPagination from '@/modules/administration/common/components/ui/AdminPagination.vue';
import AdminStatusBadge from '@/modules/administration/common/components/ui/AdminStatusBadge.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';
import { buildEvaluationSummary } from '@/modules/administration/utils/judgingHelpers';

const emit = defineEmits(['assign-round', 'view-project']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();
const selectedEvaluationId = ref('');
const legacyCheckOpen = ref(false);
const legacyCheckLimit = ref(100);

const selectedEvaluation = computed(() =>
  store.evaluations.find((item) => item.id === selectedEvaluationId.value) || null
);
const selectedCriteria = computed(() => {
  if (!selectedEvaluation.value) return [];
  const rubric = store.rubrics.find((item) => item.id === selectedEvaluation.value.rubricId);
  return buildEvaluationSummary(selectedEvaluation.value, rubric);
});

function openEvaluation(evaluationId) {
  const evaluation = store.evaluations.find((item) => item.id === evaluationId);
  if (evaluation?.status !== 'SUBMITTED') return;
  selectedEvaluationId.value = evaluationId;
}

function handleLegacyCheck() {
  const result = store.runLegacyCheck(legacyCheckLimit.value);
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  legacyCheckOpen.value = false;
  toastStore.add({
    type: 'success',
    message: `Đã mô phỏng kiểm tra ${result.checkedCount} phiếu. Không có dữ liệu nào bị thay đổi.`,
  });
}
</script>

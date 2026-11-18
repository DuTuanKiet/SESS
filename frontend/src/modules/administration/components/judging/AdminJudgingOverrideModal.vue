<template>
  <AdminModal
    :is-open="isOpen"
    title="Điều chỉnh điểm"
    subtitle="Ghi nhận lịch sử điều chỉnh tổng điểm sau khi rà soát."
    max-width="3xl"
    :is-form="true"
    @close="emit('close')"
    @submit="handleSave"
  >
    <div class="space-y-4 text-xs">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">Cuộc thi
          <select v-model="draft.competitionId" class="form-control mt-1.5" @change="handleCompetitionChange">
            <option v-for="competition in store.competitions" :key="competition.id" :value="competition.id">{{ competition.code }} — {{ competition.title }}</option>
          </select>
        </label>
        <label class="font-medium text-slate-700">Vòng thi
          <select v-model.number="draft.roundNumber" class="form-control mt-1.5" @change="syncProject">
            <option v-for="round in selectedCompetition?.rounds || []" :key="round.roundNumber" :value="Number(round.roundNumber)">Vòng {{ round.roundNumber }} — {{ round.roundName }}</option>
          </select>
        </label>
      </div>
      <label class="block font-medium text-slate-700">Dự án cần điều chỉnh điểm <span class="text-rose-500">*</span>
        <select v-model="draft.projectId" required class="form-control mt-1.5" @change="suggestOriginalScore">
          <option v-for="project in availableProjects" :key="project.id" :value="project.id">{{ project.code }} — {{ project.title }} ({{ project.faculty }})</option>
        </select>
      </label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">Điểm gốc <span class="text-rose-500">*</span>
          <input v-model.number="draft.originalScore" type="number" min="0" max="10" step="0.1" required class="form-control mt-1.5" />
        </label>
        <label class="font-medium text-slate-700">Điểm mới sau phúc khảo <span class="text-rose-500">*</span>
          <input v-model.number="draft.newScore" type="number" min="0" max="10" step="0.1" required class="form-control mt-1.5 font-bold text-[#1E56D9]" />
        </label>
      </div>
      <div class="rounded-lg border border-blue-100 bg-[#F1F7FF] px-3 py-2 text-xs text-slate-600">
        Tiêu chí cố định: <strong class="text-slate-800">Tổng điểm đánh giá</strong>. Phiếu chấm gốc không bị thay đổi.
      </div>
      <label class="block font-medium text-slate-700">Lý do phúc khảo / điều chỉnh <span class="text-rose-500">*</span>
        <textarea v-model="draft.reason" required minlength="5" rows="3" class="form-control mt-1.5 resize-none" placeholder="Nhập lý do điều chỉnh hoặc căn cứ biên bản phúc khảo (tối thiểu 5 ký tự)..." />
        <span class="mt-1 block font-normal text-slate-400">Tối thiểu 5 ký tự.</span>
      </label>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">Hủy</button>
      <button type="submit" :disabled="!canSubmit" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">Xác nhận điều chỉnh</button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const props = defineProps({ isOpen: { type: Boolean, default: false } });
const emit = defineEmits(['close', 'saved']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();
const draft = reactive({
  competitionId: '',
  roundNumber: 1,
  projectId: '',
  originalScore: 7,
  newScore: 8,
  reason: '',
});

const selectedCompetition = computed(() => store.competitions.find((item) => item.id === draft.competitionId));
const availableProjects = computed(() => store.getRoundProjects(draft.competitionId, draft.roundNumber));
const canSubmit = computed(
  () => Boolean(draft.projectId && Number.isFinite(Number(draft.originalScore)) && Number.isFinite(Number(draft.newScore)) && draft.reason.trim().length >= 5)
);

function suggestOriginalScore() {
  const matchingEvaluations = store.evaluations.filter(
    (item) =>
      item.competitionId === draft.competitionId &&
      Number(item.roundNumber) === Number(draft.roundNumber) &&
      item.projectId === draft.projectId &&
      item.status === 'SUBMITTED' &&
      Number.isFinite(Number(item.score))
  );
  if (!matchingEvaluations.length) {
    draft.originalScore = 0;
    return;
  }
  const average = matchingEvaluations.reduce((sum, item) => sum + Number(item.score), 0) / matchingEvaluations.length;
  draft.originalScore = Number(average.toFixed(1));
}

function syncProject() {
  draft.projectId = availableProjects.value[0]?.id || '';
  suggestOriginalScore();
}

function handleCompetitionChange() {
  draft.roundNumber = selectedCompetition.value?.rounds?.[0]?.roundNumber || 1;
  syncProject();
}

function resetDraft() {
  const context = store.getRoundContext(store.filters.assignmentsRoundKey);
  const competitionId = context?.competitionId || store.competitions[0]?.id || '';
  const competition = store.competitions.find((item) => item.id === competitionId);
  Object.assign(draft, {
    competitionId,
    roundNumber: context?.roundNumber || competition?.rounds?.[0]?.roundNumber || 1,
    projectId: '',
    originalScore: 7,
    newScore: 8,
    reason: '',
  });
  syncProject();
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetDraft();
}, { immediate: true });

function handleSave() {
  const result = store.createOverride(draft);
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  toastStore.add({ type: 'success', message: `Đã ghi nhận điều chỉnh điểm cho ${result.override.project}.` });
  emit('saved');
}
</script>

<style scoped>
.form-control {
  display: block;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  background: white;
  padding: 0.55rem 0.75rem;
  color: #0f172a;
  outline: none;
}

.form-control:focus {
  border-color: #1e56d9;
  box-shadow: 0 0 0 2px rgb(30 86 217 / 12%);
}
</style>

<template>
  <AdminModal
    :is-open="isOpen"
    title="Tạo lệnh điều chuyển giám khảo"
    subtitle="Chọn dự án, giám khảo hiện tại và người thay thế."
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
          <select v-model.number="draft.roundNumber" class="form-control mt-1.5" @change="resetProject">
            <option v-for="round in selectedCompetition?.rounds || []" :key="round.roundNumber" :value="Number(round.roundNumber)">Vòng {{ round.roundNumber }} — {{ round.roundName }}</option>
          </select>
        </label>
      </div>
      <label class="block font-medium text-slate-700">Dự án cần điều chuyển giám khảo <span class="text-rose-500">*</span>
        <select v-model="draft.projectId" required class="form-control mt-1.5" @change="syncJudges">
          <option v-for="project in availableProjects" :key="project.id" :value="project.id">{{ project.code }} — {{ project.title }} ({{ project.faculty }})</option>
        </select>
      </label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">Giám khảo hiện tại <span class="text-rose-500">*</span>
          <select v-model="draft.originalJudgeEmail" required class="form-control mt-1.5" @change="syncReplacement">
            <option v-for="judge in originalJudges" :key="judge.email" :value="judge.email">{{ judge.name }} ({{ judge.unit }})</option>
          </select>
        </label>
        <label class="font-medium text-slate-700">Giám khảo thay thế <span class="text-rose-500">*</span>
          <select v-model="draft.replacementJudgeEmail" required class="form-control mt-1.5">
            <option v-for="judge in replacementJudges" :key="judge.email" :value="judge.email">{{ judge.name }} ({{ judge.unit }})</option>
          </select>
        </label>
      </div>
      <label class="block font-medium text-slate-700">Lý do điều chuyển <span class="text-rose-500">*</span>
        <textarea v-model="draft.reason" required minlength="5" rows="3" class="form-control mt-1.5 resize-none" placeholder="Nhập lý do điều chuyển (tối thiểu 5 ký tự)..." />
        <span class="mt-1 block font-normal text-slate-400">Tối thiểu 5 ký tự.</span>
      </label>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">Hủy</button>
      <button type="submit" :disabled="!canSubmit" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">Tạo lệnh điều chuyển</button>
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
  originalJudgeEmail: '',
  replacementJudgeEmail: '',
  reason: '',
});

const selectedCompetition = computed(() => store.competitions.find((item) => item.id === draft.competitionId));
const availableProjects = computed(() => store.getRoundProjects(draft.competitionId, draft.roundNumber));
const projectEvaluations = computed(() =>
  store.evaluations.filter(
    (item) =>
      item.projectId === draft.projectId &&
      item.competitionId === draft.competitionId &&
      Number(item.roundNumber) === Number(draft.roundNumber)
  )
);
const originalJudges = computed(() => {
  const emails = [...new Set(projectEvaluations.value.map((item) => item.judgeEmail))];
  const assignedJudges = emails.map((email) => store.getJudgeByEmail(email)).filter(Boolean);
  return assignedJudges.length ? assignedJudges : store.judges;
});
const replacementJudges = computed(() =>
  store.judges.filter((judge) => judge.email !== draft.originalJudgeEmail)
);
const canSubmit = computed(
  () => Boolean(draft.projectId && draft.originalJudgeEmail && draft.replacementJudgeEmail && draft.reason.trim().length >= 5)
);

function syncJudges() {
  draft.originalJudgeEmail = originalJudges.value[0]?.email || '';
  syncReplacement();
}

function syncReplacement() {
  if (!replacementJudges.value.some((judge) => judge.email === draft.replacementJudgeEmail)) {
    draft.replacementJudgeEmail = replacementJudges.value[0]?.email || '';
  }
}

function resetProject() {
  draft.projectId = availableProjects.value[0]?.id || '';
  syncJudges();
}

function handleCompetitionChange() {
  draft.roundNumber = selectedCompetition.value?.rounds?.[0]?.roundNumber || 1;
  resetProject();
}

function resetDraft() {
  const context = store.getRoundContext(store.filters.assignmentsRoundKey);
  const competitionId = context?.competitionId || store.competitions[0]?.id || '';
  const competition = store.competitions.find((item) => item.id === competitionId);
  Object.assign(draft, {
    competitionId,
    roundNumber: context?.roundNumber || competition?.rounds?.[0]?.roundNumber || 1,
    projectId: '',
    originalJudgeEmail: '',
    replacementJudgeEmail: '',
    reason: '',
  });
  resetProject();
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) resetDraft();
}, { immediate: true });

function handleSave() {
  const result = store.createEmergency(draft);
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  toastStore.add({ type: 'success', message: `Đã tạo lệnh điều chuyển cho ${result.emergency.project}.` });
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

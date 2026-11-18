<template>
  <AdminModal
    :is-open="isOpen"
    title="Phân công Hội đồng chấm Vòng thi"
    subtitle="Hội đồng giám khảo sẽ phụ trách chấm các dự án được chọn trong vòng thi."
    max-width="5xl"
    :is-form="true"
    @close="emit('close')"
    @submit="handleSave"
  >
    <div class="space-y-4 text-xs">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">
          Cuộc thi <span class="text-rose-500">*</span>
          <select v-model="draft.competitionId" required class="form-control mt-1.5" @change="handleCompetitionChange">
            <option v-for="competition in store.competitions" :key="competition.id" :value="competition.id">{{ competition.code }} — {{ competition.title }}</option>
          </select>
        </label>
        <label class="font-medium text-slate-700">
          Vòng thi đánh giá <span class="text-rose-500">*</span>
          <select v-model.number="draft.roundNumber" required class="form-control mt-1.5" @change="handleRoundChange">
            <option v-for="round in selectedCompetition?.rounds || []" :key="round.roundNumber" :value="Number(round.roundNumber)">Vòng {{ round.roundNumber }} — {{ round.roundName }}</option>
          </select>
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">
          Hội đồng phụ trách <span class="text-rose-500">*</span>
          <select v-model="draft.councilId" required class="form-control mt-1.5" @change="handleCouncilChange">
            <option v-for="council in matchingCouncils" :key="council.id" :value="council.id">{{ council.name }} ({{ council.memberEmails.length }} giám khảo)</option>
            <option v-if="!matchingCouncils.length" value="">Chưa thành lập hội đồng cho vòng này</option>
          </select>
        </label>
        <label class="font-medium text-slate-700">
          Bộ tiêu chí chấm điểm <span class="text-rose-500">*</span>
          <select v-model="draft.rubricId" required class="form-control mt-1.5">
            <option v-for="rubric in availableRubrics" :key="rubric.id" :value="rubric.id">{{ rubric.name }} v{{ rubric.version }} ({{ rubric.status === 'Active' ? 'Đang áp dụng' : 'Bản nháp' }})</option>
          </select>
        </label>
      </div>

      <div class="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-semibold text-slate-800">Thành viên Hội đồng chấm</span>
          <span class="text-[11px] text-slate-400">Mặc định chọn cả hội đồng; có thể bỏ chọn giám khảo.</span>
        </div>
        <div v-if="availableJudges.length" class="flex flex-wrap gap-2 pt-1">
          <label v-for="judge in availableJudges" :key="judge.email" class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 transition hover:border-[#1E56D9]">
            <input v-model="draft.judgeEmails" type="checkbox" :value="judge.email" class="h-4 w-4 accent-[#1E56D9]" />
            <span class="font-medium text-slate-700">{{ judge.name }}</span>
          </label>
        </div>
        <p v-else class="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Vòng thi này chưa có hội đồng phù hợp.</p>
      </div>

      <div class="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <label class="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-800">
            <input ref="masterProjectCheckbox" type="checkbox" :checked="isAllProjectsSelected" class="h-4 w-4 accent-[#1E56D9]" @change="toggleAllProjects" />
            <span>Dự án trong vòng thi ({{ draft.projectIds.length }}/{{ availableProjects.length }} dự án)</span>
          </label>
          <span class="text-[11px] text-slate-400">Đã chọn cả giám khảo và dự án để xem quy mô phân công.</span>
        </div>
        <div v-if="availableProjects.length" class="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          <label v-for="project in availableProjects" :key="project.id" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-50">
            <input v-model="draft.projectIds" type="checkbox" :value="project.id" class="h-4 w-4 accent-[#1E56D9]" />
            <span class="font-mono font-semibold text-[#1E56D9]">{{ project.code }}</span>
            <span class="min-w-0 truncate font-medium text-slate-700">{{ project.title }}</span>
            <span class="ml-auto shrink-0 text-[10px] text-slate-400">{{ project.faculty }}</span>
          </label>
        </div>
        <p v-else class="rounded-lg bg-slate-50 px-3 py-3 text-center text-slate-400">Chưa có dự án phù hợp trong vòng này.</p>
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-[#F1F7FF] px-3 py-2 text-slate-700">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-slate-600">Quy mô phân công:</span>
            <span class="font-semibold text-slate-900">{{ draft.judgeEmails.length }} giám khảo</span>
            <span class="text-slate-400">×</span>
            <span class="font-semibold text-slate-900">{{ draft.projectIds.length }} dự án</span>
          </div>
          <div><span class="text-[11px] text-slate-500">Tổng phiếu dự kiến:</span> <strong class="text-sm text-[#1E56D9]">{{ expectedEvaluationCount }}</strong></div>
        </div>
      </div>

      <label class="block font-medium text-slate-700">
        Ghi chú phân công
        <input v-model="draft.note" class="form-control mt-1.5" placeholder="Ghi chú cho toàn hội đồng trong vòng này (nếu có)..." />
      </label>
    </div>

    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">Hủy</button>
      <button type="submit" :disabled="!canSubmit" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Xác nhận phân công vòng thi</button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  councilId: { type: String, default: '' },
});
const emit = defineEmits(['close', 'saved']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();
const masterProjectCheckbox = ref(null);
const draft = reactive({
  competitionId: '',
  roundNumber: 1,
  councilId: '',
  rubricId: '',
  judgeEmails: [],
  projectIds: [],
  note: '',
});

const selectedCompetition = computed(() =>
  store.competitions.find((item) => item.id === draft.competitionId)
);
const matchingCouncils = computed(() =>
  store.councils.filter(
    (item) =>
      item.competitionId === draft.competitionId &&
      Number(item.roundNumber) === Number(draft.roundNumber)
  )
);
const selectedCouncil = computed(() => matchingCouncils.value.find((item) => item.id === draft.councilId));
const availableJudges = computed(() =>
  (selectedCouncil.value?.memberEmails || [])
    .map((email) => store.getJudgeByEmail(email))
    .filter(Boolean)
);
const availableProjects = computed(() =>
  store.getRoundProjects(draft.competitionId, draft.roundNumber)
);
const availableRubrics = computed(() => store.rubrics.filter((item) => item.status !== 'Deprecated'));
const isAllProjectsSelected = computed(
  () => availableProjects.value.length > 0 && draft.projectIds.length === availableProjects.value.length
);
const isSomeProjectsSelected = computed(
  () => draft.projectIds.length > 0 && draft.projectIds.length < availableProjects.value.length
);
const expectedEvaluationCount = computed(() => draft.judgeEmails.length * draft.projectIds.length);
const canSubmit = computed(
  () => Boolean(draft.councilId && draft.rubricId && draft.judgeEmails.length && draft.projectIds.length)
);

function syncRubric() {
  const round = selectedCompetition.value?.rounds?.find(
    (item) => Number(item.roundNumber) === Number(draft.roundNumber)
  );
  const matchingRubric = availableRubrics.value.find(
    (item) => round?.rubricName?.toLowerCase().includes(item.name.toLowerCase())
  );
  draft.rubricId = matchingRubric?.id || availableRubrics.value[0]?.id || '';
}

function selectAllCouncilMembers() {
  draft.judgeEmails = availableJudges.value.map((judge) => judge.email);
}

function syncRoundChoices(preferredCouncilId = '') {
  const nextCouncil =
    matchingCouncils.value.find((item) => item.id === preferredCouncilId) || matchingCouncils.value[0];
  draft.councilId = nextCouncil?.id || '';
  draft.projectIds = availableProjects.value.map((project) => project.id);
  selectAllCouncilMembers();
  syncRubric();
}

function resetDraft() {
  const preferredCouncil = store.councils.find((item) => item.id === props.councilId);
  const context = store.getRoundContext(store.filters.assignmentsRoundKey);
  const competitionId = preferredCouncil?.competitionId || context?.competitionId || store.competitions[0]?.id || '';
  const competition = store.competitions.find((item) => item.id === competitionId);
  Object.assign(draft, {
    competitionId,
    roundNumber: preferredCouncil?.roundNumber || context?.roundNumber || competition?.rounds?.[0]?.roundNumber || 1,
    councilId: '',
    rubricId: '',
    judgeEmails: [],
    projectIds: [],
    note: '',
  });
  syncRoundChoices(preferredCouncil?.id || '');
}

function handleCompetitionChange() {
  draft.roundNumber = selectedCompetition.value?.rounds?.[0]?.roundNumber || 1;
  syncRoundChoices();
}

function handleRoundChange() {
  syncRoundChoices();
}

function handleCouncilChange() {
  selectAllCouncilMembers();
}

function toggleAllProjects(event) {
  draft.projectIds = event.target.checked ? availableProjects.value.map((project) => project.id) : [];
}

watch(() => [props.isOpen, props.councilId], ([isOpen]) => {
  if (isOpen) resetDraft();
}, { immediate: true });
watch([isSomeProjectsSelected, isAllProjectsSelected], () => {
  if (masterProjectCheckbox.value) {
    masterProjectCheckbox.value.indeterminate = isSomeProjectsSelected.value && !isAllProjectsSelected.value;
  }
}, { flush: 'post' });

function handleSave() {
  const result = store.assignRound({ ...draft, note: draft.note.trim() });
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  toastStore.add({
    type: result.createdCount ? 'success' : 'info',
    message: result.createdCount
      ? `Đã tạo ${result.createdCount} phiếu chấm${result.duplicateCount ? `; bỏ qua ${result.duplicateCount} phiếu trùng` : ''}.`
      : `Không tạo phiếu mới; ${result.duplicateCount} phiếu đã tồn tại.`,
  });
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

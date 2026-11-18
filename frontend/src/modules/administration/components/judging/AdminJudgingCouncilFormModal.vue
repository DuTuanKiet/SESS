<template>
  <AdminModal
    :is-open="isOpen"
    :title="councilId ? 'Chỉnh sửa Hội đồng Giám khảo' : 'Thành lập Hội đồng Giám khảo'"
    subtitle="Chỉ định Chủ tịch, Thư ký và các Ủy viên đánh giá theo vòng thi."
    max-width="3xl"
    :is-form="true"
    @close="emit('close')"
    @submit="handleSave"
  >
    <div class="space-y-4 text-xs">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">
          Cuộc thi <span class="text-rose-500">*</span>
          <select v-model="draft.competitionId" required class="form-control mt-1.5">
            <option v-for="competition in store.competitions" :key="competition.id" :value="competition.id">
              {{ competition.code }} — {{ competition.title }}
            </option>
          </select>
        </label>
        <label class="font-medium text-slate-700">
          Vòng thi <span class="text-rose-500">*</span>
          <select v-model.number="draft.roundNumber" required class="form-control mt-1.5">
            <option v-for="round in selectedCompetition?.rounds || []" :key="round.roundNumber" :value="Number(round.roundNumber)">
              Vòng {{ round.roundNumber }} — {{ round.roundName }}
            </option>
          </select>
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">
          Tên Hội đồng Giám khảo <span class="text-rose-500">*</span>
          <input v-model="draft.name" required class="form-control mt-1.5" placeholder="VD: Hội đồng Giám khảo Vòng 1 — Sơ khảo" />
        </label>
        <label class="font-medium text-slate-700">
          Số Quyết định thành lập <span class="text-rose-500">*</span>
          <input v-model="draft.decisionNumber" required class="form-control mt-1.5" placeholder="VD: 158/QĐ-ĐHKTCN" />
        </label>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="font-medium text-slate-700">
          Chủ tịch Hội đồng <span class="text-rose-500">*</span>
          <select v-model="draft.chairEmail" required class="form-control mt-1.5">
            <option v-for="judge in store.judges" :key="judge.email" :value="judge.email">{{ judge.name }} ({{ judge.unit }})</option>
          </select>
        </label>
        <label class="font-medium text-slate-700">
          Thư ký Hội đồng <span class="text-rose-500">*</span>
          <select v-model="draft.secretaryEmail" required class="form-control mt-1.5">
            <option v-for="judge in store.judges" :key="judge.email" :value="judge.email">{{ judge.name }} ({{ judge.unit }})</option>
          </select>
        </label>
      </div>

      <fieldset class="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <legend class="px-1 font-semibold text-slate-700">Ủy viên Hội đồng</legend>
        <div class="max-h-40 space-y-1 overflow-y-auto">
          <label v-for="judge in store.judges" :key="judge.email" class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white">
            <input v-model="draft.memberEmails" type="checkbox" :value="judge.email" class="h-4 w-4 accent-[#1E56D9]" />
            <span class="font-medium text-slate-800">{{ judge.name }}</span>
            <span class="text-[11px] text-slate-400">{{ judge.staffCode }} · {{ judge.unit }}</span>
          </label>
        </div>
      </fieldset>

      <label class="block font-medium text-slate-700">
        Ghi chú / Quyết định phân công
        <textarea v-model="draft.note" rows="2" class="form-control mt-1.5 resize-none" placeholder="Ghi chú phân công chuyên môn hoặc lịch họp hội đồng..." />
      </label>
    </div>

    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">
        Hủy
      </button>
      <button type="submit" class="rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
        {{ councilId ? 'Lưu thay đổi' : 'Thành lập hội đồng' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
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

const draft = reactive({
  competitionId: '',
  roundNumber: 1,
  name: '',
  decisionNumber: '',
  chairEmail: '',
  secretaryEmail: '',
  memberEmails: [],
  note: '',
});

const selectedCompetition = computed(() =>
  store.competitions.find((competition) => competition.id === draft.competitionId)
);

function resetDraft() {
  const council = store.councils.find((item) => item.id === props.councilId);
  const firstCompetition = store.competitions[0];
  Object.assign(draft, {
    competitionId: council?.competitionId || store.filters.councilCompetitionId || firstCompetition?.id || '',
    roundNumber: council?.roundNumber || firstCompetition?.rounds?.[0]?.roundNumber || 1,
    name: council?.name || '',
    decisionNumber: council?.decisionNumber || '',
    chairEmail: council?.chairEmail || store.judges[0]?.email || '',
    secretaryEmail: council?.secretaryEmail || store.judges[1]?.email || '',
    memberEmails: [...(council?.memberEmails || [])],
    note: council?.note || '',
  });
}

watch(() => [props.isOpen, props.councilId], ([isOpen]) => {
  if (isOpen) resetDraft();
}, { immediate: true });

function handleSave() {
  const result = store.saveCouncil(props.councilId, draft);
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  toastStore.add({
    type: 'success',
    message: props.councilId ? 'Đã cập nhật hội đồng giám khảo.' : 'Đã thành lập hội đồng giám khảo.',
  });
  emit('saved', result.council.id);
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

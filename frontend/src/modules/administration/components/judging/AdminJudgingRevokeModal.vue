<template>
  <AdminModal
    :is-open="isOpen"
    :title="kind === 'override' ? 'Thu hồi điều chỉnh điểm' : 'Thu hồi lệnh điều chuyển'"
    :subtitle="targetLabel ? `Bản ghi: ${targetLabel}` : ''"
    :is-form="true"
    @close="emit('close')"
    @submit="handleRevoke"
  >
    <label class="block text-xs font-medium text-slate-700">
      Lý do thu hồi <span class="text-rose-500">*</span>
      <textarea v-model="reason" required minlength="5" rows="3" class="form-control mt-1.5 resize-none" placeholder="Nhập lý do thu hồi (tối thiểu 5 ký tự)..." />
      <span class="mt-1 block font-normal text-slate-400">Tối thiểu 5 ký tự.</span>
    </label>
    <template #footer>
      <button type="button" class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700" @click="emit('close')">Hủy</button>
      <button type="submit" class="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">Xác nhận thu hồi</button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import { useAdminJudgingStore } from '@/modules/administration/stores/useAdminJudgingStore';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  kind: { type: String, default: 'override' },
  recordId: { type: String, default: '' },
});
const emit = defineEmits(['close', 'saved']);
const store = useAdminJudgingStore();
const toastStore = useToastStore();
const reason = ref('');

const targetLabel = computed(() => {
  const list = props.kind === 'override' ? store.overrides : store.emergencies;
  const record = list.find((item) => item.id === props.recordId);
  return record?.project || '';
});

watch(() => [props.isOpen, props.kind, props.recordId], ([isOpen]) => {
  if (isOpen) reason.value = '';
}, { immediate: true });

function handleRevoke() {
  const result = store.revokeRecord(props.kind, props.recordId, reason.value);
  if (!result.ok) {
    toastStore.add({ type: 'warning', message: result.message });
    return;
  }
  toastStore.add({ type: 'success', message: 'Đã thu hồi bản ghi.' });
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
  padding: 0.6rem 0.75rem;
  color: #0f172a;
  outline: none;
}

.form-control:focus {
  border-color: #1e56d9;
  box-shadow: 0 0 0 2px rgb(30 86 217 / 12%);
}
</style>

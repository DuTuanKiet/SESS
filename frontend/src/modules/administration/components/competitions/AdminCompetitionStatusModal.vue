<template>
  <AdminModal
    :is-open="isOpen && Boolean(competition)"
    title="Đổi trạng thái cuộc thi"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div>
      <label for="competitionStatusSelect" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Trạng thái mới
      </label>
      <select
        id="competitionStatusSelect"
        v-model="form.status"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      >
        <option value="UPCOMING">Sắp mở</option>
        <option value="ACTIVE">Đang diễn ra</option>
        <option value="CLOSED">Đã kết thúc</option>
      </select>
    </div>

    <div>
      <label for="competitionStatusNote" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Ghi chú điều hành
      </label>
      <textarea
        id="competitionStatusNote"
        v-model="form.note"
        rows="3"
        placeholder="Ghi chú lý do hoặc chỉ đạo điều hành (không bắt buộc)..."
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { COMPETITION_STATUS } from '@/modules/administration/constants/adminConstants';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  competition: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  status: 'UPCOMING',
  note: '',
});

const modalSubtitle = computed(() => {
  if (!props.competition) return '';
  const currentLabel = COMPETITION_STATUS[props.competition.status]?.label || props.competition.status;
  return `${props.competition.code} • Hiện tại: ${currentLabel}`;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (opened && props.competition) {
      form.status = props.competition.status || 'UPCOMING';
      form.note = '';
    }
  }
);

function handleSubmit() {
  emit('submit', { ...form });
}
</script>

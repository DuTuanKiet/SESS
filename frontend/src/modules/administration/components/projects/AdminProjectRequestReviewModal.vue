<template>
  <AdminModal
    :is-open="isOpen && Boolean(item)"
    :title="modeConfig.title"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <p class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]">
      {{ noticeText }}
    </p>

    <div>
      <label for="requestReviewDecision" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Quyết định
      </label>
      <select
        id="requestReviewDecision"
        v-model="form.decision"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      >
        <option v-for="opt in modeConfig.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div>
      <label for="requestReviewNote" class="mb-1.5 block text-xs font-semibold text-slate-700">
        {{ modeConfig.noteLabel }}
        <span v-if="modeConfig.minNoteLength > 0" class="text-rose-500">*</span>
      </label>
      <textarea
        id="requestReviewNote"
        v-model="form.note"
        rows="3"
        :placeholder="modeConfig.notePlaceholder"
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
      <p v-if="modeConfig.hint" class="mt-1 text-[11px] leading-relaxed text-slate-400">
        {{ modeConfig.hint }}
      </p>
      <p v-if="validationError" class="mt-1 text-[11px] font-medium text-rose-600">
        {{ validationError }}
      </p>
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
import { computed, reactive, ref, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

// Modal tham số hóa dùng chung cho xét duyệt đơn xin hủy và phản hồi yêu cầu đổi thành viên
const MODE_CONFIG = {
  cancel: {
    title: 'Xét duyệt đơn xin hủy',
    options: [
      { value: 'APPROVED', label: 'Đồng ý hủy dự án' },
      { value: 'REJECTED', label: 'Từ chối đơn xin hủy' },
    ],
    noteLabel: 'Ghi chú xử lý',
    notePlaceholder: 'Nhập ghi chú xử lý đơn xin hủy...',
    minNoteLength: 5,
    hint: 'Tối thiểu 5 ký tự.',
    errorText: 'Vui lòng nhập ghi chú xử lý tối thiểu 5 ký tự.',
  },
  change: {
    title: 'Phản hồi thay đổi thành viên',
    options: [
      { value: 'APPROVED', label: 'Phê duyệt' },
      { value: 'REJECTED', label: 'Từ chối' },
    ],
    noteLabel: 'Lý do',
    notePlaceholder: 'Nhập lý do phản hồi (không bắt buộc)...',
    minNoteLength: 0,
    hint: '',
    errorText: '',
  },
};

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'cancel',
  },
  item: {
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
  decision: 'APPROVED',
  note: '',
});
const validationError = ref('');

const modeConfig = computed(() => MODE_CONFIG[props.mode] || MODE_CONFIG.cancel);

const modalSubtitle = computed(() => {
  if (!props.item) return '';
  if (props.mode === 'change') {
    return `${props.item.project} • ${props.item.student}`;
  }
  return `${props.item.project} • ${props.item.by}`;
});

const noticeText = computed(() => {
  if (!props.item) return '';
  if (props.mode === 'change') {
    const actionLabel =
      props.item.type === 'ADD' ? 'Đề nghị thêm thành viên' : 'Đề nghị xóa / rời nhóm';
    return `${actionLabel}: ${props.item.student} — ${props.item.reason}`;
  }
  return `Lý do nhóm gửi: ${props.item.reason}`;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened) return;
    form.decision = 'APPROVED';
    form.note = '';
    validationError.value = '';
  }
);

function handleSubmit() {
  if (!props.item) return;
  const cleanNote = form.note.trim();
  if (cleanNote.length < modeConfig.value.minNoteLength) {
    validationError.value = modeConfig.value.errorText;
    return;
  }
  validationError.value = '';
  emit('submit', {
    decision: form.decision,
    note: cleanNote,
  });
}
</script>

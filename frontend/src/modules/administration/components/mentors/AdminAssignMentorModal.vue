<template>
  <AdminModal
    :is-open="isOpen && Boolean(project) && Boolean(mentor)"
    title="Phân công cố vấn"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <p class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]">
      Dự án chưa có cố vấn sẽ được gắn cố vấn hướng dẫn và cập nhật trạng thái tương ứng.
    </p>

    <div>
      <label for="assignMentorNote" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Ghi chú phân công
      </label>
      <textarea
        id="assignMentorNote"
        v-model="note"
        rows="3"
        placeholder="Nhập ghi chú gửi kèm phân công (không bắt buộc)..."
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
import { computed, ref, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  mentor: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const note = ref('');

const modalSubtitle = computed(() => {
  if (!props.project || !props.mentor) return '';
  return `${props.project.code} → ${props.mentor.name}`;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (opened) note.value = '';
  }
);

function handleSubmit() {
  if (!props.project || !props.mentor) return;
  emit('submit', {
    projectId: props.project.id,
    mentorId: props.mentor.id,
    note: note.value.trim(),
  });
}
</script>

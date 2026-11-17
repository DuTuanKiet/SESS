<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    title="Đổi cố vấn hướng dẫn"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <p
      v-if="!availableMentors.length"
      class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]"
    >
      Hiện không còn cố vấn nào trống chỉ tiêu (&lt; 2 dự án) để điều chuyển.
    </p>

    <template v-else>
      <div>
        <label for="reassignMentorSelect" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Cố vấn mới <span class="text-rose-500">*</span>
        </label>
        <select
          id="reassignMentorSelect"
          v-model="form.newMentorId"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="item in availableMentors" :key="item.id" :value="item.id">
            {{ item.name }} ({{ item.activeProjects.length }}/{{ item.maxProjects }})
          </option>
        </select>
      </div>

      <div>
        <label for="reassignMentorReason" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Lý do điều chuyển <span class="text-rose-500">*</span>
        </label>
        <textarea
          id="reassignMentorReason"
          v-model="form.reason"
          rows="3"
          placeholder="Nhập rõ lý do thay đổi cố vấn hướng dẫn..."
          class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">Tối thiểu 5 ký tự.</p>
        <p v-if="validationError" class="mt-1 text-[11px] font-medium text-rose-600">
          {{ validationError }}
        </p>
      </div>
    </template>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        {{ availableMentors.length ? 'Hủy' : 'Đóng' }}
      </button>
      <button
        v-if="availableMentors.length"
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

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  currentMentor: {
    type: Object,
    default: null,
  },
  availableMentors: {
    type: Array,
    default: () => [],
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  newMentorId: '',
  reason: '',
});
const validationError = ref('');

const modalSubtitle = computed(() => {
  if (!props.project) return '';
  const codeText = props.project.displayLabel || props.project.code || props.project.projectId;
  return props.currentMentor ? `${codeText} • Hiện tại: ${props.currentMentor.name}` : codeText;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened) return;
    form.newMentorId = props.availableMentors[0]?.id || '';
    form.reason = '';
    validationError.value = '';
  }
);

function handleSubmit() {
  if (!props.availableMentors.length || !props.project) return;
  const cleanReason = form.reason.trim();
  if (!form.newMentorId || cleanReason.length < 5) {
    validationError.value = 'Vui lòng chọn cố vấn mới và nhập lý do tối thiểu 5 ký tự.';
    return;
  }

  validationError.value = '';
  emit('submit', {
    projectId: props.project.projectId,
    projectCode: props.project.code || props.project.displayLabel,
    currentMentorId: props.currentMentor?.id || '',
    newMentorId: form.newMentorId,
    reason: cleanReason,
  });
}
</script>

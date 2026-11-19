<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    title="Chuyển trạng thái dự án"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div>
      <label for="projectStatusSelect" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Trạng thái mới
      </label>
      <select
        id="projectStatusSelect"
        v-model="form.status"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      >
        <option v-for="statusKey in transitionInfo.targets" :key="statusKey" :value="statusKey">
          {{ PROJECT_STATUS[statusKey]?.label || statusKey }}
        </option>
      </select>
    </div>

    <div>
      <label for="projectStatusNote" class="mb-1.5 block text-xs font-semibold text-slate-700">
        Ghi chú thẩm định gửi nhóm
      </label>
      <textarea
        id="projectStatusNote"
        v-model="form.note"
        rows="3"
        placeholder="Nhập ghi chú thẩm định gửi nhóm (không bắt buộc)..."
        class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
    </div>

    <!-- Khi dự án ở trạng thái kết thúc, bắt buộc xác nhận cưỡng chế và nhập lý do kiểm toán -->
    <template v-if="transitionInfo.isTerminal">
      <p class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]">
        Dự án đang ở trạng thái kết thúc. Chỉ có thể cưỡng chế kèm lý do kiểm toán.
      </p>

      <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
        <input v-model="form.force" type="checkbox" class="h-4 w-4 accent-[#1E56D9]" />
        <span>Cưỡng chế chuyển trạng thái</span>
      </label>

      <div>
        <label for="projectForceReason" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Lý do kiểm toán <span class="text-rose-500">*</span>
        </label>
        <textarea
          id="projectForceReason"
          v-model="form.forceReason"
          rows="3"
          placeholder="Mô tả rõ lý do cưỡng chế chuyển trạng thái..."
          class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">Tối thiểu 10 ký tự.</p>
      </div>
    </template>

    <p v-if="validationError" class="text-[11px] font-medium text-rose-600">
      {{ validationError }}
    </p>

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
        :disabled="isSubmitting || !transitionInfo.targets.length"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="
          transitionInfo.isTerminal
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-[#1E56D9] hover:bg-[#1d4ed8]'
        "
      >
        {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { PROJECT_STATUS } from '@/modules/administration/constants/adminConstants';
import { getAllowedProjectTransitions } from '@/modules/administration/utils/projectManagementHelpers';
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
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);

const form = reactive({
  status: '',
  note: '',
  force: false,
  forceReason: '',
});
const validationError = ref('');

const transitionInfo = computed(() => getAllowedProjectTransitions(props.project?.status));

const modalSubtitle = computed(() => {
  if (!props.project) return '';
  const currentLabel = PROJECT_STATUS[props.project.status]?.label || props.project.status;
  return `${props.project.code} - Hiện tại: ${currentLabel}`;
});

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened || !props.project) return;
    form.status = transitionInfo.value.targets[0] || '';
    form.note = '';
    form.force = false;
    form.forceReason = '';
    validationError.value = '';
  }
);

function handleSubmit() {
  if (!props.project || !form.status) return;
  if (transitionInfo.value.isTerminal) {
    const cleanForceReason = form.forceReason.trim();
    if (!form.force || cleanForceReason.length < 10) {
      validationError.value = 'Vui lòng đánh dấu cưỡng chế và nhập lý do tối thiểu 10 ký tự.';
      return;
    }
  }
  validationError.value = '';
  emit('submit', {
    status: form.status,
    note: form.note.trim(),
    force: form.force,
    forceReason: form.forceReason.trim(),
  });
}
</script>

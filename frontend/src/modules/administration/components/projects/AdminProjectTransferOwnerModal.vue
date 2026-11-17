<template>
  <AdminModal
    :is-open="isOpen && Boolean(project)"
    title="Chuyển quyền trưởng nhóm"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <p
      v-if="!candidates.length"
      class="rounded-lg bg-[#F1F7FF] px-3 py-2 text-xs leading-relaxed text-[#0B1F4B]"
    >
      Nhóm hiện chỉ có 1 thành viên nên chưa thể chuyển quyền trưởng nhóm.
    </p>

    <template v-else>
      <div>
        <label for="transferOwnerSelect" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Trưởng nhóm mới
        </label>
        <select
          id="transferOwnerSelect"
          v-model="form.targetLeaderName"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option v-for="member in candidates" :key="member" :value="member">
            {{ member }}
          </option>
        </select>
      </div>

      <div>
        <label for="transferOwnerReason" class="mb-1.5 block text-xs font-semibold text-slate-700">
          Lý do chuyển quyền <span class="text-rose-500">*</span>
        </label>
        <textarea
          id="transferOwnerReason"
          v-model="form.reason"
          rows="3"
          maxlength="1000"
          placeholder="Nhập rõ lý do chuyển quyền trưởng nhóm..."
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
        {{ candidates.length ? 'Hủy' : 'Đóng' }}
      </button>
      <button
        v-if="candidates.length"
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { getTransferLeaderCandidates } from '@/modules/administration/utils/projectManagementHelpers';
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
  targetLeaderName: '',
  reason: '',
});
const validationError = ref('');

const candidates = computed(() => getTransferLeaderCandidates(props.project));

const modalSubtitle = computed(() =>
  props.project ? `${props.project.code} • Thao tác khẩn cấp, ghi nhật ký kiểm toán` : ''
);

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened || !props.project) return;
    form.targetLeaderName = candidates.value[0] || '';
    form.reason = '';
    validationError.value = '';
  }
);

function handleSubmit() {
  if (!candidates.value.length) return;
  const cleanReason = form.reason.trim();
  if (!form.targetLeaderName || cleanReason.length < 5) {
    validationError.value = 'Vui lòng chọn trưởng nhóm mới và nhập lý do tối thiểu 5 ký tự.';
    return;
  }
  validationError.value = '';
  emit('submit', {
    targetLeaderName: form.targetLeaderName,
    reason: cleanReason,
  });
}
</script>

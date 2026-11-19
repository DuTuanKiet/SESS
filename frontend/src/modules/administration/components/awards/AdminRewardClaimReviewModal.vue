<template>
  <AdminModal
    :is-open="isOpen && Boolean(claim)"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div v-if="claim" class="space-y-4">
      <div class="space-y-1.5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-xs">
        <p><strong class="text-slate-700">Ngân hàng:</strong> {{ claim.bankName }}</p>
        <p>
          <strong class="text-slate-700">Số tài khoản:</strong>
          <span class="ml-1 font-mono font-semibold text-[#1E56D9]">{{ claim.accountNumber }}</span>
          — {{ claim.accountHolder }}
        </p>
        <p>
          <strong class="text-slate-700">CCCD / MST:</strong>
          {{ claim.idCardNumber }} / {{ claim.taxCode || 'Chưa bổ sung' }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="rewardStatusSelect">
          Trạng thái xử lý
        </label>
        <select
          id="rewardStatusSelect"
          v-model="form.status"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        >
          <option value="PENDING">Chờ xác minh</option>
          <option value="APPROVED">Duyệt chi trả</option>
          <option value="PAID">Đã giải ngân</option>
          <option value="REJECTED">Từ chối / Yêu cầu chỉnh sửa STK</option>
        </select>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700" for="rewardNoteInput">
          Ghi chú đối soát
        </label>
        <textarea
          id="rewardNoteInput"
          v-model="form.note"
          rows="3"
          placeholder="Nhập kết quả kiểm tra chứng từ hoặc lý do yêu cầu bổ sung..."
          class="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
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
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  claim: {
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
  status: 'PENDING',
  note: '',
});

const modalTitle = computed(() =>
  props.claim ? `Thẩm định hồ sơ nhận giải — ${props.claim.projectCode}` : 'Thẩm định hồ sơ nhận giải'
);

const modalSubtitle = computed(() =>
  props.claim
    ? `${props.claim.awardRank} (${props.claim.prizeAmount}) • ${props.claim.submittedBy}`
    : ''
);

watch(
  () => [props.isOpen, props.claim],
  ([opened, claim]) => {
    if (!opened || !claim) return;
    form.status = claim.status || 'PENDING';
    form.note = claim.note || '';
  },
  { immediate: true }
);

function handleSubmit() {
  if (!props.claim) return;
  emit('submit', {
    claimId: props.claim.id,
    status: form.status,
    note: form.note,
  });
}
</script>

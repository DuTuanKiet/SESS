<template>
  <AdminModal
    :is-open="isOpen"
    :title="isEdit ? 'Chỉnh sửa hạng giải thưởng' : 'Thêm cơ cấu giải thưởng'"
    :subtitle="competitionCode"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Hạng giải <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.rank"
          type="text"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">Ví dụ: Giải Khuyến khích</p>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Số lượng <span class="text-rose-500">*</span>
        </label>
        <input
          v-model.number="form.quantity"
          type="number"
          min="1"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        />
      </div>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Giá trị thưởng / suất
      </label>
      <input
        v-model="form.cashAmount"
        type="text"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
      />
      <p class="mt-1 text-[11px] leading-relaxed text-slate-400">Ví dụ: 3.000.000 đ</p>
    </div>

    <div>
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">Quyền lợi kèm theo</label>
      <textarea
        v-model="form.perk"
        rows="3"
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
        {{ isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu hạng giải' : 'Thêm giải thưởng' }}
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
  competitionCode: {
    type: String,
    default: '',
  },
  award: {
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
  rank: '',
  quantity: 1,
  cashAmount: '',
  perk: '',
});

const isEdit = computed(() => Boolean(props.award));

watch(
  () => props.isOpen,
  (opened) => {
    if (!opened) return;
    if (props.award) {
      form.rank = props.award.rank || '';
      form.quantity = Number(props.award.quantity) || 1;
      form.cashAmount = props.award.cashAmount === '—' ? '' : props.award.cashAmount || '';
      form.perk = props.award.perk || '';
    } else {
      form.rank = '';
      form.quantity = 1;
      form.cashAmount = '';
      form.perk = '';
    }
  }
);

function handleSubmit() {
  emit('submit', { ...form });
}
</script>

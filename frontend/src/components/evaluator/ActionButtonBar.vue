<script setup>
import { computed } from 'vue';
import { Save, Send, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  isSubmitted: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['save-draft', 'submit']);

const locked = computed(() => props.isSubmitted);

function handleSaveDraft() {
  if (locked.value || props.isLoading) return;
  emit('save-draft');
}

function handleSubmit() {
  if (locked.value || props.isLoading) return;
  emit('submit');
}
</script>

<template>
  <div class="action-bar w-full">
    <div v-if="locked" class="mb-3 flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p class="text-sm font-semibold text-amber-900">Phiếu đã được nộp chính thức</p>
        <p class="mt-0.5 text-xs text-amber-800/80">Điểm và nhận xét đã bị khóa. Bạn chỉ có thể xem lại nội dung đã nộp.</p>
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button type="button" :disabled="locked || isLoading" @click="handleSaveDraft" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        <Save class="h-4 w-4" /><span>Lưu nháp</span>
      </button>

      <button type="button" :disabled="locked || isLoading" @click="handleSubmit" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_-14px_rgba(79,70,229,0.85)] transition-all duration-200 hover:-translate-y-px hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        <Send class="h-4 w-4" /><span>Nộp chính thức</span>
      </button>

      <div v-if="!locked && totalScore > 0" class="mt-1 text-center text-xs text-slate-500 sm:ml-auto sm:mt-0 sm:text-right">
        Điểm tổng tạm tính: <span class="font-bold text-[#0f172a]">{{ totalScore }} / 10</span>
      </div>
    </div>
  </div>
</template>

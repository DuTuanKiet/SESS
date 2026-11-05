<script setup>
import { AlertTriangle, Send, X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['confirm', 'close']);
</script>

<template>
  <teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] sm:p-7">
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"><AlertTriangle class="h-5 w-5" /></div>
          <div>
            <h3 class="text-base font-bold tracking-tight text-[#0f172a]">Xác nhận nộp phiếu chấm?</h3>
            <p class="mt-1 text-sm leading-relaxed text-slate-600">Sau khi <strong>Nộp chính thức</strong>, điểm tổng và nhận xét sẽ được khóa theo quy trình hệ thống. Vui lòng kiểm tra lại trước khi xác nhận.</p>
          </div>
        </div>
        <div class="flex flex-col-reverse gap-2 border-t border-slate-100/80 pt-4 sm:flex-row sm:justify-end">
          <button type="button" :disabled="isLoading" @click="emit('close')" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"><X class="h-4 w-4" /><span>Hủy, giữ nháp</span></button>
          <button type="button" :disabled="isLoading" @click="emit('confirm')" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_-14px_rgba(79,70,229,0.85)] transition hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"><Send class="h-4 w-4" /><span>Xác nhận nộp</span></button>
        </div>
      </div>
    </div>
  </teleport>
</template>

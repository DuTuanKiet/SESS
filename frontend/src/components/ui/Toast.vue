<script setup>
import { useToastStore } from '@/stores/toast';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-vue-next';

/**
 * Component hiển thị thông báo Toast toàn cục
 * Tuân thủ quy chuẩn frontend-code-standard và bảng màu SESS
 */
const toastStore = useToastStore();

const typeClasses = {
  error: 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-900/5',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-900/5',
  info: 'bg-[#F1F7FF] border-[#C7D7F5] text-[#0B1F4B] shadow-blue-900/5',
  warning: 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-900/5',
};

const iconComponents = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
};

const iconClasses = {
  error: 'text-rose-600',
  success: 'text-emerald-600',
  info: 'text-[#1E56D9]',
  warning: 'text-amber-600',
};
</script>

<template>
  <!-- Container cố định ở góc trên bên phải, hỗ trợ xếp chồng danh sách Toast -->
  <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <TransitionGroup name="toast-slide">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto w-full p-4 rounded-2xl border shadow-md flex items-start gap-3 transition-all duration-300"
        :class="typeClasses[toast.type] || typeClasses.info"
        role="alert"
      >
        <component
          :is="iconComponents[toast.type] || Info"
          class="w-5 h-5 shrink-0 mt-0.5"
          :class="iconClasses[toast.type] || iconClasses.info"
        />

        <div class="flex-1 min-w-0">
          <p class="text-xs sm:text-sm font-semibold leading-snug break-words">
            {{ toast.message }}
          </p>
        </div>

        <button
          type="button"
          @click="toastStore.remove(toast.id)"
          class="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 -mt-1 rounded-lg cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
</style>

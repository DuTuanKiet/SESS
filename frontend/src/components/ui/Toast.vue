<script setup>
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();

const typeClasses = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
};

const typeIcons = {
  error: 'text-red-600',
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
};
</script>

<template>
  <div
    v-for="toast in toastStore.toasts"
    :key="toast.id"
    class="fixed top-4 right-4 z-[100] w-full max-w-sm mb-3 p-3 rounded-xl border shadow-lg transition-all duration-300 transform translate-x-full opacity-0 animate-[slideIn_0.3s_ease-out forwards]"
    :class="typeClasses[toast.type]"
  >
    <div class="flex items-start gap-2">
      <svg
        class="w-5 h-5 shrink-0 mt-0.5"
        :class="typeIcons[toast.type]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          v-if="toast.type === 'error'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
        <path
          v-else-if="toast.type === 'success'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
        <path
          v-else-if="toast.type === 'info'"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <path
          v-else
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-medium">{{ toast.message }}</p>
      </div>
      <button
        type="button"
        @click="toastStore.remove(toast.id)"
        class="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1"
        aria-label="Đóng thông báo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style>
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>

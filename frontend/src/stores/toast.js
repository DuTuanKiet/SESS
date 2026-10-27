import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);

  let id = 0;

  const add = ({ message, type = 'error', duration = 5000 }) => {
    const toastId = ++id;
    const toast = {
      id: toastId,
      message,
      type, // 'error' | 'success' | 'info' | 'warning'
      duration,
    };
    toasts.value.push(toast);
    if (duration > 0) {
      setTimeout(() => {
        remove(toastId);
      }, duration);
    }
    return toastId;
  };

  const remove = (toastId) => {
    toasts.value = toasts.value.filter((t) => t.id !== toastId);
  };

  const clearAll = () => {
    toasts.value = [];
  };

  return {
    toasts,
    add,
    remove,
    clearAll,
  };
});

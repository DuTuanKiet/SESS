<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useGoogleIdentity } from '@/composables/useGoogleIdentity';

defineProps({
  isDisabled: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['credential', 'error']);
const googleButton = ref(null);
const isReady = ref(false);
const initializationError = ref('');
const { isConfigured, renderGoogleButton } = useGoogleIdentity();
let unregisterCredentialHandler;

onBeforeUnmount(() => unregisterCredentialHandler?.());

function handleUnconfiguredClick() {
  emit('error', new Error('Server chưa hoạt động.'));
}

onMounted(async () => {
  if (!isConfigured) return;

  try {
    unregisterCredentialHandler = await renderGoogleButton(googleButton.value, {
      onCredential: (credential) => emit('credential', credential),
      onError: (error) => emit('error', error),
    });
    isReady.value = true;
  } catch (error) {
    initializationError.value = error.message;
    emit('error', error);
  }
});
</script>

<template>
  <div v-if="isConfigured" class="relative min-h-10 w-full">
    <div
      ref="googleButton"
      class="flex min-h-10 justify-center overflow-hidden rounded-lg"
      :class="{ 'pointer-events-none opacity-60': isDisabled || isLoading }"
      :aria-disabled="isDisabled || isLoading"
    ></div>
    <div
      v-if="!isReady && !initializationError"
      class="absolute inset-0 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-xs text-slate-500"
      role="status"
    >
      Đang tải đăng nhập Google...
    </div>
    <p v-if="initializationError" class="mt-2 text-center text-xs text-red-600" role="alert">
      {{ initializationError }}
    </p>
  </div>
  <div v-else class="w-full">
    <button
      type="button"
      :disabled="isDisabled || isLoading"
      @click="handleUnconfiguredClick"
      class="w-full flex items-center justify-center gap-2.5 px-3.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-xs sm:text-sm shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg class="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z" />
        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z" />
        <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z" />
        <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z" />
      </svg>
      <span>Đăng nhập với Google</span>
    </button>
    <p class="mt-2 text-center text-xs text-slate-500" role="status">
      Cần cấu hình Google Client ID để bật đăng nhập.
    </p>
  </div>
</template>

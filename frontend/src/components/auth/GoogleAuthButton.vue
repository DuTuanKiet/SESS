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
  <p v-else class="text-center text-xs text-slate-500" role="status">
    Đăng nhập Google chưa được cấu hình.
  </p>
</template>

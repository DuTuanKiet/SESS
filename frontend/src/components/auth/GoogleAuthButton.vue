<script setup>
import { onMounted, ref } from 'vue';
import { useGoogleIdentity } from '@/composables/useGoogleIdentity';

const props = defineProps({
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

const { isConfigured, initGoogleIdentity, consumeImplicitGoogleRedirect, requestGoogleIdToken } =
  useGoogleIdentity();

const isRequesting = ref(false);

function handleClick() {
  if (props.isDisabled || props.isLoading || isRequesting.value) return;
  if (!isConfigured) {
    emit(
      'error',
      new Error(
        'Đăng nhập Google chưa được cấu hình. Vui lòng đặt VITE_GOOGLE_CLIENT_ID trong frontend/.env.',
      ),
    );
    return;
  }

  isRequesting.value = true;
  requestGoogleIdToken()
    .then((idToken) => {
      emit('credential', idToken);
    })
    .catch((error) => {
      // Người dùng chủ động tắt popup: không báo lỗi đỏ, chỉ reset trạng thái.
      const raw = error?.message || '';
      if (/đóng cửa sổ|huỷ chọn|popup_closed|cancel/i.test(raw)) {
        // im lặng, để LoginForm tự quyết định nếu cần.
        emit('error', error);
      } else {
        emit('error', error);
      }
    })
    .finally(() => {
      isRequesting.value = false;
    });
}

onMounted(() => {
  // Nếu chính trang này được mở như popup redirect từ Google -> gửi id_token về opener.
  consumeImplicitGoogleRedirect();

  // Khởi tạo SDK để hỗ trợ disableAutoSelect (chống ghim tài khoản cũ).
  initGoogleIdentity();
});
</script>

<template>
  <div class="w-full">
    <button
      type="button"
      :disabled="isDisabled || isLoading || isRequesting"
      :aria-busy="isRequesting"
      @click="handleClick"
      class="group relative flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:rounded-xl sm:py-2.5"
    >
      <svg
        v-if="!isRequesting"
        class="h-5 w-5 shrink-0"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z" />
        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z" />
        <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z" />
        <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z" />
      </svg>
      <svg
        v-else
        class="h-5 w-5 shrink-0 animate-spin text-[#1e3a8a]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{{ isRequesting ? "Đang kết nối Google..." : "Tiếp tục với Google" }}</span>
    </button>

    <p class="mt-2 flex items-center justify-center gap-1 text-center text-[11px] leading-relaxed text-slate-500">
      <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6-1.13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
      <span>Hỗ trợ chọn nhanh giữa nhiều tài khoản Google đang đăng nhập</span>
    </p>
  </div>
</template>
<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'verify', 'resend']);

const digits = ref(['', '', '', '', '', '']);
const inputRefs = ref([]);
const countdown = ref(60);
let timerId = null;

function startCooldown() {
  countdown.value = 60;
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(timerId);
    }
  }, 1000);
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      digits.value = ['', '', '', '', '', ''];
      startCooldown();
      nextTick(() => {
        if (inputRefs.value[0]) {
          inputRefs.value[0].focus();
        }
      });
    } else {
      clearInterval(timerId);
    }
  }
);

onBeforeUnmount(() => {
  clearInterval(timerId);
});

function handleInput(index, event) {
  const value = event.target.value;
  // Chỉ lấy ký tự số cuối cùng nếu người dùng nhập
  const num = value.replace(/\D/g, '').slice(-1);
  digits.value[index] = num;

  if (num && index < 5) {
    nextTick(() => {
      inputRefs.value[index + 1]?.focus();
    });
  }
}

function handleKeyDown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus();
  }
}

function handlePaste(event) {
  event.preventDefault();
  const pastedData = event.clipboardData?.getData('text') || '';
  const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, 6);
  for (let i = 0; i < 6; i++) {
    digits.value[i] = cleanNumbers[i] || '';
  }
  const nextEmpty = digits.value.findIndex((d) => !d);
  const targetIndex = nextEmpty === -1 ? 5 : nextEmpty;
  nextTick(() => {
    inputRefs.value[targetIndex]?.focus();
  });
}

function handleConfirm() {
  const fullOtp = digits.value.join('');
  if (fullOtp.length !== 6) return;
  emit('verify', fullOtp);
}

function handleResendClick() {
  if (countdown.value > 0) return;
  startCooldown();
  emit('resend');
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-7 relative">
      <!-- Nút đóng góc phải -->
      <button
        type="button"
        @click="handleClose"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Đóng"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Tiêu đề & Mô tả -->
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-800">
          Xác thực mã OTP Email
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          Mã xác nhận 6 số đã được gửi tới email:
        </p>
        <p class="font-semibold text-xs text-blue-900 mt-0.5 break-all">
          {{ email }}
        </p>
      </div>

      <!-- Thông báo lỗi -->
      <div
        v-if="errorMessage"
        class="mt-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center"
      >
        {{ errorMessage }}
      </div>

      <!-- 6 ô nhập mã OTP -->
      <div class="mt-5 flex justify-center gap-2 sm:gap-3" @paste="handlePaste">
        <input
          v-for="(_, index) in 6"
          :key="index"
          :ref="(el) => (inputRefs[index] = el)"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          :value="digits[index]"
          :disabled="isLoading"
          class="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-xs"
          @input="handleInput(index, $event)"
          @keydown="handleKeyDown(index, $event)"
        />
      </div>

      <!-- Nút gửi lại mã -->
      <div class="mt-4 text-center">
        <button
          type="button"
          :disabled="countdown > 0 || isLoading"
          @click="handleResendClick"
          class="text-xs font-medium focus:outline-hidden transition-colors"
          :class="countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-700 hover:text-blue-900 hover:underline cursor-pointer'"
        >
          <span v-if="countdown > 0">Gửi lại mã sau ({{ countdown }}s)</span>
          <span v-else>Chưa nhận được mã? Gửi lại ngay</span>
        </button>
      </div>

      <!-- Nút hành động -->
      <div class="mt-6 flex gap-2">
        <button
          type="button"
          @click="handleClose"
          :disabled="isLoading"
          class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="digits.join('').length !== 6 || isLoading"
          class="flex-1 py-2 px-3 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs flex items-center justify-center gap-1.5"
        >
          <svg v-if="isLoading" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>{{ isLoading ? 'Đang xác thực...' : 'Xác nhận' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

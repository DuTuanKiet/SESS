<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { loginApi, verifyOtpApi, googleLoginApi } from '@/services/authService';
import GoogleAuthButton from './GoogleAuthButton.vue';
import OtpModal from './OtpModal.vue';
import ForgotPasswordModal from './ForgotPasswordModal.vue';

const props = defineProps({
  portalType: {
    type: String,
    default: 'user', // 'user' | 'admin'
  },
});

const router = useRouter();
const authStore = useAuthStore();

// Form State
const email = ref('');
const password = ref('');
const isRememberMe = ref(false);
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// In-line Field Errors
const fieldErrors = ref({
  email: '',
  password: '',
});

// Modal State
const isOtpModalOpen = ref(false);
const otpEmail = ref('');
const isOtpLoading = ref(false);
const otpErrorMessage = ref('');
const isForgotPasswordOpen = ref(false);

// Khởi tạo Email ghi nhớ nếu có
onMounted(() => {
  const savedEmail = authStore.getRememberedEmail();
  if (savedEmail) {
    email.value = savedEmail;
    isRememberMe.value = true;
  }
});

function handleTogglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value;
}

// Kiểm tra tính hợp lệ của Email 
function validateEmail(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'Vui lòng nhập email.';
  }
  return '';
}

// Xử lý sự kiện nhập liệu để xóa lỗi tức thì
function handleInputEmail() {
  if (fieldErrors.value.email) {
    fieldErrors.value.email = '';
  }
  errorMessage.value = '';
}

function handleBlurEmail() {
  fieldErrors.value.email = validateEmail(email.value);
}

function handleInputPassword() {
  if (fieldErrors.value.password) {
    fieldErrors.value.password = '';
  }
  errorMessage.value = '';
}

function handleBlurPassword() {
  if (!password.value.trim()) {
    fieldErrors.value.password = 'Vui lòng nhập mật khẩu.';
  }
}

// Xử lý sự kiện đăng nhập form
async function handleSubmitLogin() {
  errorMessage.value = '';

  // Kiểm tra để trống
  fieldErrors.value.email = validateEmail(email.value);
  fieldErrors.value.password = !password.value.trim() ? 'Vui lòng nhập mật khẩu.' : '';

  if (fieldErrors.value.email || fieldErrors.value.password) {
    return;
  }

  isLoading.value = true;

  try {
    const res = await loginApi({
      email: email.value,
      password: password.value,
      portalType: props.portalType,
    });

    // Quản lý Ghi nhớ đăng nhập an toàn
    if (isRememberMe.value) {
      authStore.saveRememberedEmail(email.value);
    } else {
      authStore.clearRememberedEmail();
    }

    // Lưu phiên vào RAM chuẩn OWASP
    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: props.portalType,
    });

    // Chuyển hướng vào Trang chủ hệ thống tương ứng
    if (props.portalType === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } catch (error) {
    // Nếu tài khoản cần xác thực OTP email
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      otpEmail.value = email.value.trim();
      otpErrorMessage.value = '';
      isOtpModalOpen.value = true;
    } else {
      errorMessage.value = error.message || 'Email hoặc mật khẩu không chính xác.';
    }
  } finally {
    isLoading.value = false;
  }
}

 // Xác thực mã OTP 6 số
async function handleVerifyOtp(otpCode) {
  isOtpLoading.value = true;
  otpErrorMessage.value = '';

  try {
    const res = await verifyOtpApi({ email: otpEmail.value, otp: otpCode });
    isOtpModalOpen.value = false;

    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: props.portalType,
    });

    router.push('/');
  } catch (error) {
    otpErrorMessage.value = error.message || 'Mã xác thực không hợp lệ.';
  } finally {
    isOtpLoading.value = false;
  }
}

 // Đăng nhập qua Google (Dành cho cổng người dùng)
async function handleGoogleLoginClick() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const res = await googleLoginApi({ idToken: 'mock_google_id_token' });
    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: 'user',
    });
    router.push('/');
  } catch (error) {
    errorMessage.value = 'Đăng nhập Google không thành công. Vui lòng thử lại sau.';
  } finally {
    isLoading.value = false;
  }
}

function handleForgotPasswordClick() {
  errorMessage.value = '';
  isForgotPasswordOpen.value = true;
}
</script>

<template>
  <div class="mt-4">
    <!-- Thông báo lỗi phản hồi từ hệ thống -->
    <div
      v-if="errorMessage"
      role="alert"
      class="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in"
    >
      <svg class="w-4 h-4 shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="font-medium">{{ errorMessage }}</span>
    </div>

    <!-- Biểu mẫu đăng nhập Email và Mật khẩu -->
    <form @submit.prevent="handleSubmitLogin" class="space-y-3" novalidate>
      <!-- Ô nhập Email -->
      <div class="space-y-1">
        <label for="email" class="block text-xs font-semibold text-slate-700">
          {{ portalType === 'admin' ? 'Tài khoản Quản trị viên' : 'Email' }}
          <span class="text-red-500">*</span>
        </label>
        <div class="relative rounded-lg shadow-xs">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="Nhập email của bạn"
            :disabled="isLoading"
            :aria-invalid="Boolean(fieldErrors.email)"
            class="block w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500 border"
            :class="fieldErrors.email ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600'"
            @input="handleInputEmail"
            @blur="handleBlurEmail"
          />
        </div>
        <!-- Thông báo lỗi in-line cho Email -->
        <p v-if="fieldErrors.email" class="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
          <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ fieldErrors.email }}
        </p>
      </div>

      <!-- Ô nhập Mật khẩu -->
      <div class="space-y-1">
        <label for="password" class="block text-xs font-semibold text-slate-700">
          Mật khẩu <span class="text-red-500">*</span>
        </label>
        <div class="relative rounded-lg shadow-xs">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            v-model="password"
            :type="isPasswordVisible ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Nhập mật khẩu của bạn"
            :disabled="isLoading"
            :aria-invalid="Boolean(fieldErrors.password)"
            class="block w-full pl-8 pr-9 py-1.5 text-xs sm:text-sm bg-white rounded-lg text-slate-900 placeholder:text-slate-400 transition-colors disabled:bg-slate-50 disabled:text-slate-500 border"
            :class="fieldErrors.password ? 'border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600'"
            @input="handleInputPassword"
            @blur="handleBlurPassword"
          />
          <button
            type="button"
            @click="handleTogglePasswordVisibility"
            :aria-label="isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'"
            class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
          >
            <svg v-if="isPasswordVisible" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
        <!-- Thông báo lỗi in-line cho Mật khẩu -->
        <p v-if="fieldErrors.password" class="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
          <svg class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ fieldErrors.password }}
        </p>
      </div>

      <!-- Tùy chọn: Nhớ đăng nhập & Quên mật khẩu -->
      <div class="flex items-center justify-between text-xs pt-0.5">
        <label class="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 hover:text-slate-900">
          <input
            v-model="isRememberMe"
            type="checkbox"
            :disabled="isLoading"
            class="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer"
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>
        <button
          type="button"
          @click="handleForgotPasswordClick"
          class="text-blue-700 hover:text-blue-900 font-medium hover:underline focus:outline-hidden cursor-pointer"
        >
          Quên mật khẩu?
        </button>
      </div>

      <!-- Nút Đăng nhập -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full mt-1 flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-xs text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span>{{ isLoading ? 'Đang xác thực...' : 'Đăng nhập' }}</span>
      </button>
    </form>

    <!-- Nút Đăng nhập Google (Chỉ hiển thị cho Cổng Người dùng) -->
    <div v-if="portalType === 'user'">
      <div class="relative my-3 flex items-center justify-center">
        <div class="w-full border-t border-slate-200"></div>
        <span class="absolute bg-white px-2.5 text-[11px] text-slate-500 font-medium">
          hoặc
        </span>
      </div>
      <GoogleAuthButton
        :is-loading="isLoading"
        @click="handleGoogleLoginClick"
      />
    </div>

    <!-- Modals -->
    <OtpModal
      :is-open="isOtpModalOpen"
      :email="otpEmail"
      :is-loading="isOtpLoading"
      :error-message="otpErrorMessage"
      @close="isOtpModalOpen = false"
      @verify="handleVerifyOtp"
      @resend="() => {}"
    />

    <ForgotPasswordModal
      :is-open="isForgotPasswordOpen"
      @close="isForgotPasswordOpen = false"
    />
  </div>
</template>

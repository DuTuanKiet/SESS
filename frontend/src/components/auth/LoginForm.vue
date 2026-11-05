<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toast";
import { loginApi, verifyOtpApi, googleLoginApi } from "@/services/authService";
import GoogleAuthButton from "./GoogleAuthButton.vue";
import OtpModal from "./OtpModal.vue";
import ForgotPasswordModal from "./ForgotPasswordModal.vue";

const props = defineProps({
  portalType: {
    type: String,
    default: "user",
  },
});

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref("");
const password = ref("");
const isRememberMe = ref(false);
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

const fieldErrors = ref({
  email: "",
  password: "",
});

const isOtpModalOpen = ref(false);
const otpEmail = ref("");
const isOtpLoading = ref(false);
const otpErrorMessage = ref("");
const isForgotPasswordOpen = ref(false);

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

function validateEmail(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "Vui lòng nhập email.";
  }
  return "";
}

function handleInputEmail() {
  if (fieldErrors.value.email) {
    fieldErrors.value.email = "";
  }
  errorMessage.value = "";
}

function handleBlurEmail() {
  fieldErrors.value.email = validateEmail(email.value);
}

function handleInputPassword() {
  if (fieldErrors.value.password) {
    fieldErrors.value.password = "";
  }
  errorMessage.value = "";
}

function handleBlurPassword() {
  if (!password.value.trim()) {
    fieldErrors.value.password = "Vui lòng nhập mật khẩu.";
  }
}

async function handleSubmitLogin() {
  errorMessage.value = "";

  fieldErrors.value.email = validateEmail(email.value);
  fieldErrors.value.password = !password.value.trim() ? "Vui lòng nhập mật khẩu." : "";

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

    if (isRememberMe.value) {
      authStore.saveRememberedEmail(email.value);
    } else {
      authStore.clearRememberedEmail();
    }

    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: props.portalType,
    });

    toastStore.add({
      message: res.data.message || "Đăng nhập thành công.",
      type: "success",
      duration: 4000,
    });

    // Ưu tiên redirectPath từ API (backend đã tính toán theo vai trò, ví dụ JUDGE -> /judge/assignments)
    const redirectPath = res.data.redirectPath;
    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    const user = res.data.user || {};
    const roleRaw = user.systemRole || user.role || user.userRole;
    const roleKey = typeof roleRaw === "string" ? roleRaw.toUpperCase() : "";

    if (props.portalType === "admin") {
      router.push("/admin");
      return;
    }

    if (roleKey === "MENTOR" || roleKey === "TEACHER") {
      router.push("/advisor");
      return;
    }
    if (roleKey === "STUDENT") {
      router.push("/student");
      return;
    }
    if (roleKey === "JUDGE") {
      router.push("/judge");
      return;
    }
    if (roleKey === "ADMIN") {
      router.push("/admin");
      return;
    }

    const roleToPath = {
      student: "/student",
      mentor: "/advisor",
      teacher: "/advisor",
      judge: "/judge",
      admin: "/admin",
    };
    router.push(roleToPath[roleRaw] || "/student");
  } catch (error) {
    if (error.code === "EMAIL_NOT_VERIFIED") {
      otpEmail.value = email.value.trim();
      otpErrorMessage.value = "";
      isOtpModalOpen.value = true;
      toastStore.add({
        message: error.message || "Mã xác thực OTP đã được gửi đến email của bạn, vui lòng kiểm tra hộp thư!",
        type: "info",
        duration: 6000,
      });
    } else {
      errorMessage.value = error.message || "Email hoặc mật khẩu không chính xác.";
      toastStore.add({
        message: errorMessage.value,
        type: "error",
        duration: 6000,
      });
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleVerifyOtp(otpCode) {
  isOtpLoading.value = true;
  otpErrorMessage.value = "";

  try {
    const res = await verifyOtpApi({ email: otpEmail.value, otp: otpCode });
    isOtpModalOpen.value = false;

    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: props.portalType,
    });

    toastStore.add({
      message: res.data.message || "Xác thực OTP thành công.",
      type: "success",
      duration: 4000,
    });

    // Ưu tiên redirectPath từ API (backend đã tính toán theo vai trò, ví dụ JUDGE -> /judge/assignments)
    const redirectPath = res.data.redirectPath;
    if (redirectPath) {
      router.push(redirectPath);
      return;
    }

    const user = res.data.user || {};
    const roleRaw = user.systemRole || user.role || user.userRole;
    const roleKey = typeof roleRaw === "string" ? roleRaw.toUpperCase() : "";
    if (roleKey === "MENTOR" || roleKey === "TEACHER") {
      router.push("/advisor");
      return;
    }
    if (roleKey === "STUDENT") {
      router.push("/student");
      return;
    }
    if (roleKey === "JUDGE") {
      router.push("/judge");
      return;
    }
    if (roleKey === "ADMIN") {
      router.push("/admin");
      return;
    }
    router.push("/");
  } catch (error) {
    otpErrorMessage.value = error.message || "Mã xác thực không hợp lệ.";
    toastStore.add({
      message: otpErrorMessage.value,
      type: "error",
      duration: 6000,
    });
  } finally {
    isOtpLoading.value = false;
  }
}

async function handleResendOtp() {
  isOtpLoading.value = true;
  otpErrorMessage.value = "";

  try {
    await loginApi({
      email: otpEmail.value,
      password: password.value,
      portalType: props.portalType,
    });
  } catch (error) {
    if (error.code !== "EMAIL_NOT_VERIFIED") {
      otpErrorMessage.value = error.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
      toastStore.add({
        message: otpErrorMessage.value,
        type: "error",
        duration: 6000,
      });
    }
  } finally {
    isOtpLoading.value = false;
  }
}

async function handleGoogleLoginClick() {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    const res = await googleLoginApi({ idToken: "mock_google_id_token" });
    authStore.setSession({
      user: res.data.user,
      tokens: res.data.tokens,
      portal: "user",
    });

    toastStore.add({
      message: res.data.message || "Đăng nhập Google thành công.",
      type: "success",
      duration: 4000,
    });
    router.push("/");
  } catch (error) {
    errorMessage.value = "Đăng nhập Google không thành công. Vui lòng thử lại sau.";
    toastStore.add({
      message: errorMessage.value,
      type: "error",
      duration: 6000,
    });
  } finally {
    isLoading.value = false;
  }
}

function handleForgotPasswordClick() {
  errorMessage.value = "";
  isForgotPasswordOpen.value = true;
}
</script>

<template>
  <div class="mt-4">
    <div v-if="errorMessage" role="alert" class="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
      <svg class="w-4 h-4 shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="font-medium">{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleSubmitLogin" class="space-y-3" novalidate>
      <div class="space-y-1">
        <label for="email" class="block text-xs font-semibold text-slate-700">
          {{ portalType === "admin" ? "Tài khoản Quản trị viên" : "Email" }}
          <span class="text-red-500">*</span>
        </label>
        <div class="relative rounded-lg shadow-xs">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input id="email" v-model="email" type="email" autocomplete="username" placeholder="Nhập email của bạn" :disabled="isLoading" class="block w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-lg text-slate-900 placeholder:text-slate-400 border" :class="fieldErrors.email ? 'border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]'" @input="handleInputEmail" @blur="handleBlurEmail" />
        </div>
        <p v-if="fieldErrors.email" class="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">{{ fieldErrors.email }}</p>
      </div>

      <div class="space-y-1">
        <label for="password" class="block text-xs font-semibold text-slate-700">Mật khẩu <span class="text-red-500">*</span></label>
        <div class="relative rounded-lg shadow-xs">
          <div class="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input id="password" v-model="password" :type="isPasswordVisible ? 'text' : 'password'" autocomplete="current-password" placeholder="Nhập mật khẩu" :disabled="isLoading" class="block w-full pl-8 pr-9 py-1.5 text-xs sm:text-sm bg-white rounded-lg text-slate-900 placeholder:text-slate-400 border" :class="fieldErrors.password ? 'border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]'" @input="handleInputPassword" @blur="handleBlurPassword" />
          <button type="button" class="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors" @click="handleTogglePasswordVisibility">
            <svg v-if="!isPasswordVisible" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          </button>
        </div>
        <p v-if="fieldErrors.password" class="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">{{ fieldErrors.password }}</p>
      </div>

      <div class="flex items-center justify-between pt-0.5">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input v-model="isRememberMe" type="checkbox" class="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]/30" />
          <span class="text-xs text-slate-700">Ghi nhớ tài khoản</span>
        </label>
        <button type="button" class="text-xs font-medium text-[#1e3a8a] hover:text-[#172554] hover:underline" @click="handleForgotPasswordClick">Quên mật khẩu?</button>
      </div>

      <button type="submit" :disabled="isLoading" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#172554] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a8a]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-semibold">
        <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span>{{ isLoading ? "Đang xử lý..." : "Đăng nhập" }}</span>
      </button>
    </form>

    <div v-if="props.portalType !== 'admin'" class="mt-4">
      <div class="relative">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
        <div class="relative flex justify-center text-xs"><span class="px-2 bg-white text-slate-500">hoặc</span></div>
      </div>
      <div class="mt-3">
        <GoogleAuthButton @click="handleGoogleLoginClick" :disabled="isLoading" />
      </div>
    </div>

    <OtpModal :is-open="isOtpModalOpen" :email="otpEmail" :is-loading="isOtpLoading" :error-message="otpErrorMessage" @close="isOtpModalOpen = false" @verify="handleVerifyOtp" @resend="handleResendOtp" />
    <ForgotPasswordModal :is-open="isForgotPasswordOpen" @close="isForgotPasswordOpen = false" />
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { useToastStore } from '@/stores/toast';
import { requestPasswordResetApi, resetPasswordApi } from '@/services/userService';
import { X, Mail, Lock, AlertCircle, CheckCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-vue-next';

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'switch-to-login']);

const toastStore = useToastStore();

const step = ref('request'); // 'request' | 'check-email' | 'reset'
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const requestForm = reactive({
  email: '',
});

const resetForm = reactive({
  token: '',
  newPassword: '',
  confirmPassword: '',
});

const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

function resetForms() {
  requestForm.email = '';
  resetForm.token = '';
  resetForm.newPassword = '';
  resetForm.confirmPassword = '';
  errorMessage.value = '';
  successMessage.value = '';
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  isLoading.value = false;
  step.value = 'request';
}

function handleClose() {
  if (isLoading.value) return;
  emit('close');
}

async function handleRequestReset() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!requestForm.email.trim()) {
    errorMessage.value = 'Vui lòng nhập email.';
    return;
  }

  isLoading.value = true;
  try {
    await requestPasswordResetApi({ email: requestForm.email.trim() });
    step.value = 'check-email';
    successMessage.value = 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.';
  } catch (err) {
    errorMessage.value = err.message || 'Không thể gửi yêu cầu, vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
}

async function handleResetPassword() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!resetForm.token.trim()) {
    errorMessage.value = 'Thiếu token đặt lại mật khẩu.';
    return;
  }
  if (!resetForm.newPassword.trim()) {
    errorMessage.value = 'Vui lòng nhập mật khẩu mới.';
    return;
  }
  if (resetForm.newPassword.length < 8) {
    errorMessage.value = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    return;
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(resetForm.newPassword)) {
    errorMessage.value = 'Mật khẩu cần có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.';
    return;
  }
  if (resetForm.newPassword !== resetForm.confirmPassword) {
    errorMessage.value = 'Xác nhận mật khẩu không trùng khớp.';
    return;
  }

  isLoading.value = true;
  try {
    await resetPasswordApi({ token: resetForm.token.trim(), newPassword: resetForm.newPassword });
    step.value = 'request';
    resetForms();
    toastStore.add({
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
      type: 'success',
      duration: 4000,
    });
    emit('switch-to-login');
  } catch (err) {
    errorMessage.value = err.message || 'Không thể đặt lại mật khẩu, token có thể đã hết hạn.';
  } finally {
    isLoading.value = false;
  }
}

function handleTokenInput(event) {
  // Tự động điền token từ URL query parameter ?token=...
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    resetForm.token = token;
    // Xóa token khỏi URL để tránh lộ token khi chia sẻ
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
    @click.self="handleClose"
  >
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-7 relative">
      <!-- Nút đóng -->
      <button
        type="button"
        @click="handleClose"
        class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Đóng"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Bước 1: Nhập email yêu cầu đặt lại mật khẩu -->
      <div v-if="step === 'request'" class="space-y-5">
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Mail class="w-6 h-6" />
          </div>
          <h3 class="text-base sm:text-lg font-bold text-slate-800">
            QUÊN MẬT KHẨU
          </h3>
          <p class="mt-1 text-xs text-slate-500">
            Nhập email để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 leading-relaxed">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="requestForm.email"
            type="email"
            placeholder="nhap.email@student.ctuet.edu.vn"
            class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            :disabled="isLoading"
            autocomplete="email"
            @keypress.enter="handleRequestReset"
          />
        </div>

        <button
          type="button"
          @click="handleRequestReset"
          class="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin mx-auto" />
          <span v-else class="flex items-center justify-center gap-1.5">
            <Mail class="w-4 h-4" />
            Gửi liên kết đặt lại mật khẩu
          </span>
        </button>

        <p class="text-center text-[10px] text-slate-400">
          Không nhớ email? Liên hệ Giảng viên cố vấn học tập hoặc
          <a href="mailto:support@ctuet.edu.vn" class="text-blue-700 font-semibold hover:underline"> support@ctuet.edu.vn </a>
        </p>
      </div>

      <!-- Bước 2: Kiểm tra email -->
      <div v-else-if="step === 'check-email'" class="space-y-5 text-center">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
          <CheckCircle class="w-8 h-8" />
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-800">
          ĐÃ GỬI LIÊN KẾT
        </h3>
        <p class="text-xs text-slate-500" v-html="successMessage"></p>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
          <p><strong class="text-slate-800">Kiểm tra hộp thư đến (và thư rác/spam)</strong> của email vừa nhập.</p>
          <p>Liên kết đặt lại mật khẩu có hiệu lực trong <strong>15 phút</strong>.</p>
          <p>Nếu không nhận được email sau vài phút, vui lòng thử lại.</p>
        </div>

        <button
          type="button"
          @click="step = 'request'; resetForms()"
          class="w-full py-2 px-4 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs"
        >
          Gửi lại email
        </button>
      </div>

      <!-- Bước 3: Đặt lại mật khẩu (khi có token từ URL) -->
      <div v-else-if="step === 'reset'" class="space-y-5" @mounted="handleTokenInput">
        <div class="flex items-center gap-2 mb-2">
          <button
            type="button"
            @click="step = 'request'; resetForms()"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Lock class="w-5 h-5" />
          </div>
        </div>
        <h3 class="text-center text-base sm:text-lg font-bold text-slate-800">
          ĐẶT LẠI MẬT KHẨU MỚI
        </h3>

        <div v-if="errorMessage" class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 leading-relaxed">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <input
          v-model="resetForm.token"
          type="hidden"
        />

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Mật khẩu mới <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="resetForm.newPassword"
              placeholder="Tối thiểu 8 ký tự, đủ độ phức tạp"
              class="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              :disabled="isLoading"
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              tabindex="-1"
            >
              <component :is="showNewPassword ? EyeOff : Eye" class="w-4 h-4" />
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">
            Cần có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">
            Xác nhận mật khẩu mới <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="resetForm.confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              class="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              :disabled="isLoading"
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              tabindex="-1"
            >
              <component :is="showConfirmPassword ? EyeOff : Eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          @click="handleResetPassword"
          class="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin mx-auto" />
          <span v-else class="flex items-center justify-center gap-1.5">
            <Lock class="w-4 h-4" />
            Đặt lại mật khẩu
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

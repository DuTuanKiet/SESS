<template>
  <!-- Backdrop Modal -->
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      @click.self="handleClose"
      aria-modal="true"
      role="dialog"
    >
      <!-- Hộp Thoại Modal -->
      <div
        class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-slate-50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E56D9] flex items-center justify-center shrink-0 border border-blue-100/80 shadow-2xs">
              <KeyRound class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-[#0B1F4B] leading-tight">
                Đổi mật khẩu sinh viên
              </h3>
              <p class="text-[11px] text-slate-400 font-medium mt-0.5">
                Bảo vệ tài khoản học vụ SESS CTUT
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="handleClose"
            class="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Nội Dung -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- Thông báo lỗi (nếu có) -->
          <div
            v-if="errorMessage"
            class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 leading-relaxed"
          >
            <div class="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Mật khẩu hiện tại -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu hiện tại <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                :type="showCurrentPassword ? 'text' : 'password'"
                v-model="form.currentPassword"
                placeholder="Nhập mật khẩu đang sử dụng"
                class="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20 focus:border-[#1E56D9] transition-all"
                :disabled="isLoading"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                tabindex="-1"
              >
                <component :is="showCurrentPassword ? EyeOff : Eye" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Mật khẩu mới -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu mới <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="form.newPassword"
                placeholder="Tối thiểu 6 ký tự"
                class="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20 focus:border-[#1E56D9] transition-all"
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
              Khuyến khích dùng chữ hoa, chữ thường và chữ số để an toàn hơn.
            </p>
          </div>

          <!-- Xác nhận mật khẩu mới -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">
              Xác nhận mật khẩu mới <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                class="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20 focus:border-[#1E56D9] transition-all"
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

          <!-- Nút Hành Động -->
          <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              :disabled="isLoading"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E56D9] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isLoading"
            >
              <span
                v-if="isLoading"
                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></span>
              <Lock v-else class="w-3.5 h-3.5" />
              <span>{{ isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { X, KeyRound, Eye, EyeOff, Lock } from 'lucide-vue-next';
import { changePasswordApi } from '@/services/userService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:isOpen', 'success']);

const toastStore = useToastStore();

const isLoading = ref(false);
const errorMessage = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

function resetForm() {
  form.currentPassword = '';
  form.newPassword = '';
  form.confirmPassword = '';
  errorMessage.value = '';
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  isLoading.value = false;
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      resetForm();
    }
  }
);

function handleClose() {
  if (isLoading.value) return;
  emit('update:isOpen', false);
}

async function handleSubmit() {
  errorMessage.value = '';

  // 1. Kiểm tra trường trống
  if (!form.currentPassword.trim()) {
    errorMessage.value = 'Vui lòng nhập mật khẩu hiện tại.';
    return;
  }
  if (!form.newPassword.trim()) {
    errorMessage.value = 'Vui lòng nhập mật khẩu mới.';
    return;
  }
  if (form.newPassword.length < 6) {
    errorMessage.value = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    return;
  }
  if (form.currentPassword === form.newPassword) {
    errorMessage.value = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = 'Xác nhận mật khẩu mới không trùng khớp.';
    return;
  }

  // 2. Gửi request đổi mật khẩu
  isLoading.value = true;
  try {
    const res = await changePasswordApi({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });

    toastStore.add({
      message: res?.message || 'Đổi mật khẩu thành công!',
      type: 'success',
      duration: 4000,
    });

    emit('success');
    emit('update:isOpen', false);
  } catch (err) {
    errorMessage.value = err.message || 'Đổi mật khẩu thất bại, vui lòng kiểm tra lại.';
  } finally {
    isLoading.value = false;
  }
}
</script>


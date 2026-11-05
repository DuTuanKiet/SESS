<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toast';
import { User, Mail, Shield, Lock, Save } from 'lucide-vue-next';

const authStore = useAuthStore();
const toastStore = useToastStore();

const user = computed(() => authStore.user);

const showPassword = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const isSaving = ref(false);

function handleChangePassword() {
  if (!newPassword.value) {
    toastStore.add({ message: 'Vui lòng nhập mật khẩu mới.', type: 'error', duration: 4000 });
    return;
  }
  if (newPassword.value.length < 8) {
    toastStore.add({ message: 'Mật khẩu phải có ít nhất 8 ký tự.', type: 'error', duration: 4000 });
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toastStore.add({ message: 'Mật khẩu nhập lại không khớp.', type: 'error', duration: 4000 });
    return;
  }

  isSaving.value = true;
  toastStore.add({
    message: 'Đã cập nhật mật khẩu thành công.',
    type: 'success',
    duration: 4000,
  });
  newPassword.value = '';
  confirmPassword.value = '';
  showPassword.value = false;
  isSaving.value = false;
}

const roleLabel = computed(() => {
  const role = user.value?.role || user.value?.systemRole || '';
  const map = {
    judge: 'Ban Giám Khảo',
    admin: 'Quản trị viên',
    student: 'Sinh viên',
    mentor: 'Giảng viên / Cố vấn',
    teacher: 'Giảng viên',
  };
  return map[role] || role;
});
</script>

<template>
  <div class="judge-profile">
    <div class="mb-6">
      <p class="mb-2 inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600">Cổng thông tin Ban Giám Khảo</p>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Hồ sơ & Bảo mật</h1>
      <p class="mt-1 text-sm leading-relaxed text-slate-500">Thông tin cá nhân được đồng bộ từ hệ thống SESS; quản lý bảo mật tài khoản tại đây.</p>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
      <section class="xl:col-span-8">
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div class="border-b border-slate-200 bg-white">
            <div class="h-1.5 bg-[#1e3a8a]"></div>
            <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div class="flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 ring-4 ring-slate-100">
                <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
                <User class="h-8 w-8 text-slate-500" v-else />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-xl font-bold text-slate-900">{{ user?.fullName || user?.name || 'Giám khảo' }}</h2>
                <p class="mt-1 truncate text-sm text-slate-600">{{ user?.email || 'Chưa có email' }}</p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"><Shield class="h-3.5 w-3.5" />{{ roleLabel }}</span>
                  <span class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><span class="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>Đang hoạt động</span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-5 sm:p-6">
            <div class="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span class="h-4 w-1 rounded-full bg-[#1e3a8a]"></span>
              <h3 class="text-sm font-semibold text-slate-900">Thông tin hồ sơ</h3>
            </div>

            <div class="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              <div class="flex items-start gap-4 px-4 py-4 sm:px-5">
                <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70"><User class="h-4 w-4" /></div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Họ và tên</p>
                  <p class="mt-1 text-sm font-semibold text-slate-700">{{ user?.fullName || user?.name || '—' }}</p>
                </div>
              </div>
              <div class="flex items-start gap-4 px-4 py-4 sm:px-5">
                <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70"><Mail class="h-4 w-4" /></div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Email</p>
                  <p class="mt-1 break-all text-sm font-semibold text-slate-700">{{ user?.email || '—' }}</p>
                </div>
              </div>
              <div class="flex items-start gap-4 px-4 py-4 sm:px-5">
                <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70"><Shield class="h-4 w-4" /></div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Vai trò</p>
                  <p class="mt-1 text-sm font-semibold text-slate-700">{{ roleLabel }}</p>
                </div>
              </div>
            </div>

            <div class="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
              <Mail class="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <p class="text-sm leading-relaxed text-slate-600">Họ tên, email và vai trò được đồng bộ từ tài khoản đăng nhập/JWT của hệ thống SESS. Nếu thông tin chưa chính xác, vui lòng liên hệ quản trị viên.</p>
            </div>
          </div>
        </div>
      </section>

      <aside class="xl:col-span-4">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6 xl:sticky xl:top-[96px]">
          <div class="mb-5 border-b border-slate-100 pb-4">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#1e3a8a]"><Lock class="h-[18px] w-[18px]" /></div>
              <div>
                <h3 class="text-sm font-semibold text-slate-900">Đổi mật khẩu</h3>
                <p class="mt-0.5 text-xs leading-relaxed text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản chấm điểm.</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-xs font-semibold text-slate-700">Mật khẩu mới</label>
              <div class="relative">
                <input v-model="newPassword" :type="showPassword ? 'text' : 'password'" placeholder="Tối thiểu 8 ký tự" class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" />
                <button type="button" @click="showPassword = !showPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">{{ showPassword ? 'Ẩn' : 'Hiện' }}</button>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-xs font-semibold text-slate-700">Nhập lại mật khẩu</label>
              <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="Nhập lại mật khẩu mới" class="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button type="button" @click="handleChangePassword" :disabled="isSaving" class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60">
              <Save class="h-4 w-4" /><span :class="{ 'animate-pulse': isSaving }">Cập nhật mật khẩu</span>
            </button>
          </div>

          <div class="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p class="text-xs leading-relaxed text-slate-600">Giao diện đã sẵn sàng để tích hợp endpoint đổi mật khẩu của backend khi được cung cấp.</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

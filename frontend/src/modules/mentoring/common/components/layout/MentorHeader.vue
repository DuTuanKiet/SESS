<template>
  <header class="sticky top-0 z-30 h-[72px] border-b border-slate-200/60 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
    <div class="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <p class="truncate text-sm text-slate-500">Không gian làm việc <span class="mx-1 text-slate-300">/</span> <span class="font-medium text-slate-700">Giảng viên cố vấn</span></p>
        <span class="hidden shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70 md:inline-flex">Đợt thi SESS 2026</span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <RouterLink to="/advisor/notifications" class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" title="Thông báo">
          <Bell class="h-4 w-4" />
        </RouterLink>
        <div class="hidden h-8 w-px bg-slate-200/80 sm:block"></div>
        <div class="relative">
          <button type="button" @click.stop="profileOpen = !profileOpen" class="group inline-flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-2.5 py-1.5 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" :aria-expanded="profileOpen ? 'true' : 'false'" aria-haspopup="menu" title="Tài khoản">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200/70"><User class="h-4 w-4 text-[#1e3a8a]" /></div>
            <div class="hidden min-w-0 lg:block">
              <p class="max-w-[180px] truncate text-[13px] font-semibold tracking-tight text-slate-900">{{ displayName }}</p>
              <p class="truncate text-[10px] font-medium text-slate-500">{{ displayEmail }}</p>
            </div>
            <span class="hidden shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-700 2xl:inline-flex">Giảng viên cố vấn</span>
            <ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition" :class="profileOpen ? 'rotate-180' : ''" />
          </button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.18)]" role="menu" @click.stop>
            <div class="border-b border-slate-100 px-3 py-2.5">
              <p class="truncate text-[13px] font-semibold text-slate-900">{{ displayName }}</p>
              <p class="truncate text-[11px] text-slate-500">{{ displayEmail }}</p>
            </div>
            <RouterLink to="/advisor/profile" class="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#1e3a8a]" @click="profileOpen = false"><User class="h-4 w-4" />Hồ sơ cá nhân</RouterLink>
            <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700" title="Đăng xuất khỏi hệ thống" @click="profileOpen = false; handleLogout()"><LogOut class="h-4 w-4 text-red-500/80" />Đăng xuất</button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { Bell, LogOut, User, ChevronDown } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const profileOpen = ref(false);
const displayName = computed(() => authStore.user?.fullName || authStore.user?.name || (authStore.user?.email ? authStore.user.email.split('@')[0] : 'Giảng viên'));
const displayEmail = computed(() => authStore.user?.email || 'Chưa có email');
function handleLogout() {
  try { authStore.logout(); } catch (e) {}
  try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); sessionStorage.clear(); } catch (e) {}
  router.replace('/');
}
function closeProfile() { profileOpen.value = false; }
onMounted(() => document.addEventListener('click', closeProfile));
onBeforeUnmount(() => document.removeEventListener('click', closeProfile));
</script>
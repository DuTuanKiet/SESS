<template>
  <div class="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased">
    <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div class="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <router-link to="/" class="flex shrink-0 items-center gap-3">
          <img src="@/assets/logo-CTUT.png" alt="CTUT" class="h-10 w-10 shrink-0 object-contain" />
          <div class="leading-none"><div class="text-[15px] font-black tracking-[0.08em] text-slate-900">SESS</div><div class="mt-1 text-[10px] font-semibold tracking-wide text-slate-500">Không gian Sinh viên</div></div>
        </router-link>

        <nav class="hidden min-w-0 flex-1 items-center justify-center xl:flex">
          <div class="inline-flex max-w-full items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-1.5">
            <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200" :class="isActive(item.to) ? 'bg-white text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'">
              <component :is="item.icon" class="h-4 w-4 shrink-0" :class="isActive(item.to) ? 'text-indigo-600' : ''" /><span class="whitespace-nowrap">{{ item.label }}</span>
            </router-link>
          </div>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <div class="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-1.5 2xl:flex">
            <div class="min-w-0 text-right"><p class="max-w-[170px] truncate text-[13px] font-semibold tracking-tight text-slate-900">{{ displayName }}</p><p class="max-w-[210px] truncate text-[10px] font-medium text-slate-500">{{ displayEmail }}</p></div>
            <span class="inline-flex shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Sinh viên</span>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/70"><img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="h-full w-full object-cover" /><User class="h-4 w-4 text-slate-600" v-else /></div>
          <button type="button" @click="handleLogout" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1e3a8a] px-3.5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#172554] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30"><LogOut class="h-3.5 w-3.5" /><span class="hidden sm:inline">Đăng xuất</span></button>
        </div>
      </div>
      <div class="border-t border-slate-200/60 bg-white/90 xl:hidden">
        <div class="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 py-2.5 no-scrollbar sm:px-5 lg:px-7">
          <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold transition-all" :class="isActive(item.to) ? 'bg-[#0f172a] text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.65)]' : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'"><component :is="item.icon" class="h-3.5 w-3.5 shrink-0" /><span>{{ item.label }}</span></router-link>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><router-view /></main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, Trophy, FolderKanban, Users, GraduationCap, LineChart, Bell, UserCircle, LogOut, User } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navItems = [
  { to: '/student', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/student/competitions', label: 'Cuộc thi', icon: Trophy },
  { to: '/student/projects', label: 'Dự án', icon: FolderKanban },
  { to: '/student/teams', label: 'Nhóm', icon: Users },
  { to: '/student/mentoring', label: 'Cố vấn', icon: GraduationCap },
  { to: '/student/progress', label: 'Tiến độ', icon: LineChart },
  { to: '/student/notifications', label: 'Thông báo', icon: Bell },
  { to: '/student/account', label: 'Tài khoản', icon: UserCircle },
];

const displayName = computed(() => authStore.user?.fullName || authStore.user?.name || authStore.user?.username || 'Sinh viên');
const displayEmail = computed(() => authStore.user?.email || 'Chưa có email');
const avatarUrl = computed(() => authStore.user?.avatarUrl || null);
function isActive(path) { return route.path === path || route.path.startsWith(`${path}/`); }
function handleLogout() { authStore.logout(); router.replace('/'); }
</script>

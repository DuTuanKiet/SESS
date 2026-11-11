<template>
  <div class="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased">
    <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div class="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <router-link to="/admin" class="flex shrink-0 items-center gap-3">
          <img src="@/assets/logo-CTUT.png" alt="CTUT" class="h-10 w-10 shrink-0 object-contain" />
          <div class="leading-none"><div class="text-[15px] font-black tracking-[0.08em] text-slate-900">SESS</div><div class="mt-1 text-[10px] font-semibold tracking-wide text-slate-500">Cổng Quản trị</div></div>
        </router-link>

        <nav class="hidden min-w-0 flex-1 items-center justify-center 2xl:flex">
          <div class="inline-flex max-w-full items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-1.5">
            <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition-all duration-200" :class="isActive(item.to) ? 'bg-white text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'">
              <component :is="item.icon" class="h-4 w-4 shrink-0" :class="isActive(item.to) ? 'text-indigo-600' : ''" /><span class="whitespace-nowrap">{{ item.label }}</span>
            </router-link>
          </div>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <div class="relative">
            <button type="button" @click.stop="profileOpen = !profileOpen" class="inline-flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" :aria-expanded="profileOpen ? 'true' : 'false'" aria-haspopup="menu" title="Tài khoản quản trị">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200/70"><ShieldCheck class="h-4 w-4 text-[#1e3a8a]" /></div>
              <div class="hidden min-w-0 2xl:block">
                <p class="max-w-[160px] truncate text-[13px] font-semibold tracking-tight text-slate-900">{{ displayName }}</p>
                <p class="max-w-[190px] truncate text-[10px] font-medium text-slate-500">{{ displayEmail }}</p>
              </div>
              <span class="hidden shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 2xl:inline-flex">Quản trị viên</span>
              <ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition" :class="profileOpen ? 'rotate-180' : ''" />
            </button>
            <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.18)]" role="menu" @click.stop>
              <div class="border-b border-slate-100 px-3 py-2.5">
                <p class="truncate text-[13px] font-semibold text-slate-900">{{ displayName }}</p>
                <p class="truncate text-[11px] text-slate-500">{{ displayEmail }}</p>
              </div>
              <router-link to="/admin/settings" class="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#1e3a8a]" @click="profileOpen = false"><Settings class="h-4 w-4" />Cấu hình</router-link>
              <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700" title="Đăng xuất khỏi hệ thống" @click="profileOpen = false; handleLogout()"><LogOut class="h-4 w-4 text-red-500/80" />Đăng xuất</button>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t border-slate-200/60 bg-white/90 2xl:hidden">
        <div class="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 py-2.5 no-scrollbar sm:px-5 lg:px-7">
          <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold transition-all" :class="isActive(item.to) ? 'bg-[#0f172a] text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.65)]' : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'"><component :is="item.icon" class="h-3.5 w-3.5 shrink-0" /><span>{{ item.label }}</span></router-link>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><router-view /></main>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, Users, Trophy, FolderKanban, GraduationCap, Scale, ClipboardList, Newspaper, BarChart3, Settings, LogOut, ShieldCheck, ChevronDown } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const profileOpen = ref(false);

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/competitions', label: 'Cuộc thi', icon: Trophy },
  { to: '/admin/projects', label: 'Dự án & nhóm', icon: FolderKanban },
  { to: '/admin/mentor-assignments', label: 'Phân công CV', icon: GraduationCap },
  { to: '/admin/judge-assignments', label: 'Phân công GK', icon: Scale },
  { to: '/admin/rubrics', label: 'Rubric', icon: ClipboardList },
  { to: '/admin/news', label: 'Tin tức', icon: Newspaper },
  { to: '/admin/reports', label: 'Báo cáo', icon: BarChart3 },
  { to: '/admin/settings', label: 'Cấu hình', icon: Settings },
];

const displayName = computed(() => authStore.user?.fullName || authStore.user?.name || authStore.user?.username || 'Quản trị viên');
const displayEmail = computed(() => authStore.user?.email || 'Chưa có email');
function isActive(path) { if (path === '/admin') return route.path === '/admin'; return route.path === path || route.path.startsWith(`${path}/`); }
function handleLogout() { authStore.logout(); router.replace('/'); }
function closeProfile() { profileOpen.value = false; }
onMounted(() => document.addEventListener('click', closeProfile));
onBeforeUnmount(() => document.removeEventListener('click', closeProfile));
</script>

<template>
  <div class="judge-layout min-h-screen bg-[#f8fafc] font-[Inter,system-ui,sans-serif]">
    <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <div class="mx-auto flex h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div class="flex shrink-0 cursor-pointer items-center gap-3" @click="$router.push('/')">
          <img src="@/assets/logoCtut.png" alt="CTUT Logo" class="h-10 w-10 shrink-0 object-contain" />
          <div class="hidden flex-col justify-center leading-none sm:flex">
            <span class="text-[15px] font-black tracking-[0.08em] text-slate-900">SESS</span>
            <span class="mt-1 whitespace-nowrap text-[10px] font-semibold tracking-wide text-slate-500">Cổng Ban Giám Khảo</span>
          </div>
        </div>

        <nav class="hidden min-w-0 flex-1 items-center justify-center xl:flex">
          <div class="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-2xl border border-slate-200/60 bg-slate-100/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <button v-for="tab in tabs" :key="tab.path" type="button" :class="['inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200', activeTab === tab.path ? 'bg-white text-[#0f172a] shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800']" @click="activeTab = tab.path">
              <component :is="tab.icon" class="h-4 w-4 shrink-0" :class="activeTab === tab.path ? 'text-indigo-600' : ''" />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
            </button>
          </div>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <button type="button" class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" title="Thông báo" @click="activeTab = '/judge/notifications'">
            <Bell class="h-4 w-4" />
            <span v-if="unreadCount > 0" class="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#1e3a8a] px-1 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>

          <button type="button" @click="handleLogout" class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20" title="Đăng xuất">
            <LogOut class="h-4 w-4" />
          </button>

          <div class="hidden h-8 w-px bg-slate-200/80 md:block"></div>

          <button type="button" class="group inline-flex min-w-0 max-w-[320px] items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-1.5 pr-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-px hover:border-indigo-200/70 hover:shadow-md" @click="activeTab = '/judge/account'">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 ring-1 ring-slate-200/70">
              <img v-if="judgeAvatar" :src="judgeAvatar" alt="Avatar" class="h-full w-full object-cover" />
              <User class="h-4 w-4 text-indigo-600" v-else />
            </div>
            <div class="hidden min-w-0 md:block">
              <p class="truncate text-[13px] font-semibold tracking-tight text-slate-900">{{ judgeName }}</p>
              <div class="flex min-w-0 items-center gap-1.5">
                <p class="truncate text-[10px] font-medium text-slate-500">{{ judgeEmail }}</p>
                <span class="hidden shrink-0 whitespace-nowrap rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70 2xl:inline-flex">{{ judgeRoleLabel }}</span>
              </div>
            </div>
            <ChevronDown class="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-600 lg:block" />
          </button>
        </div>
      </div>

      <div class="border-t border-slate-200/60 bg-white/90 xl:hidden">
        <div class="mx-auto max-w-[1440px] px-4 pt-2 sm:px-6 lg:px-8">
          <p class="truncate text-[12px] font-semibold text-slate-900">{{ judgeName }}</p>
          <p class="truncate text-[10px] text-slate-500">{{ judgeEmail }} • {{ judgeRoleLabel }}</p>
        </div>
        <div class="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 py-2.5 no-scrollbar sm:px-5 lg:px-7">
          <button v-for="tab in tabs" :key="tab.path" type="button" :class="['inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold transition-all', activeTab === tab.path ? 'bg-[#0f172a] text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.65)]' : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800']" @click="activeTab = tab.path">
            <component :is="tab.icon" class="h-3.5 w-3.5 shrink-0" />
            <span class="whitespace-nowrap">{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { evaluatorService } from '@/services/evaluatorService';
import {
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  FileCheck,
  ClipboardList,
  History,
  User as UserIcon,
  ChevronDown,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const unreadCount = ref(0);

const judgeUser = computed(() => authStore.user);

const judgeName = computed(() => {
  const u = judgeUser.value || {};
  return u.fullName || u.name || u.displayName || u.username || 'Giám khảo';
});

const judgeEmail = computed(() => {
  const u = judgeUser.value || {};
  return u.email || 'Chưa có email';
});

const judgeRoleLabel = computed(() => {
  const role = String(judgeUser.value?.role || judgeUser.value?.systemRole || '').toLowerCase();
  if (role === 'judge') return 'Ban Giám Khảo';
  if (role === 'admin') return 'Quản trị viên';
  return 'Người dùng hệ thống';
});

const judgeAvatar = computed(() => judgeUser.value?.avatarUrl || null);

const tabs = [
  { path: '/judge/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/judge/assignments', label: 'Dự án phân công', icon: FileCheck },
  { path: '/judge/evaluations', label: 'Phiếu chấm', icon: ClipboardList },
  { path: '/judge/history', label: 'Lịch sử đánh giá', icon: History },
  { path: '/judge/notifications', label: 'Thông báo', icon: Bell },
  { path: '/judge/account', label: 'Tài khoản', icon: UserIcon },
];

const activeTab = computed({
  get() {
    const path = router.currentRoute.value.path;
    const tab = tabs.find((t) => path === t.path || path.startsWith(`${t.path}/`));
    return tab ? tab.path : tabs[0].path;
  },
  set(val) {
    router.push(val);
  },
});

async function loadUnreadCount() {
  try {
    const res = await evaluatorService.getNotifications({ unreadOnly: true, limit: 1 });
    const payload = res?.data || res || {};
    unreadCount.value = Number(payload.unreadCount || payload.notifications?.length || 0);
  } catch {
    unreadCount.value = 0;
  }
}

function handleLogout() {
  authStore.logout();
  router.push('/');
}

onMounted(() => {
  loadUnreadCount();
});
</script>

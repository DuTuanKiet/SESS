<template>
  <div class="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
    
    <!-- 1. Backdrop làm mờ khi mở Mobile Drawer (< 1024px) -->
    <div
      v-if="isMobileDrawerOpen"
      @click="isMobileDrawerOpen = false"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
      aria-hidden="true"
    ></div>

    <!-- 2. Sidebar Điều Hướng (Desktop cố định Sticky | Mobile Off-Canvas Drawer) -->
    <aside
      class="fixed lg:sticky top-0 inset-y-0 left-0 z-40 lg:z-30 w-64 h-screen bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto"
      :class="isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'"
    >
      <div>
        <!-- Sidebar Header: Brand & Phân hệ -->
        <div class="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <router-link to="/" class="flex items-center gap-3 select-none">
            <img src="@/assets/logo-CTUT.png" alt="CTUT Logo" class="w-9 h-9 object-contain" />
            <div class="flex flex-col leading-tight">
              <span class="text-xs font-bold tracking-tight text-[#0B1F4B]">SESS - CTUT</span>
              <span class="text-[9px] font-semibold text-[#1E56D9] uppercase tracking-wider">Cổng Sinh Viên</span>
            </div>
          </router-link>

          <!-- Nút đóng Drawer trên Mobile -->
          <button
            type="button"
            @click="isMobileDrawerOpen = false"
            class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Sidebar Navigation List -->
        <nav class="p-3.5 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="isMobileDrawerOpen = false"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group"
            :class="[
              isItemActive(item)
                ? 'bg-[#F1F7FF] text-[#1E56D9] font-semibold border-l-3 border-[#1E56D9] shadow-2xs'
                : 'text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-50'
            ]"
          >
            <component
              :is="item.icon"
              class="w-4 h-4 text-slate-400 group-hover:text-[#1E56D9] transition-colors"
              :class="isItemActive(item) ? 'text-[#1E56D9]' : 'text-slate-400 group-hover:text-[#1E56D9]'"
            />
            <span>{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1E56D9]"
            >
              {{ item.badge }}
            </span>
          </router-link>
        </nav>
      </div>


    </aside>

    <!-- 3. Khu Vực Nội Dung Chính (Main Area) -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen">
      
      <!-- Topbar Sinh Viên -->
      <header class="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        
        <!-- Bên trái: Nút Hamburger trên Mobile & Tiêu đề phân hệ trên Desktop -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="isMobileDrawerOpen = true"
            class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Mở menu"
          >
            <Menu class="w-5 h-5" />
          </button>

          <div class="hidden sm:block">
            <h1 class="text-xs sm:text-sm font-bold text-[#0B1F4B] leading-tight">
              HỆ THỐNG HỖ TRỢ SINH VIÊN KHỞI NGHIỆP – SESS
            </h1>
            <p class="text-[10px] text-slate-400 font-medium">
              Cổng thông tin &amp; Bảng điều khiển sinh viên CTUT
            </p>
          </div>
        </div>

        <!-- Bên phải: Chuông Thông Báo, Hồ Sơ Sinh Viên -->
        <div class="flex items-center gap-2.5 sm:gap-4">
          <!-- Chuông thông báo tái sử dụng component NotificationDropdown -->
          <NotificationDropdown />

          <!-- Cụm Hồ Sơ Người Dùng (User Profile Dropdown) -->
          <div class="relative" ref="profileDropdownRef">
            <button
              type="button"
              @click="isProfileOpen = !isProfileOpen"
              class="flex items-center gap-2 p-1 pl-1.5 sm:pl-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60"
            >
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1E56D9] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {{ userInitial }}
              </div>
              <div class="hidden sm:flex flex-col text-left leading-tight pr-1">
                <span class="text-xs font-bold text-[#0B1F4B] max-w-[130px] truncate">
                  {{ authStore.user?.fullName || 'Sinh viên' }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">
                  {{ authStore.user?.studentId || 'CNTT' }}
                </span>
              </div>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            <!-- Profile Menu Dropdown -->
            <div
              v-if="isProfileOpen"
              class="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs"
            >
              <div class="px-4 py-2 border-b border-slate-100 mb-1">
                <p class="font-bold text-slate-800 truncate">{{ authStore.user?.fullName }}</p>
                <p class="text-slate-400 text-[10px] truncate">{{ authStore.user?.email }}</p>
                <div class="mt-1 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#1E56D9] uppercase">
                    Sinh viên
                  </span>
                  <span v-if="authStore.user?.studentId" class="text-slate-500 text-[10px] font-medium">
                    MSSV: {{ authStore.user?.studentId }}
                  </span>
                </div>
              </div>

              <router-link
                to="/student"
                @click="isProfileOpen = false"
                class="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0B1F4B] transition-colors"
              >
                <LayoutDashboard class="w-3.5 h-3.5 text-slate-400" />
                <span>Trang tổng quan</span>
              </router-link>

              <router-link
                to="/student/projects"
                @click="isProfileOpen = false"
                class="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0B1F4B] transition-colors"
              >
                <FolderKanban class="w-3.5 h-3.5 text-slate-400" />
                <span>Dự án của tôi</span>
              </router-link>

              <button
                type="button"
                @click="isProfileOpen = false; isChangePasswordOpen = true"
                class="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0B1F4B] transition-colors text-left cursor-pointer"
              >
                <KeyRound class="w-3.5 h-3.5 text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>

              <div class="border-t border-slate-100 my-1"></div>

              <button
                type="button"
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <LogOut class="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      <!-- Nội Dung Các Trang Phân Hệ Sinh Viên (<router-view />) -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view />
      </main>

      <!-- Modal Đổi Mật Khẩu -->
      <ChangePasswordModal v-model:isOpen="isChangePasswordOpen" />

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Menu,
  X,
  LayoutDashboard,
  Trophy,
  FolderKanban,
  Users,
  KeyRound,
  ChevronDown,
  LogOut,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import NotificationDropdown from '@/components/common/NotificationDropdown.vue';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isMobileDrawerOpen = ref(false);
const isProfileOpen = ref(false);
const isChangePasswordOpen = ref(false);
const profileDropdownRef = ref(null);

const userInitial = computed(() => {
  const name = authStore.user?.fullName || 'S';
  return name.trim().charAt(0).toUpperCase();
});

const navItems = [
  { label: 'Tổng quan', path: '/student', icon: LayoutDashboard, exact: true },
  { label: 'Cuộc thi', path: '/competitions', icon: Trophy, exact: false },
  { label: 'Dự án của tôi', path: '/student/projects', icon: FolderKanban, exact: false },

];

/**
 * Kiểm tra menu item có đang active hay không
 * - Mục Tổng quan (exact = true): CHỈ active khi URL đúng bằng '/student'
 * - Mục Dự án của tôi: active khi URL bằng '/student/projects' hoặc bắt đầu bằng '/student/projects/'
 * - Mục Cuộc thi: active khi URL bắt đầu bằng '/competitions'
 */
function isItemActive(item) {
  if (item.exact) {
    return route.path === item.path;
  }
  return route.path === item.path || route.path.startsWith(item.path + '/');
}

function handleLogout() {
  isProfileOpen.value = false;
  authStore.logout();
  router.push('/auth/login');
}

function handleClickOutside(event) {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(event.target)) {
    isProfileOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

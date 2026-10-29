<template>
  <header class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        
        <!-- 1. Logo & Brand Identity -->
        <router-link to="/" class="flex items-center gap-3 group select-none">
          <img src="@/assets/logo-CTUT.png" alt="Logo CTUT" class="w-12 h-12 object-contain" />
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-bold tracking-tight text-[#0B1F4B]">SESS</span>
            <span class="text-[10px] text-slate-500 font-medium tracking-wide">Khởi tạo - Kết nối - Phát triển</span>
          </div>
        </router-link>

        <!-- 2. Navigation Menu -->
        <nav class="hidden lg:flex items-center gap-1 text-sm font-medium">
          
          <!-- Trang chủ -->
          <router-link 
            to="/" 
            class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors"
            active-class="text-[#0B1F4B] font-semibold bg-slate-50"
          >
            Trang chủ
          </router-link>

          <!-- Dropdown: Cuộc thi -->
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Cuộc thi</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/competitions" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Danh sách cuộc thi</router-link>
              <router-link to="/rules" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Thể lệ cuộc thi</router-link>
              <router-link to="/criteria" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tiêu chí đánh giá</router-link>
            </div>
          </div>

          <!-- Dropdown: Tin tức -->
          <div class="relative group py-2">
            <button class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-700 group-hover:text-[#0B1F4B] group-hover:bg-slate-50 transition-colors">
              <span>Tin tức</span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div class="absolute left-0 top-full pt-1.5 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 overflow-hidden py-1.5 z-50">
              <router-link to="/news" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Tin tức & Sự kiện</router-link>
              <router-link to="/contact" class="block px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-blue-50/60 hover:text-[#0B1F4B] transition-colors">Liên hệ</router-link>
            </div>
          </div>

          <!-- Các liên kết đơn -->
          <router-link to="/support" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Hỗ trợ</router-link>
          <router-link to="/about" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Về chúng tôi</router-link>
          <router-link to="/resources" class="px-4 py-2 rounded-lg text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-50 transition-colors" active-class="text-[#0B1F4B] font-semibold bg-slate-50">Tài nguyên</router-link>
        </nav>

        <!-- 3. Right Actions (Search & Auth States) -->
        <div class="flex items-center gap-3">
          <button class="p-2.5 rounded-full text-slate-500 hover:text-[#0B1F4B] hover:bg-slate-100 transition-colors" title="Tìm kiếm">
            <Search class="w-4 h-4" />
          </button>

          <!-- Khi Đã Đăng Nhập: Hiển thị Chuông Thông Báo & Menu Hồ Sơ -->
          <template v-if="authStore.isAuthenticated">
            <!-- Chuông thông báo tái sử dụng -->
            <NotificationDropdown />

            <!-- User Profile Dropdown -->
            <div class="relative" ref="userMenuRef">
              <button
                type="button"
                @click="isUserMenuOpen = !isUserMenuOpen"
                class="flex items-center gap-2 p-1.5 pl-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60"
              >
                <div class="w-7 h-7 rounded-full bg-[#1E56D9] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {{ userInitial }}
                </div>
                <div class="hidden sm:flex flex-col text-left leading-tight pr-1">
                  <span class="text-xs font-bold text-[#0B1F4B] max-w-[120px] truncate">
                    {{ authStore.user?.fullName || 'Người dùng' }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-medium capitalize">
                    {{ authStore.user?.role === 'student' ? 'Sinh viên' : authStore.user?.role }}
                  </span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
              </button>

              <!-- User Menu Popover -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs"
              >
                <div class="px-4 py-2 border-b border-slate-100 mb-1">
                  <p class="font-bold text-slate-800 truncate">{{ authStore.user?.fullName }}</p>
                  <p class="text-slate-400 text-[10px] truncate">{{ authStore.user?.email }}</p>
                  <p v-if="authStore.user?.studentId" class="text-[#1E56D9] font-medium text-[10px] mt-0.5">
                    MSSV: {{ authStore.user?.studentId }}
                  </p>
                </div>

                <router-link
                  :to="dashboardPath"
                  @click="isUserMenuOpen = false"
                  class="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0B1F4B] transition-colors"
                >
                  <LayoutDashboard class="w-3.5 h-3.5 text-slate-400" />
                  <span>Trang tổng quan</span>
                </router-link>

                <router-link
                  v-if="authStore.isStudent"
                  to="/student/projects"
                  @click="isUserMenuOpen = false"
                  class="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0B1F4B] transition-colors"
                >
                  <FolderKanban class="w-3.5 h-3.5 text-slate-400" />
                  <span>Dự án của tôi</span>
                </router-link>

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
          </template>

          <!-- Khi Chưa Đăng Nhập: Nút Đăng nhập -->
          <template v-else>
            <router-link
              to="/auth/login"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F4B] text-white rounded-full hover:bg-[#152e68] font-medium text-xs sm:text-sm shadow-sm transition-all duration-200"
            >
              <User class="w-4 h-4" />
              <span>Đăng nhập</span>
            </router-link>
          </template>
        </div>

      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ChevronDown,
  Search,
  User,
  LayoutDashboard,
  FolderKanban,
  LogOut,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/authStore';
import NotificationDropdown from '@/components/common/NotificationDropdown.vue';

const router = useRouter();
const authStore = useAuthStore();

const isUserMenuOpen = ref(false);
const userMenuRef = ref(null);

const userInitial = computed(() => {
  const name = authStore.user?.fullName || 'U';
  return name.trim().charAt(0).toUpperCase();
});

const dashboardPath = computed(() => {
  if (authStore.isStudent) return '/student';
  if (authStore.isMentor) return '/advisor';
  if (authStore.isJudge) return '/judge';
  if (authStore.isAdmin) return '/admin';
  return '/';
});

function handleLogout() {
  isUserMenuOpen.value = false;
  authStore.logout();
  router.push('/auth/login');
}

function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

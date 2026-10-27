<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import logoCtut from '@/assets/logoCtut.png';

/**
 * Trang Chủ Dành Riêng Cho Quản Trị Viên (Admin Portal Home)
 * Hiển thị sau khi đăng nhập thành công tại /admin/login
 */
const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/admin/login');
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
    <!-- Navbar Header Quản trị -->
    <header class="w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 text-white">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full border border-slate-700 p-0.5 bg-white flex items-center justify-center overflow-hidden">
          <img :src="logoCtut" alt="CTUT Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <p class="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">
            Cổng Quản Trị Hệ Thống SESS
          </p>
          <h1 class="text-xs sm:text-sm font-bold text-white leading-tight mt-0.5">
            BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN (ADMIN CONSOLE)
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-xs font-semibold text-white">{{ authStore.user?.fullName || 'Quản trị viên' }}</p>
          <span class="inline-block px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
            ADMINISTRATOR
          </span>
        </div>
        <button
          type="button"
          @click="handleLogout"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>

    <!-- Thân Trang Chủ Quản trị -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto flex flex-col justify-center">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900">
              Khu vực Quản trị Hệ thống SESS
            </h2>
            <p class="text-xs text-slate-500">
              Phiên làm việc bảo mật cao dành cho Ban Quản trị trường ĐH Kỹ thuật – Công nghệ Cần Thơ.
            </p>
          </div>
        </div>

        <!-- Thẻ thông tin phiên -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <p class="text-slate-400 font-medium">Tài khoản Quản trị:</p>
            <p class="text-sm font-bold text-slate-800">{{ authStore.user?.fullName }}</p>
            <p class="text-slate-400 font-medium pt-1">Email:</p>
            <p class="font-semibold text-slate-800">{{ authStore.user?.email }}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <p class="text-slate-400 font-medium">Quyền hạn hệ thống:</p>
            <p class="text-sm font-bold text-amber-700 uppercase">SUPER ADMINISTRATOR (ADMIN)</p>
            <p class="text-slate-400 font-medium pt-1">Cổng truy cập:</p>
            <p class="font-semibold text-slate-800">Cổng Nội Bộ Riêng Biệt (/admin/login)</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-500">
      © {{ new Date().getFullYear() }} BAN QUẢN TRỊ HỆ THỐNG SESS – CTUT
    </footer>
  </div>
</template>

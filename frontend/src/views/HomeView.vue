<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import logoCtut from '@/assets/logoCtut.png';

/**
 * Trang Chủ Hệ Thống SESS (Dành cho Sinh viên, Giảng viên, Ban giám khảo)
 * Hiển thị sau khi đăng nhập thành công tại /login
 */
const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
    <!-- Navbar Header -->
    <header class="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full border border-slate-200 p-0.5 bg-white flex items-center justify-center overflow-hidden">
          <img :src="logoCtut" alt="CTUT Logo" class="w-full h-full object-contain" />
        </div>
        <div>
          <p class="text-[10px] font-bold tracking-wider text-slate-500 uppercase leading-none">
            Trường Đại học Kỹ thuật – Công nghệ Cần Thơ
          </p>
          <h1 class="text-xs sm:text-sm font-bold text-blue-900 leading-tight mt-0.5">
            HỆ THỐNG HỖ TRỢ KHỞI NGHIỆP SINH VIÊN (SESS)
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <p class="text-xs font-semibold text-slate-800">{{ authStore.user?.fullName || 'Người dùng SESS' }}</p>
          <span class="inline-block px-2 py-0.2 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 uppercase">
            {{ authStore.user?.role || 'Sinh viên' }}
          </span>
        </div>
        <button
          type="button"
          @click="handleLogout"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>

    <!-- Nội dung Trang chủ chính -->
    <main class="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto flex flex-col justify-center">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-900">
              Chào mừng bạn đến với Trang Chủ SESS!
            </h2>
            <p class="text-xs text-slate-500">
              Đăng nhập thành công vào cổng thông tin chính thức của Đại học Kỹ thuật - Công nghệ Cần Thơ.
            </p>
          </div>
        </div>

        <!-- Thẻ thông tin phiên đăng nhập -->
        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <p class="text-slate-400 font-medium">Họ và tên:</p>
            <p class="text-sm font-bold text-slate-800">{{ authStore.user?.fullName }}</p>
            <p class="text-slate-400 font-medium pt-1">Email tài khoản:</p>
            <p class="font-semibold text-blue-900">{{ authStore.user?.email }}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <p class="text-slate-400 font-medium">Vai trò hệ thống (Role):</p>
            <p class="text-sm font-bold text-emerald-700 uppercase">{{ authStore.user?.role }}</p>
            <p v-if="authStore.user?.studentId" class="text-slate-400 font-medium pt-1">Mã số sinh viên (MSSV):</p>
            <p v-if="authStore.user?.studentId" class="font-semibold text-slate-800">{{ authStore.user?.studentId }}</p>
          </div>
        </div>

        <div class="mt-6 p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
          <svg class="w-4 h-4 shrink-0 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="font-bold">Phiên đăng nhập đang hoạt động an toàn:</p>
            <p class="mt-0.5 text-blue-800">
              Access Token được bảo vệ trong RAM theo chuẩn OWASP. Khi Yu đóng tab hoặc nhấn Đăng xuất, phiên sẽ tự động dọn dẹp để bảo vệ tài khoản.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-500">
      © {{ new Date().getFullYear() }} TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
    </footer>
  </div>
</template>

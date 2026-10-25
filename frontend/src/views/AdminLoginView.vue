<script setup>
import LoginHeader from '@/components/auth/LoginHeader.vue';
import LoginForm from '@/components/auth/LoginForm.vue';

/**
 * Cổng Đăng nhập Dành Riêng cho Quản trị viên (Admin Portal)
 * Đường dẫn: /admin/login
 * Thiết kế bảo mật, trang trọng, tách biệt với cổng người dùng thông thường
 */
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="h-screen max-h-screen flex flex-col justify-between bg-slate-100 text-slate-800 antialiased selection:bg-slate-800 selection:text-white overflow-y-auto sm:overflow-hidden">
    <!-- Khối thân trang: Card đăng nhập quản trị -->
    <main class="flex-1 flex items-center justify-center p-3 sm:p-4">
      <div class="w-full max-w-[400px] bg-white rounded-xl border border-slate-300 shadow-md p-5 sm:p-6 my-auto">
        <!-- Header nhận diện Quản trị viên -->
        <LoginHeader
          system-title="CỔNG QUẢN TRỊ HỆ THỐNG SESS"
          :is-admin-portal="true"
        />

        <!-- Form đăng nhập cổng quản trị -->
        <LoginForm portal-type="admin" />
      </div>
    </main>

    <!-- Footer thông tin bảo mật quản trị -->
    <footer class="w-full border-t border-slate-200 bg-white py-2 px-4 text-center text-[11px] text-slate-500 shrink-0">
      <div class="max-w-4xl mx-auto space-y-0.5">
        <p class="font-semibold text-slate-700">
          © {{ currentYear }} BAN QUẢN TRỊ HỆ THỐNG SESS – ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
        </p>
        <p class="text-slate-400">
          Khu vực bảo mật nội bộ. Mọi hành vi truy cập trái phép đều được ghi vết và xử lý theo quy định.
        </p>
      </div>
    </footer>
  </div>
</template>

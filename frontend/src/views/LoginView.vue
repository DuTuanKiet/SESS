<script setup>
import LoginHeader from '@/components/auth/LoginHeader.vue';
import LoginForm from '@/components/auth/LoginForm.vue';

/**
 * Cổng Đăng nhập Người dùng (Sinh viên, Giảng viên, Ban giám khảo)
 * Bố cục học thuật chính quy chuẩn CTUT
 */
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="h-screen max-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 antialiased selection:bg-blue-700 selection:text-white overflow-y-auto sm:overflow-hidden">
    <!-- Khối thân trang: Card đăng nhập trung tâm -->
    <main class="flex-1 flex items-center justify-center p-3 sm:p-4">
      <div class="w-full max-w-[400px] bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 my-auto">
        <!-- Header nhận diện trường và hệ thống -->
        <LoginHeader />

        <!-- Form đăng nhập cổng người dùng -->
        <LoginForm portal-type="user" />
      </div>
    </main>

    <!-- Footer thông tin trường -->
    <footer class="w-full border-t border-slate-200 bg-white py-2 px-4 text-center text-[11px] text-slate-500 shrink-0">
      <div class="max-w-4xl mx-auto space-y-0.5">
        <p class="font-semibold text-slate-700">
          © {{ currentYear }} TRƯỜNG ĐẠI HỌC KỸ THUẬT – CÔNG NGHỆ CẦN THƠ
        </p>
        <p class="text-slate-500">
          Địa chỉ: 256 Nguyễn Văn Cừ, Phường An Hòa, Quận Ninh Kiều, TP. Cần Thơ
        </p>
      </div>
    </footer>
  </div>
</template>

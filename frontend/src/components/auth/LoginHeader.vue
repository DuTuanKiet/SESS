<script setup>
import logoCtut from '@/assets/logoCtut.png';

//Trường Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT) và Hệ thống SESS

defineProps({
  systemTitle: {
    type: String,
    default: 'HỆ THỐNG HỖ TRỢ KHỞI NGHIỆP SINH VIÊN',
  },
  isAdminPortal: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="flex flex-col items-center text-center pb-3 border-b border-slate-100">
    <!-- Logo trường CTUT -->
    <div class="w-12 h-12 mb-1.5 p-0.5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden">
      <img
        :src="logoCtut"
        alt="Logo CTUT"
        class="w-full h-full object-contain"
        loading="eager"
      />
    </div>

    <!-- Tên cơ quan chủ quản / Tên trường đại học -->
    <p class="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
      Trường Đại học Kỹ thuật – Công nghệ Cần Thơ
    </p>

    <!-- Tên hệ thống / Cổng đăng nhập -->
    <h1 class="mt-1 text-[13px] sm:text-[14.5px] font-bold text-blue-900 tracking-tight whitespace-nowrap">
      {{ systemTitle }}
    </h1>
  </div>
</template>

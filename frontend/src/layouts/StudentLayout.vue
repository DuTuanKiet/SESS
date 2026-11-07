<template>
  <!-- Bố cục Website thông thường đồng nhất với PublicLayout: Navbar ngang ở trên, Nội dung ở giữa, Footer ở dưới chân trang -->
  <div class="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
    <Navbar />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
// Merge: dùng bố cục student HEAD với Navbar/Footer chung, không thêm cổng sinh viên thứ hai.
import Navbar from '@/components/common/Navbar.vue';
import Footer from '@/components/common/Footer.vue';
</script>

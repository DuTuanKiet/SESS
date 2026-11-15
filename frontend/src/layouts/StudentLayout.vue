<template>
  <!-- Bố cục Không gian Sinh viên: StudentNavbar cố định ở trên (64px), main có pt-16 để không lấn vào header trang con -->
  <div class="min-h-screen flex flex-col bg-white text-slate-800 font-sans">
    <StudentNavbar />
    <main class="flex-1 pt-16">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import StudentNavbar from '@/modules/student/common/StudentNavbar.vue';
import Footer from '@/components/common/Footer.vue';
</script>
<template>
  <div class="min-h-screen flex flex-col bg-white">
    <StudentNavbar v-if="shouldUseStudentNavbar" />
    <Navbar v-else />
    <!-- pt-[64px] (sm: pt-16) reserves exact space for fixed Navbar (--nav-h:64px) to prevent overlap -->
    <main class="flex-1 pt-16">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/common/Navbar.vue';
import StudentNavbar from '@/modules/student/common/StudentNavbar.vue';
import Footer from '@/components/common/Footer.vue';

const route = useRoute();
const authStore = useAuthStore();

// Giữ nguyên StudentNavbar khi sinh viên đã đăng nhập xem các trang nội dung công khai (trừ trang chủ '/')
const shouldUseStudentNavbar = computed(() => {
  return Boolean(authStore.isAuthenticated && authStore.isStudent && route.name !== 'home');
});
</script>

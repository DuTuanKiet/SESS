<template>
  <div class="min-h-screen flex flex-col bg-white">
    <Navbar />
    <!-- pt-[64px] (sm: pt-16) reserves exact space for fixed Navbar (--nav-h:64px) to prevent overlap -->
    <main class="flex-1 pt-16">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/components/common/Navbar.vue';
import Footer from '@/components/common/Footer.vue';
</script>

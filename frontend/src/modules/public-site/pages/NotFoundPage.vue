<template>
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
    <div class="w-16 h-16 rounded-2xl bg-[#F1F7FF] flex items-center justify-center mx-auto mb-6">
      <AlertCircle class="w-8 h-8 text-orange-500" />
    </div>
    <h1 class="text-4xl sm:text-5xl font-bold text-[#0B1F4B] leading-tight mb-4">404</h1>
    <p class="text-sm text-[#4B5B7A] leading-relaxed mb-8 max-w-[480px] mx-auto">Trang bạn đang tìm không tồn tại.</p>
    <router-link to="/" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E56D9] text-white rounded-full hover:bg-[#1d4ed8] font-medium text-sm shadow-sm transition-colors active:scale-95">
      Về trang chủ
      <ArrowRight class="w-4 h-4" />
    </router-link>
  </section>
</template>

<script setup>
import { AlertCircle, ArrowRight } from 'lucide-vue-next';
</script>

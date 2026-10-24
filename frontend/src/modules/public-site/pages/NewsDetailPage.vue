<template>
  <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <div class="flex items-center gap-2 mb-8">
      <router-link to="/news" class="inline-flex items-center gap-1.5 text-[#1E56D9] hover:text-[#1d4ed8] font-medium text-sm">
        <ArrowLeft class="w-4 h-4" />
        Quay lại danh sách
      </router-link>
    </div>
    <div class="rounded-2xl border border-[#E4ECF7] bg-white p-6 sm:p-8 shadow-sm">
      <h1 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] leading-tight mb-4">Chi tiết tin tức</h1>
      <div class="rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] p-6 shadow-sm">
        <p class="text-sm text-[#4B5B7A] leading-relaxed">Nội dung đang được cập nhật.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next';
</script>

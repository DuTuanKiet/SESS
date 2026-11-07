<template>
  <section class="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
    <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100"><AlertCircle class="h-8 w-8 text-indigo-600" /></div>
    <h1 class="text-5xl font-bold tracking-tight text-[#0f172a]">404</h1>
    <p class="mx-auto mt-3 max-w-[480px] text-sm leading-relaxed text-slate-500">Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.</p>
    <router-link to="/" class="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(79,70,229,0.85)] transition hover:-translate-y-px hover:bg-indigo-500">Về trang chủ <ArrowRight class="h-4 w-4" /></router-link>
  </section>
</template>

<script setup>
import { AlertCircle, ArrowRight } from 'lucide-vue-next';
</script>

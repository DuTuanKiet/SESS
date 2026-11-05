<template>
  <section class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <div class="mb-10 text-center sm:mb-12">
      <p class="mb-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Giới thiệu</p>
      <h1 class="text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">Cuộc thi khởi nghiệp sinh viên</h1>
      <p class="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-slate-500">SESS - Hệ thống hỗ trợ khởi nghiệp sinh viên (Student Entrepreneurship Support System).</p>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div class="space-y-4 lg:col-span-7">
        <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Về SESS</h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">SESS là hệ thống hỗ trợ sinh viên khởi nghiệp, giúp quản lý dự án, theo dõi tiến độ, phân công cố vấn và đánh giá theo quy trình rõ ràng, minh bạch.</p>
        </div>
        <div class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mục tiêu</h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">Kết nối sinh viên với cố vấn, giảng viên và chuyên gia, tạo điều kiện phát triển ý tưởng sáng tạo thành dự án thực tế có tác động.</p>
        </div>
      </div>
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-slate-900 to-indigo-950 p-7 text-white shadow-[0_24px_50px_-24px_rgba(15,23,42,0.55)] lg:col-span-5">
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl"></div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Bắt đầu ngay</p>
        <h2 class="mt-3 text-xl font-bold leading-tight tracking-tight">Hãy bắt đầu hành trình khởi nghiệp của bạn hôm nay</h2>
        <p class="mt-3 text-sm leading-relaxed text-slate-300">Mỗi ý tưởng đều có giá trị và xứng đáng được lắng nghe, hỗ trợ và phát triển.</p>
        <router-link to="/competitions" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:-translate-y-px hover:bg-slate-50">Tham gia ngay <ArrowRight class="h-4 w-4" /></router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next';
</script>

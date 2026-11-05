<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Không gian sinh viên</p>
        <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Tổng quan</h1>
        <p class="mt-1 text-sm text-slate-500">Theo dõi cuộc thi, dự án, nhóm và tiến độ khởi nghiệp của bạn.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.title" class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(79,70,229,0.16)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl" :class="card.glow"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{{ card.title }}</p><p class="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">{{ card.value }}</p><p class="mt-1 text-[12px] text-slate-400">{{ card.desc }}</p></div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1" :class="card.iconWrap"><component :is="card.icon" class="h-5 w-5" /></div>
        </div>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
        <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Bắt đầu nhanh</h2>
        <p class="mt-1 text-[13px] text-slate-500">Các bước phổ biến dành cho sinh viên tham gia khởi nghiệp.</p>
        <div class="mt-4 space-y-2">
          <router-link v-for="action in quickActions" :key="action.to" :to="action.to" class="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/40 px-4 py-3 transition hover:border-indigo-200/70 hover:bg-white hover:shadow-sm">
            <div class="flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-slate-200/70"><component :is="action.icon" class="h-4 w-4" /></div><span class="text-sm font-semibold text-slate-800">{{ action.label }}</span></div>
            <ArrowRight class="h-4 w-4 text-slate-400" />
          </router-link>
        </div>
      </section>
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
        <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Trạng thái hệ thống</h2>
        <p class="mt-1 text-[13px] text-slate-500">Dữ liệu tổng quan sẽ hiển thị khi các module sinh viên được kết nối API.</p>
        <div class="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
          <div class="flex items-start gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Sparkles class="h-5 w-5" /></div><div><p class="text-sm font-semibold text-slate-800">Giao diện đã sẵn sàng</p><p class="mt-1 text-[13px] leading-relaxed text-slate-500">Bạn có thể truy cập Cuộc thi, Dự án, Nhóm, Cố vấn và Tiến độ từ thanh điều hướng. Nội dung chi tiết sẽ tự động đồng bộ khi dữ liệu khả dụng.</p></div></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Trophy, FolderKanban, Users, LineChart, ArrowRight, Sparkles, GraduationCap } from 'lucide-vue-next';

const cards = [
  { title: 'Cuộc thi', value: '—', desc: 'Cuộc thi đang tham gia', icon: Trophy, glow: 'bg-indigo-100/70', iconWrap: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
  { title: 'Dự án', value: '—', desc: 'Dự án của bạn', icon: FolderKanban, glow: 'bg-violet-100/70', iconWrap: 'bg-violet-50 text-violet-600 ring-violet-100' },
  { title: 'Nhóm', value: '—', desc: 'Thành viên & vai trò', icon: Users, glow: 'bg-emerald-100/70', iconWrap: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  { title: 'Tiến độ', value: '—', desc: 'Mốc & cập nhật', icon: LineChart, glow: 'bg-amber-100/70', iconWrap: 'bg-amber-50 text-amber-600 ring-amber-100' },
];
const quickActions = [
  { to: '/student/competitions', label: 'Xem cuộc thi', icon: Trophy },
  { to: '/student/projects', label: 'Quản lý dự án', icon: FolderKanban },
  { to: '/student/mentoring', label: 'Kết nối cố vấn', icon: GraduationCap },
];
</script>

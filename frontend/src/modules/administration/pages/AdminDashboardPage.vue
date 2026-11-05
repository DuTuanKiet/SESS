<template>
  <div class="space-y-6">
    <div>
      <p class="mb-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-700 ring-1 ring-inset ring-slate-200/70">Bảng điều khiển quản trị</p>
      <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Tổng quan hệ thống</h1>
      <p class="mt-1 text-sm text-slate-500">Quản lý cuộc thi, dự án, phân công giám khảo/cố vấn, rubric và báo cáo.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.title" class="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.14)]">
        <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl" :class="card.glow"></div>
        <div class="relative flex items-start justify-between gap-3">
          <div><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{{ card.title }}</p><p class="mt-2 text-3xl font-bold tracking-tight text-[#0f172a]">{{ card.value }}</p><p class="mt-1 text-[12px] text-slate-400">{{ card.desc }}</p></div>
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1" :class="card.iconWrap"><component :is="card.icon" class="h-5 w-5" /></div>
        </div>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6 xl:col-span-7">
        <div class="flex items-center justify-between"><h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Tác vụ quản trị nhanh</h2><span class="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Enterprise</span></div>
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <router-link v-for="action in quickActions" :key="action.to" :to="action.to" class="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200/70 hover:bg-white hover:shadow-sm">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 ring-1 ring-slate-200/70"><component :is="action.icon" class="h-4.5 w-4.5" /></div>
            <div class="min-w-0"><p class="text-sm font-semibold text-slate-900">{{ action.label }}</p><p class="text-[12px] text-slate-500">{{ action.desc }}</p></div>
          </router-link>
        </div>
      </section>
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6 xl:col-span-5">
        <h2 class="text-sm font-semibold tracking-tight text-[#0f172a]">Ghi chú vận hành</h2>
        <div class="mt-4 space-y-3">
          <div class="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phân công giám khảo</p><p class="mt-1 text-[13px] leading-relaxed text-slate-600">Sử dụng API <span class="font-mono text-indigo-700">/admin/evaluations/assign</span> để tạo HumanEvaluation và gửi thông báo tới giám khảo.</p></div>
          <div class="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4"><p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dữ liệu tổng hợp</p><p class="mt-1 text-[13px] leading-relaxed text-slate-600">Các bảng dữ liệu, bộ lọc và phân trang sẽ hiển thị khi module quản trị tương ứng được kết nối.</p></div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { Users, Trophy, FolderKanban, Scale, ClipboardList, BarChart3 } from 'lucide-vue-next';

const cards = [
  { title: 'Người dùng', value: '—', desc: 'Tài khoản & phân quyền', icon: Users, glow: 'bg-slate-100/80', iconWrap: 'bg-slate-100 text-slate-700 ring-slate-200/70' },
  { title: 'Cuộc thi', value: '—', desc: 'Vòng thi & trạng thái', icon: Trophy, glow: 'bg-indigo-100/70', iconWrap: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
  { title: 'Dự án', value: '—', desc: 'Hồ sơ & nhóm', icon: FolderKanban, glow: 'bg-violet-100/70', iconWrap: 'bg-violet-50 text-violet-600 ring-violet-100' },
  { title: 'Đánh giá', value: '—', desc: 'Phân công giám khảo', icon: Scale, glow: 'bg-amber-100/70', iconWrap: 'bg-amber-50 text-amber-600 ring-amber-100' },
];
const quickActions = [
  { to: '/admin/users', label: 'Người dùng', desc: 'Quản lý vai trò', icon: Users },
  { to: '/admin/competitions', label: 'Cuộc thi', desc: 'Vòng thi & cài đặt', icon: Trophy },
  { to: '/admin/judge-assignments', label: 'Phân công GK', desc: 'Gán chấm điểm', icon: Scale },
  { to: '/admin/rubrics', label: 'Rubric', desc: 'Tiêu chí đánh giá', icon: ClipboardList },
  { to: '/admin/reports', label: 'Báo cáo', desc: 'Tổng hợp kết quả', icon: BarChart3 },
  { to: '/admin/projects', label: 'Dự án & nhóm', desc: 'Theo dõi hồ sơ', icon: FolderKanban },
];
</script>

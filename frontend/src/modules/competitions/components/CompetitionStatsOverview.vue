<script setup>
const props = defineProps({
  stats: {
    type: Array,
    default: () => [
      { label: 'Cuộc thi đang diễn ra', value: '12', sub: 'Đang nhận hồ sơ', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Tổng quỹ giải thưởng', value: '500+', sub: 'Triệu VNĐ', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Dự án đã đăng ký', value: '1,248', sub: 'Từ khắp toàn trường', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'Khoa tham gia', value: '14', sub: 'Hưởng ứng toàn diện', color: 'text-amber-600', bg: 'bg-amber-50' },
    ],
  },
});

const icons = {
  'text-emerald-600': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />',
  'text-blue-600': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />',
  'text-indigo-600': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
  'text-amber-600': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m2 12H9a2 2 0 01-2-2v-6a2 2 0 012-2m2 2H5a2 2 0 012-2v6a2 2 0 01-2 2m2-2h6a2 2 0 012 2v6a2 2 0 01-2 2z" />',
};
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <div
      v-for="(stat, idx) in props.stats"
      :key="idx"
      class="relative rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md p-5 sm:p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div class="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center" :class="[stat.bg, 'text-xs font-bold']" :style="{ color: stat.color.replace('text-', '') }">
        <span v-html="icons[stat.color]" class="w-5 h-5" />
      </div>
      <div class="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] leading-tight mb-1">
        {{ stat.value }}
      </div>
      <div class="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider leading-tight">
        {{ stat.label }}
      </div>
      <div class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
        {{ stat.sub }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  competition: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const statusConfig = {
  ongoing: { label: 'Đang nhận hồ sơ', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  upcoming: { label: 'Sắp khởi động', class: 'bg-amber-50 text-amber-700 border-amber-100' },
  ended: { label: 'Đã tổng kết', class: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const levelConfig = {
  faculty: { label: 'Cấp Khoa', class: 'bg-slate-50 text-slate-600 border-slate-200' },
  university: { label: 'Cấp Trường', class: 'bg-blue-50 text-blue-700 border-blue-100' },
  ministry: { label: 'Cấp Bộ', class: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
};

const statusClass = (status) => {
  const cfg = statusConfig[status] || statusConfig.ended;
  return `px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${cfg.class}`;
};

const levelClass = (level) => {
  const cfg = levelConfig[level] || levelConfig.faculty;
  return `px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${cfg.class}`;
};

const formatVND = (value) => {
  if (!value) return '—';
  return value.toLocaleString('vi-VN') + ' Triệu VNĐ';
};

const handleViewDetail = () => {
  router.push({ name: 'competition-detail', params: { id: props.competition.id } });
};

const handleSubmit = () => {
  router.push({ name: 'competition-submit', params: { id: props.competition.id } });
};
</script>

<template>
  <article
    class="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
  >
    <!-- Badge row -->
    <div class="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div class="flex items-start gap-2 flex-1">
        <span :class="statusClass(competition.status)" class="px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap">
          {{ statusConfig[competition.status]?.label || competition.status }}
        </span>
        <span :class="levelClass(competition.level)" class="px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap">
          {{ levelConfig[competition.level]?.label || competition.level }}
        </span>
      </div>
      <router-link
        :to="{ name: 'competition-detail', params: { id: competition.id } }"
        class="text-[11px] sm:text-sm font-medium text-[#0B1F4B] hover:text-[#1E56D9] underline underline-offset-4 transition-colors whitespace-nowrap"
      >
        Xem chi tiết thể lệ
      </router-link>
    </div>

    <!-- Title -->
    <div class="px-5 sm:p-6 pt-0">
      <h3 class="text-sm sm:text-base font-bold text-[#0B1F4B] leading-tight mb-1 group-hover:text-[#1E56D9] transition-colors">
        {{ competition.title }}
      </h3>
      <p class="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
        {{ competition.description }}
      </p>

      <!-- Timeline milestones -->
      <div class="grid grid-cols-3 gap-3 mb-5 border-t border-slate-100 pt-3">
        <div class="text-center">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Hồ sơ sơ khảo</div>
          <div class="text-sm font-semibold text-[#0B1F4B]">{{ competition.milestones?.proposal || '—' }}</div>
        </div>
        <div class="text-center">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Vòng bán kết</div>
          <div class="text-sm font-semibold text-[#0B1F4B]">{{ competition.milestones?.semifinal || '—' }}</div>
        </div>
        <div class="text-center">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Chung kết</div>
          <div class="text-sm font-semibold text-[#0B1F4B]">{{ competition.milestones?.final || '—' }}</div>
        </div>
      </div>

      <!-- Core stats -->
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">Quỹ giải thưởng</div>
          <div class="text-sm font-bold text-[#0B1F4B]">{{ formatVND(competition.prizePool) }}</div>
        </div>
        <div class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">Đội đã tham gia</div>
          <div class="text-sm font-bold text-[#0B1F4B]">{{ competition.teamCount || 0 }}</div>
        </div>
        <div class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <div class="text-[10px] text-slate-400 uppercase tracking-wider">Cấp tổ chức</div>
          <div class="text-sm font-bold text-[#0B1F4B]">{{ levelConfig[competition.level]?.label || competition.level }}</div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="px-5 sm:p-6 pb-5 sm:pb-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
      <div class="grid grid-cols-2 gap-3">
        <router-link
          :to="{ name: 'competition-detail', params: { id: competition.id } }"
          class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#0B1F4B] bg-white text-[#0B1F4B] text-xs sm:text-sm font-medium hover:bg-[#0B1F4B] hover:text-white transition-colors active:scale-95"
        >
          Xem chi tiết thể lệ
        </router-link>
        <button
          @click="handleSubmit"
          :disabled="competition.status !== 'ongoing'"
          class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-transparent bg-[#0B1F4B] text-white text-xs sm:text-sm font-medium shadow-sm shadow-[#0B1F4B]/25 hover:bg-[#1E56D9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          Nộp hồ sơ ngay
        </button>
      </div>
    </div>
  </article>
</template>

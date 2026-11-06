<template>
  <div class="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
    <!-- Dòng thông tin giải thưởng: Tối giản, không icon -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="space-y-0.5 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-bold text-[#0B1F4B] text-[13px]">
            {{ project?.award?.prizeName || project?.award?.title || 'Đạt giải' }}
          </span>
          <span class="text-slate-300">•</span>
          <span class="text-slate-500 font-medium">
            {{ project?.award?.rank || project?.award?.round || 'Vòng Chung kết' }}
          </span>
        </div>
        <p v-if="project?.award?.competitionName" class="text-[11px] text-slate-500 truncate">
          {{ project.award.competitionName }}
        </p>
      </div>

      <div v-if="project?.award?.cashAmount || project?.award?.prizeMoney" class="text-right shrink-0">
        <span class="text-[11px] text-slate-400 block">Trị giá giải thưởng</span>
        <span class="font-bold text-[#1E56D9] text-xs">{{ formatAmount(project.award.cashAmount) || project.award.prizeMoney }}</span>
      </div>
    </div>

    <!-- Khu vực hành động kê khai thông tin nhận thưởng -->
    <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
      <!-- Trạng thái đã kê khai -->
      <template v-if="rewardClaim">
        <div class="text-[11px] text-slate-600 flex items-center gap-1.5">
          <span>Đã kê khai (Đại diện: <strong>{{ rewardClaim.accountHolder || 'nhóm dự án' }}</strong>) · {{ rewardClaim.status }}</span>
        </div>
        <button
          v-if="canClaim"
          type="button"
          @click="$emit('openClaim', project)"
          class="text-xs font-semibold text-[#1E56D9] hover:underline cursor-pointer shrink-0"
        >
          Xem / Chỉnh sửa
        </button>
      </template>

      <!-- Trạng thái chưa kê khai -->
      <template v-else-if="canClaim">
        <span class="text-[11px] text-slate-500">
          Kê khai hoặc xem trạng thái hồ sơ nhận thưởng
        </span>
        <button
          type="button"
          @click="$emit('openClaim', project)"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer shrink-0"
        >
          Kê khai / xem hồ sơ
        </button>
      </template>
      <span v-else class="text-[11px] text-slate-500">Chỉ trưởng nhóm có thể kê khai nhận thưởng.</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Component hiển thị thông tin giải thưởng và kích hoạt kê khai nhận thưởng
 * Thiết kế tối giản, loại bỏ icon rườm rà, tuân thủ phong cách học vụ CTUT.
 */
defineProps({
  project: {
    type: Object,
    required: true,
  },
  rewardClaim: { type: Object, default: null },
  canClaim: { type: Boolean, default: false },
});

defineEmits(['openClaim']);

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '';
  return `${new Intl.NumberFormat('vi-VN').format(Number(value))} ₫`;
}
</script>


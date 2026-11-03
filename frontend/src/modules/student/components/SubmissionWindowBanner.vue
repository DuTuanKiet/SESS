<template>
  <div>
    <!-- Trạng thái 1: CỔNG NỘP ĐANG MỞ (Kèm Countdown Timer trực quan) -->
    <div
      v-if="windowStatus === 'OPEN'"
      class="border-b p-5 sm:p-6 transition-all duration-300"
      :class="isEmergencyUrgent
        ? 'bg-rose-50 border-rose-200 text-rose-950'
        : isWarningUrgent
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-[#F1F7FF] border-[#C7D7F5] text-[#0B1F4B]'"
    >
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-1.5">
          <h3 class="text-base sm:text-lg font-bold">
            {{ isEmergencyUrgent
              ? 'Khẩn cấp: Sắp kết thúc thời hạn nộp bài!'
              : isWarningUrgent
                ? 'Lưu ý: Chỉ còn chưa đầy 48 giờ để hoàn tất nộp bài!'
                : 'Cổng nộp bài đang mở — Nhóm có thể tải lên và cập nhật tài liệu' }}
          </h3>
          <p class="text-xs opacity-90 max-w-2xl leading-relaxed">
            Trong thời gian nộp bài này, sinh viên được phép sửa đổi và thay thế các tài liệu.
          </p>
        </div>

        <!-- Live Countdown Timer -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0 self-center lg:self-auto">
          <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
            <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.days }}</span>
            <span class="text-[10px] font-bold uppercase text-slate-500">Ngày</span>
          </div>
          <span class="text-xl font-bold text-slate-400">:</span>
          <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
            <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.hours }}</span>
            <span class="text-[10px] font-bold uppercase text-slate-500">Giờ</span>
          </div>
          <span class="text-xl font-bold text-slate-400">:</span>
          <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
            <span class="text-lg sm:text-2xl font-black text-[#0B1F4B]">{{ countdown.minutes }}</span>
            <span class="text-[10px] font-bold uppercase text-slate-500">Phút</span>
          </div>
          <span class="text-xl font-bold text-slate-400">:</span>
          <div class="flex flex-col items-center bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-black/10 shadow-xs min-w-[56px] sm:min-w-[64px]">
            <span class="text-lg sm:text-2xl font-black text-[#1E56D9]">{{ countdown.seconds }}</span>
            <span class="text-[10px] font-bold uppercase text-slate-500">Giây</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trạng thái 2: THỜI GIAN NỘP ĐÃ KẾT THÚC (Khóa chỉnh sửa) -->
    <div
      v-else-if="windowStatus === 'CLOSED'"
      class="border-b border-slate-200 bg-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Lock class="w-4 h-4 text-slate-600" />
          <h3 class="text-base sm:text-lg font-bold text-[#0B1F4B]">
            Thời gian nộp bài đã kết thúc
          </h3>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Cổng nộp bài {{ currentRound?.code }} đã chính thức đóng.
        </p>
      </div>

      <div class="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-auto flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Hội đồng đang tiến hành chấm điểm</span>
      </div>
    </div>

    <!-- Trạng thái 3: ĐÃ QUA VÒNG (Mở khóa để tiếp tục nâng cấp hồ sơ cho vòng kế tiếp) -->
    <div
      v-else-if="windowStatus === 'PASSED'"
      class="border-b border-emerald-200 bg-emerald-50/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Trophy class="w-5 h-5 text-emerald-700" />
          <h3 class="text-base sm:text-lg font-bold text-emerald-900">
            Chúc mừng! Nhóm đã xuất sắc vượt qua {{ currentRound?.title }}
          </h3>
        </div>
        <p class="text-xs text-emerald-800 leading-relaxed max-w-2xl">
          Hồ sơ đã được mở khóa. Nhóm có thể tiếp tục chỉnh sửa, nâng cấp và hoàn thiện các tài liệu bên dưới theo nhận xét và góp ý của Hội đồng để sẵn sàng cho vòng thi tiếp theo.
        </p>
      </div>

      <div class="bg-emerald-100/80 px-4 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 shrink-0">
        <CheckCircle2 class="w-4 h-4 text-emerald-700" />
        <span>Hồ sơ đã mở khóa để nâng cấp</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Lock, Trophy, CheckCircle2 } from 'lucide-vue-next';

/**
 * Component hiển thị banner trạng thái cửa sổ nộp bài kèm bộ đếm ngược
 */
const props = defineProps({
  windowStatus: {
    type: String,
    required: true,
    validator: (val) => ['OPEN', 'CLOSED', 'PASSED'].includes(val),
  },
  currentRound: {
    type: Object,
    default: () => ({
      id: 1,
      code: 'Vòng 1',
      title: 'Vòng 1: Vòng Loại (Sơ khảo)',
      stage: 'Sơ khảo',
    }),
  },
});

const emit = defineEmits(['window-expired']);

// Đồng hồ đếm ngược (Countdown Timer) giả lập 2 ngày 14 giờ
const remainingSeconds = ref(2 * 86400 + 14 * 3600 + 25 * 60 + 40);
let timerInterval = null;

const countdown = computed(() => {
  const total = Math.max(0, remainingSeconds.value);
  const days = String(Math.floor(total / 86400)).padStart(2, '0');
  const hours = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return { days, hours, minutes, seconds };
});

const isWarningUrgent = computed(
  () => remainingSeconds.value <= 48 * 3600 && remainingSeconds.value > 24 * 3600
);
const isEmergencyUrgent = computed(() => remainingSeconds.value <= 24 * 3600);

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1;
    } else {
      emit('window-expired');
      clearInterval(timerInterval);
    }
  }, 1000);
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>


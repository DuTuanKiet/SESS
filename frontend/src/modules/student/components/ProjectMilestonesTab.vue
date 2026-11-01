<template>
  <!-- NỘI DUNG MỤC 2: TIẾN ĐỘ & GÓP Ý TỪ GIẢNG VIÊN CỐ VẤN -->
  <section class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="md:col-span-2 bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-[#0B1F4B]">Tiến độ hoàn thành các mốc công việc</span>
          <span class="font-bold text-[#1E56D9]">{{ milestoneProgressPercent }}%</span>
        </div>
        <div class="w-full h-2.5 bg-[#E4ECF7] rounded-full overflow-hidden">
          <div
            class="h-full bg-[#1E56D9] transition-all duration-500 rounded-full"
            :style="{ width: `${milestoneProgressPercent}%` }"
          ></div>
        </div>
        <p class="text-xs text-[#4B5B7A]">
          Đã hoàn thành <strong class="text-[#0B1F4B]">{{ completedMilestonesCount }}</strong> / {{ milestones.length }} mốc theo kế hoạch.
        </p>
      </div>

      <div class="bg-[#F8FBFF] rounded-2xl border border-[#E4ECF7] p-5 flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5] flex items-center justify-center font-bold text-sm shrink-0">
          GV
        </div>
        <div class="min-w-0">
          <span class="text-[10px] text-[#4B5B7A] font-semibold uppercase tracking-wider block">Giảng viên Cố vấn</span>
          <h4 class="text-sm font-bold text-[#0B1F4B] truncate">TS. Nguyễn Văn Hướng</h4>
          <p class="text-xs text-[#4B5B7A] truncate">Khoa Công nghệ thông tin</p>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div
        v-for="(ms, index) in milestones"
        :key="ms._id"
        class="bg-white rounded-2xl border border-[#E4ECF7] p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4ECF7]">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full bg-[#F1F7FF] text-[#1E56D9] font-bold text-xs flex items-center justify-center shrink-0">
              {{ index + 1 }}
            </span>
            <h4 class="text-sm font-bold text-[#0B1F4B]">{{ ms.title }}</h4>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-[#4B5B7A]">Hạn nộp: <strong class="text-[#0B1F4B]">{{ ms.dueDate }}</strong></span>
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              :class="getMilestoneBadgeClass(ms.status)"
            >
              {{ getMilestoneLabel(ms.status) }}
            </span>
          </div>
        </div>

        <div v-if="ms.evidence" class="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] text-xs space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-[#0B1F4B] flex items-center gap-1.5">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
              <span>Bài làm đã gửi:</span>
            </span>
            <span class="text-[11px] text-[#4B5B7A]">{{ formatDate(ms.evidence.submittedAt) }}</span>
          </div>
          <p class="text-[#4B5B7A] leading-relaxed">{{ ms.evidence.note }}</p>
          <a
            :href="ms.evidence.fileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs font-semibold text-[#1E56D9] hover:underline"
          >
            <span>Xem tài liệu đã gửi ↗</span>
          </a>
        </div>

        <div v-if="ms.mentorFeedback" class="p-3.5 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-xs space-y-1">
          <div class="font-bold text-[#0B1F4B] flex items-center gap-1.5">
            <MessageSquare class="w-3.5 h-3.5 text-[#1E56D9]" />
            <span>Nhận xét từ Giảng viên Cố vấn:</span>
          </div>
          <p class="text-[#4B5B7A] leading-relaxed">{{ ms.mentorFeedback }}</p>
        </div>

        <div class="pt-1 flex items-center justify-between flex-wrap gap-2">
          <div class="text-xs text-[#4B5B7A]">
            <span v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted" class="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
              <span>Mốc này đã hoàn thành.</span>
            </span>
            <span v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted" class="text-[#4B5B7A] flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              <span>Bắt đầu từ ngày: {{ formatDateOnly(ms.startDate) }}</span>
            </span>
          </div>

          <div>
            <button
              v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted"
              type="button"
              disabled
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed select-none"
            >
              <Lock class="w-3.5 h-3.5" />
              <span>Đã hoàn thành</span>
            </button>

            <button
              v-else-if="evaluateMilestoneEvidenceEligibility(ms).isNotStarted"
              type="button"
              disabled
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed select-none"
              :title="evaluateMilestoneEvidenceEligibility(ms).reason"
            >
              <Clock class="w-3.5 h-3.5" />
              <span>Chưa mở nộp</span>
            </button>

            <button
              v-else
              type="button"
              @click="openEvidenceModal(ms)"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              :class="ms.evidence
                ? 'bg-[#F1F7FF] text-[#1E56D9] hover:bg-[#1E56D9] hover:text-white border border-[#C7D7F5]'
                : 'bg-[#1E56D9] text-white hover:bg-[#1d4ed8]'"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ ms.evidence ? 'Cập nhật lại bài làm' : 'Gửi bài làm mốc này' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL NỘP BÀI LÀM MỐC TIẾN ĐỘ -->
    <div
      v-if="isEvidenceModalOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <div>
            <h3 class="text-base font-bold text-[#0B1F4B]">Gửi bài làm mốc tiến độ</h3>
            <p class="text-xs text-[#4B5B7A] mt-0.5">{{ selectedMilestone?.title }}</p>
          </div>
          <button
            type="button"
            @click="isEvidenceModalOpen = false"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmitEvidence" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-[#0B1F4B] mb-1">
              Đường dẫn tài liệu / Bài làm <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="evidenceForm.fileUrl"
              type="url"
              required
              placeholder="https://drive.google.com/..."
              class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            />
          </div>

          <div>
            <label class="block font-semibold text-[#0B1F4B] mb-1">
              Ghi chú kết quả thực hiện <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="evidenceForm.note"
              rows="3"
              required
              maxlength="1000"
              placeholder="Tóm tắt các nội dung nhóm đã hoàn thành..."
              class="w-full px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
            ></textarea>
          </div>

          <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isEvidenceModalOpen = false"
              class="px-4 py-2 rounded-full font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-full font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi bài làm' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  Upload,
  Loader2,
  X,
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

/**
 * Tab 2: Tiến độ & Góp ý từ Giảng viên Cố vấn (Kèm Modal nộp bài làm mốc tiến độ)
 */
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  milestones: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['refresh-milestones']);

const toastStore = useToastStore();

const isSubmitting = ref(false);
const isEvidenceModalOpen = ref(false);
const selectedMilestone = ref(null);

const evidenceForm = ref({
  fileUrl: '',
  note: '',
});

const completedMilestonesCount = computed(() =>
  props.milestones.filter((m) => m.status === 'Completed').length
);

const milestoneProgressPercent = computed(() => {
  if (!props.milestones.length) return 0;
  return Math.round((completedMilestonesCount.value / props.milestones.length) * 100);
});

/**
 * Đánh giá điều kiện nộp/cập nhật minh chứng của cột mốc
 * @param {Object} ms - Thông tin cột mốc
 * @returns {{ canSubmit: boolean, isCompleted: boolean, isNotStarted: boolean, reason: string }}
 */
function evaluateMilestoneEvidenceEligibility(ms) {
  if (!ms) return { canSubmit: false, isCompleted: false, isNotStarted: false, reason: 'Dữ liệu mốc không hợp lệ' };

  // 1. Kiểm tra mốc ĐÃ HOÀN THÀNH -> Khóa cập nhật
  if (ms.status === 'Completed' || ms.status === 'DONE') {
    return {
      canSubmit: false,
      isCompleted: true,
      isNotStarted: false,
      reason: 'Cột mốc này đã hoàn thành. Minh chứng đã được đóng băng bảo mật, không thể cập nhật thêm.',
    };
  }

  // 2. Kiểm tra mốc CHƯA BẮT ĐẦU (theo ngày bắt đầu hoặc trạng thái Pending/PLANNED)
  const now = new Date();
  if (ms.startDate) {
    const start = new Date(ms.startDate);
    if (start.getTime() > now.getTime()) {
      return {
        canSubmit: false,
        isCompleted: false,
        isNotStarted: true,
        reason: `Cột mốc này chưa bắt đầu. Thời gian triển khai bắt đầu từ ngày ${formatDateOnly(ms.startDate)}.`,
      };
    }
  }

  if (ms.status === 'Pending' || ms.status === 'PLANNED') {
    return {
      canSubmit: false,
      isCompleted: false,
      isNotStarted: true,
      reason: 'Cột mốc đang ở trạng thái Chờ triển khai, chưa thể nộp minh chứng.',
    };
  }

  // Mốc hợp lệ để nộp hoặc cập nhật
  return {
    canSubmit: true,
    isCompleted: false,
    isNotStarted: false,
    reason: '',
  };
}

function openEvidenceModal(ms) {
  const check = evaluateMilestoneEvidenceEligibility(ms);
  if (!check.canSubmit) {
    toastStore.add({ message: check.reason, type: 'warning' });
    return;
  }

  selectedMilestone.value = ms;
  evidenceForm.value = {
    fileUrl: ms.evidence?.fileUrl || '',
    note: ms.evidence?.note || '',
  };
  isEvidenceModalOpen.value = true;
}

// Gửi Minh chứng (Phòng thủ FE chống bypass ngoài form)
async function handleSubmitEvidence() {
  if (!selectedMilestone.value) return;

  const check = evaluateMilestoneEvidenceEligibility(selectedMilestone.value);
  if (!check.canSubmit) {
    toastStore.add({ message: `Thao tác bị từ chối: ${check.reason}`, type: 'error' });
    isEvidenceModalOpen.value = false;
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await projectService.submitEvidence(
      props.projectId,
      selectedMilestone.value._id,
      evidenceForm.value
    );
    if (res?.success) {
      toastStore.add({ message: 'Nộp minh chứng mốc tiến độ thành công!', type: 'success' });
      isEvidenceModalOpen.value = false;
      emit('refresh-milestones');
    }
  } catch (error) {
    toastStore.add({ message: error.message || 'Lỗi nộp minh chứng', type: 'error' });
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 1200);
  }
}

function getMilestoneBadgeClass(status) {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'InProgress':
      return 'bg-[#F1F7FF] text-[#1E56D9] border border-[#C7D7F5]';
    case 'Overdue':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getMilestoneLabel(status) {
  switch (status) {
    case 'Completed':
      return 'Đã hoàn thành';
    case 'InProgress':
      return 'Đang thực hiện';
    case 'Overdue':
      return 'Quá hạn';
    default:
      return 'Chờ thực hiện';
  }
}

function formatDateOnly(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>


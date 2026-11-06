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
          <h4 class="text-sm font-bold text-[#0B1F4B] truncate">
            {{ project.advisorInfo?.fullName || 'Chưa phân công' }}
          </h4>
          <p class="text-xs text-[#4B5B7A] truncate">
            {{ project.advisorInfo?.department || project.advisorInfo?.unit || project.faculty || 'Đang chờ phân công' }}
          </p>
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
            <span class="text-xs text-[#4B5B7A]">Hạn nộp: <strong class="text-[#0B1F4B]">{{ formatDateOnly(ms.dueDate) }}</strong></span>
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
            <span v-if="ms.evidence.isLate" class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">Nộp trễ</span>
          </div>
          <p class="text-[#4B5B7A] leading-relaxed">{{ ms.evidence.note }}</p>
          <a
            :href="ms.evidence.url || ms.evidence.fileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs font-semibold text-[#1E56D9] hover:underline"
          >
            <span>Xem tài liệu đã gửi ↗</span>
          </a>
        </div>

        <div v-if="ms.comments?.length || ms.mentorFeedback" class="p-3.5 rounded-xl bg-[#F1F7FF] border border-[#C7D7F5] text-xs space-y-2">
          <div class="font-bold text-[#0B1F4B] flex items-center gap-1.5">
            <MessageSquare class="w-3.5 h-3.5 text-[#1E56D9]" />
            <span>Nhận xét từ Giảng viên Cố vấn:</span>
          </div>
          <div v-if="ms.comments?.length" class="space-y-2">
            <div v-for="comment in ms.comments" :key="comment._id" class="border-t border-[#C7D7F5]/70 pt-2">
              <p class="text-[#4B5B7A] leading-relaxed">{{ comment.content }}</p>
              <p class="mt-1 text-[10px] text-slate-500">
                {{ comment.authorId?.profile?.fullName || comment.authorId?.fullName || comment.authorId?.email || 'Giảng viên' }}
                <span v-if="comment.createdAt"> · {{ formatDate(comment.createdAt) }}</span>
              </p>
            </div>
          </div>
          <p v-else class="text-[#4B5B7A] leading-relaxed">{{ ms.mentorFeedback }}</p>
        </div>

        <div class="pt-1 flex items-center justify-between flex-wrap gap-2">
          <div class="text-xs text-[#4B5B7A]">
            <span v-if="evaluateMilestoneEvidenceEligibility(ms).isCompleted" class="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã đóng cửa sổ nộp minh chứng.</span>
            </span>
            <span v-else-if="evaluateMilestoneEvidenceEligibility(ms).canUpdate" class="text-[#1E56D9] font-medium flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã nộp bài (có thể cập nhật đến {{ formatDateOnly(addLateWindow(ms.dueDate)) }}).</span>
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
              <span>Đã chốt kết quả</span>
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
    <MilestoneEvidenceModal
      v-model:is-open="isEvidenceModalOpen"
      :milestone="selectedMilestone"
      :is-submitting="isSubmitting"
      @submit="handleSubmitEvidence"
    />
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
} from 'lucide-vue-next';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';
import {
  getMilestoneStatusBadgeClass,
  getMilestoneStatusLabel,
  formatDateOnlyVi,
  formatDateTimeVi,
} from '@/modules/student/utils/studentProjectHelpers';
import MilestoneEvidenceModal from '@/modules/student/components/MilestoneEvidenceModal.vue';

/**
 * Tab 2: Tiến độ & Góp ý từ Giảng viên Cố vấn (Kèm Modal nộp/cập nhật bài làm mốc tiến độ)
 */
const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  project: {
    type: Object,
    default: () => ({}),
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

const completedMilestonesCount = computed(() =>
  props.milestones.filter((m) => m.status === 'Completed' || m.status === 'DONE').length
);

const milestoneProgressPercent = computed(() => {
  if (!props.milestones.length) return 0;
  return Math.round((completedMilestonesCount.value / props.milestones.length) * 100);
});

/**
 * Đánh giá điều kiện nộp/cập nhật minh chứng của cột mốc
 * Cho phép nộp/cập nhật đến hết cửa sổ trễ 3 ngày sau dueDate.
 * @param {Object} ms - Thông tin cột mốc
 * @returns {{ canSubmit: boolean, canUpdate: boolean, isCompleted: boolean, isNotStarted: boolean, reason: string }}
 */
function evaluateMilestoneEvidenceEligibility(ms) {
  if (!ms) return { canSubmit: false, canUpdate: false, isCompleted: false, isNotStarted: false, reason: 'Dữ liệu mốc không hợp lệ' };

  if (props.project?.status !== 'UNDER_MENTORSHIP') {
    return { canSubmit: false, canUpdate: false, isCompleted: Boolean(ms.evidence), isNotStarted: false, reason: 'Dự án không còn trong giai đoạn cố vấn.' };
  }

  const now = new Date();
  const dueTime = ms.dueDate ? new Date(ms.dueDate).getTime() : 0;
  const deadlineTime = dueTime + 3 * 24 * 60 * 60 * 1000;
  const isPastSubmissionDeadline = Boolean(dueTime && now.getTime() > deadlineTime);

  if (ms.startDate && new Date(ms.startDate).getTime() > now.getTime() && !ms.evidence) {
    return {
      canSubmit: false,
      canUpdate: false,
      isCompleted: false,
      isNotStarted: true,
      reason: `Cột mốc này chưa bắt đầu. Thời gian triển khai bắt đầu từ ngày ${formatDateOnly(ms.startDate)}.`,
    };
  }

  if (isPastSubmissionDeadline) {
    return {
      canSubmit: false,
      canUpdate: false,
      isCompleted: true,
      isNotStarted: false,
      reason: 'Đã quá cửa sổ cho phép nộp trễ 3 ngày sau hạn nộp.',
    };
  }

  if (ms.evidence || ms.status === 'Completed' || ms.status === 'DONE') {
    if (!isPastSubmissionDeadline) {
      return {
        canSubmit: true,
        canUpdate: true,
        isCompleted: false,
        isNotStarted: false,
        reason: 'Có thể cập nhật lại minh chứng trong cửa sổ nộp bài.',
      };
    }
  }

  // 2. Kiểm tra mốc CHƯA BẮT ĐẦU (theo ngày bắt đầu hoặc trạng thái Pending/PLANNED)
  if (ms.startDate) {
    const start = new Date(ms.startDate);
    if (start.getTime() > now.getTime()) {
      return {
        canSubmit: false,
        canUpdate: false,
        isCompleted: false,
        isNotStarted: true,
        reason: `Cột mốc này chưa bắt đầu. Thời gian triển khai bắt đầu từ ngày ${formatDateOnly(ms.startDate)}.`,
      };
    }
  }

  if (ms.status === 'Pending' || ms.status === 'PLANNED') {
    return {
      canSubmit: false,
      canUpdate: false,
      isCompleted: false,
      isNotStarted: true,
      reason: 'Cột mốc đang ở trạng thái Chờ triển khai, chưa thể nộp minh chứng.',
    };
  }

  // Mốc hợp lệ để nộp lần đầu
  return {
    canSubmit: true,
    canUpdate: false,
    isCompleted: false,
    isNotStarted: false,
    reason: '',
  };
}

function addLateWindow(value) {
  if (!value) return value;
  return new Date(new Date(value).getTime() + 3 * 24 * 60 * 60 * 1000);
}

function openEvidenceModal(ms) {
  const check = evaluateMilestoneEvidenceEligibility(ms);
  if (!check.canSubmit) {
    toastStore.add({ message: check.reason, type: 'warning' });
    return;
  }

  selectedMilestone.value = ms;
  isEvidenceModalOpen.value = true;
}

// Gửi hoặc Cập nhật Minh chứng
async function handleSubmitEvidence(evidencePayload) {
  if (!selectedMilestone.value) return;

  const check = evaluateMilestoneEvidenceEligibility(selectedMilestone.value);
  if (!check.canSubmit) {
    toastStore.add({ message: `Thao tác bị từ chối: ${check.reason}`, type: 'error' });
    isEvidenceModalOpen.value = false;
    return;
  }

  const isUpdate = Boolean(selectedMilestone.value?.evidence);
  isSubmitting.value = true;
  try {
    const res = await projectService.submitEvidence(
      props.projectId,
      selectedMilestone.value._id,
      evidencePayload
    );
    if (res?.success) {
      toastStore.add({
        message: isUpdate ? 'Cập nhật minh chứng mốc tiến độ thành công!' : 'Nộp minh chứng mốc tiến độ thành công!',
        type: 'success',
      });
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

// Helpers giao diện tái sử dụng từ studentProjectHelpers
const getMilestoneBadgeClass = getMilestoneStatusBadgeClass;
const getMilestoneLabel = getMilestoneStatusLabel;
const formatDateOnly = formatDateOnlyVi;
const formatDate = formatDateTimeVi;
</script>


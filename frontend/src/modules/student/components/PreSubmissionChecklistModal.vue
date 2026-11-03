<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
      <!-- TIÊU ĐỀ & NÚT ĐÓNG -->
      <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
        <h3 class="text-base font-bold text-[#0B1F4B]">Kiểm tra hồ sơ trước khi nộp chính thức</h3>
        <button
          type="button"
          @click="closeModal"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-[#4B5B7A]">
        Hệ thống kiểm tra 4 mục thông tin bắt buộc trong thuyết minh của nhóm trước khi gửi:
      </p>

      <!-- DANH SÁCH 4 TIÊU CHÍ KIỂM TRA -->
      <div class="space-y-2 text-xs">
        <div
          v-for="(item, key) in preSubmissionChecklist"
          :key="key"
          class="p-3 rounded-xl border flex items-center justify-between"
          :class="item.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'"
        >
          <span class="font-medium">{{ item.label }}</span>
          <span class="font-bold flex items-center gap-1">
            <CheckCircle2 v-if="item.passed" class="w-4 h-4 text-emerald-600" />
            <AlertCircle v-else class="w-4 h-4 text-rose-600" />
            <span>{{ item.passed ? 'Đạt' : 'Chưa điền' }}</span>
          </span>
        </div>
      </div>

      <!-- LƯU Ý HỘI ĐỒNG & BIÊN NHẬN SỐ -->
      <div class="p-3 bg-[#F1F7FF] rounded-xl text-xs text-[#0B1F4B] leading-relaxed">
        Sau khi nộp, đề tài sẽ được chuyển tới Hội đồng đánh giá và cấp <strong>Giấy xác nhận nộp bài điện tử</strong>.
      </div>

      <!-- CHÂN MODAL THAO TÁC -->
      <div class="pt-2 flex items-center justify-end gap-3 border-t border-[#E4ECF7]">
        <button
          type="button"
          @click="closeModal"
          class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
        >
          Quay lại bổ sung
        </button>

        <button
          type="button"
          @click="emit('confirm-submit')"
          :disabled="!isAllChecklistPassed || isSubmitting"
          class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] hover:bg-[#1d4ed8] text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ isSubmitting ? 'Đang gửi...' : 'Xác nhận nộp chính thức' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Modal rà soát Pre-submission Checklist trước khi nộp đề tài chính thức
 * Kiểm tra 4 mục thông tin bắt buộc theo quy chuẩn Phụ lục 1.
 */
import { computed } from 'vue';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: () => ({}),
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:isOpen', 'confirm-submit']);

function closeModal() {
  emit('update:isOpen', false);
}

const preSubmissionChecklist = computed(() => ({
  basicInfo: {
    label: '1. Phần 1. Thông tin cơ bản (Đề tài, Giảng viên hỗ trợ, Trưởng nhóm)',
    passed: Boolean(
      props.project.title?.trim() &&
      props.project.category?.trim() &&
      props.project.advisorInfo?.fullName?.trim() &&
      props.project.leaderInfo?.fullName?.trim()
    ),
  },
  objectives: {
    label: '2. Tóm tắt ý tưởng: 1. Mục tiêu ý tưởng/dự án',
    passed: Boolean(props.project.objectives && props.project.objectives.trim().length > 0),
  },
  abstract: {
    label: '3. Tóm tắt ý tưởng: 2. Mô tả ngắn gọn sản phẩm/dịch vụ & giá trị',
    passed: Boolean(props.project.abstract && props.project.abstract.trim().length > 0),
  },
  attachmentUrl: {
    label: '4. Đường dẫn (link) tài liệu thuyết minh đầy đủ theo mẫu Phụ lục 1',
    passed: Boolean(props.project.attachmentUrl && props.project.attachmentUrl.trim().startsWith('http')),
  },
}));

const isAllChecklistPassed = computed(() =>
  Object.values(preSubmissionChecklist.value).every((item) => item.passed)
);
</script>


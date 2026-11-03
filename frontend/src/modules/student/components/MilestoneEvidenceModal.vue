<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
      <!-- TIÊU ĐỀ & NÚT ĐÓNG -->
      <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
        <div>
          <h3 class="text-base font-bold text-[#0B1F4B]">
            {{ milestone?.evidence ? 'Cập nhật lại bài làm mốc tiến độ' : 'Gửi bài làm mốc tiến độ' }}
          </h3>
          <p class="text-xs text-[#4B5B7A] mt-0.5">
            {{ milestone?.title }} - Hạn nộp: <strong class="text-[#1E56D9]">{{ formatDateOnlyVi(milestone?.dueDate) }}</strong>
          </p>
        </div>
        <button
          type="button"
          @click="closeModal"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- BIỂU MẪU NHẬP ĐƯỜNG DẪN & GHI CHÚ BÀI LÀM -->
      <form @submit.prevent="handleSubmit" class="space-y-4 text-xs">
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
            @click="closeModal"
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
            <span>{{ isSubmitting ? 'Đang gửi...' : (milestone?.evidence ? 'Cập nhật bài làm' : 'Gửi bài làm') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * Modal nộp và cập nhật minh chứng kết quả mốc tiến độ của đề tài
 */
import { ref, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';
import { formatDateOnlyVi } from '@/modules/student/utils/studentProjectHelpers';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  milestone: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:isOpen', 'submit']);

const evidenceForm = ref({
  fileUrl: '',
  note: '',
});

// Đồng bộ form khi mở modal hoặc thay đổi cột mốc
watch(
  () => props.milestone,
  (newMilestone) => {
    evidenceForm.value = {
      fileUrl: newMilestone?.evidence?.fileUrl || '',
      note: newMilestone?.evidence?.note || '',
    };
  },
  { immediate: true }
);

function closeModal() {
  emit('update:isOpen', false);
}

function handleSubmit() {
  emit('submit', { ...evidenceForm.value });
}
</script>


<template>
  <div>
    <!-- 1. MODAL CHUYỂN VAI TRÒ TRƯỞNG NHÓM -->
    <div
      v-if="isTransferOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Chuyển vai trò Trưởng nhóm</h3>
          <button
            type="button"
            @click="emit('update:isTransferOpen', false)"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <p class="text-xs text-[#4B5B7A] leading-relaxed">
          Chuyển vai trò Trưởng nhóm đề tài <strong>{{ projectCode }}</strong> cho thành viên:
        </p>

        <div class="p-3 bg-[#F1F7FF] border border-[#C7D7F5] rounded-xl text-xs text-[#0B1F4B]">
          <p class="font-bold">{{ targetMember?.fullName }}</p>
          <p class="text-[11px] text-[#4B5B7A]">{{ targetMember?.email }} • MSSV: {{ targetMember?.studentId }}</p>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="emit('update:isTransferOpen', false)"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="emit('confirm-transfer')"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. MODAL XIN RỜI NHÓM -->
    <div
      v-if="isLeaveOpen"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E4ECF7] space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[#E4ECF7]">
          <h3 class="text-base font-bold text-[#0B1F4B]">Đơn xin rút khỏi nhóm đề tài</h3>
          <button
            type="button"
            @click="emit('update:isLeaveOpen', false)"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-[#0B1F4B]">
            Lý do xin rút khỏi nhóm <span class="text-rose-500">*</span>
          </label>
          <textarea
            v-model="leaveReasonInput"
            rows="4"
            maxlength="1000"
            placeholder="Nhập lý do xin rút khỏi nhóm (tối thiểu 10 ký tự)..."
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] focus:bg-white focus:outline-hidden focus:border-[#1E56D9]"
          ></textarea>
        </div>

        <div class="pt-3 border-t border-[#E4ECF7] flex items-center justify-end gap-3">
          <button
            type="button"
            @click="emit('update:isLeaveOpen', false)"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            @click="handleSubmitLeave"
            :disabled="isSubmitting || leaveReasonInput.trim().length < 10"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-40"
          >
            <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isSubmitting ? 'Đang gửi...' : 'Gửi đơn' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Các Modal hành động của Thành viên: Bàn giao quyền Trưởng nhóm & Đơn xin rút khỏi nhóm
 */
import { ref, watch } from 'vue';
import { X, Loader2 } from 'lucide-vue-next';

const props = defineProps({
  isTransferOpen: {
    type: Boolean,
    default: false,
  },
  targetMember: {
    type: Object,
    default: null,
  },
  projectCode: {
    type: String,
    default: '',
  },
  isLeaveOpen: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:isTransferOpen',
  'confirm-transfer',
  'update:isLeaveOpen',
  'submit-leave',
]);

const leaveReasonInput = ref('');

watch(
  () => props.isLeaveOpen,
  (open) => {
    if (open) {
      leaveReasonInput.value = '';
    }
  }
);

function handleSubmitLeave() {
  if (leaveReasonInput.value.trim().length >= 10) {
    emit('submit-leave', leaveReasonInput.value.trim());
  }
}
</script>


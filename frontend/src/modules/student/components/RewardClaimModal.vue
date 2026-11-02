<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
        @click.self="handleClose"
        role="dialog"
        aria-modal="true"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-98 translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-98 translate-y-1"
        >
          <div
            v-if="isOpen"
            class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform"
          >
            <!-- Header tối giản, không icon -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div class="min-w-0 pr-4">
                <h3 class="text-base font-bold text-[#0B1F4B] truncate">
                  Thông tin nhận giải thưởng
                </h3>
                <p class="text-xs text-slate-500 mt-0.5 truncate">
                  {{ project?.title }}
                  <span v-if="project?.award?.title"> - {{ project.award.title }}</span>
                </p>
              </div>
              <button
                type="button"
                @click="handleClose"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <!-- Form nội dung -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <!-- Thông báo hỗ trợ tinh gọn -->
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                Vui lòng cung cấp chính xác thông tin tài khoản ngân hàng của đại diện nhóm đề tài để Phòng Công tác Sinh viên và Ban Tổ chức thực hiện thủ tục chi trả giải thưởng.
              </div>

              <!-- Họ và tên người đại diện nhận -->
              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Họ tên người đại diện nhận <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.trim="form.representativeName"
                  type="text"
                  required
                  placeholder="Nhập họ và tên sinh viên..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] focus:bg-white bg-slate-50/50 focus:outline-hidden transition-all text-xs"
                />
              </div>

              <!-- Mã số sinh viên & Lớp -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">
                    Mã số sinh viên (MSSV) <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.trim="form.studentId"
                    type="text"
                    required
                    placeholder="VD: KTPM2311025"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] focus:bg-white bg-slate-50/50 focus:outline-hidden transition-all text-xs"
                  />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">
                    Lớp sinh hoạt <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.trim="form.className"
                    type="text"
                    required
                    placeholder="VD: KTPM0123"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] focus:bg-white bg-slate-50/50 focus:outline-hidden transition-all text-xs"
                  />
                </div>
              </div>

              <!-- Ngân hàng thụ hưởng -->
              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Ngân hàng thụ hưởng <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.bankName"
                  required
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#1E56D9] focus:outline-hidden transition-all text-xs"
                >
                  <option value="" disabled>-- Chọn ngân hàng thụ hưởng --</option>
                  <option v-for="bank in BANK_LIST" :key="bank" :value="bank">
                    {{ bank }}
                  </option>
                </select>
              </div>

              <!-- Số tài khoản nhận -->
              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Số tài khoản nhận <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.trim="form.bankAccountNumber"
                  type="text"
                  required
                  placeholder="Nhập số tài khoản ngân hàng"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] focus:bg-white bg-slate-50/50 focus:outline-hidden transition-all text-xs font-mono"
                />
              </div>

              <!-- Ô xác nhận cam kết sự thật & chịu trách nhiệm -->
              <div class="pt-1">
                <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    v-model="form.isConfirmed"
                    type="checkbox"
                    required
                    class="mt-0.5 rounded text-[#1E56D9] focus:ring-0 cursor-pointer"
                  />
                  <span class="text-[11px] text-slate-600 leading-relaxed select-none">
                    Tôi xác nhận mọi thông tin cung cấp hoàn toàn là sự thật và hoàn toàn chịu trách nhiệm trước Nhà trường và Pháp luật về tính chính xác của thông tin trên.
                  </span>
                </label>
              </div>

              <!-- Chân modal hành động -->
              <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="isSubmitting"
                  class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isSubmitting"
                  class="px-5 py-2 rounded-xl bg-[#1E56D9] text-white font-semibold hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer text-xs"
                >
                  {{ isSubmitting ? 'Đang lưu...' : 'Xác nhận thông tin' }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
  defaultUserInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:isOpen', 'submitted']);
const toastStore = useToastStore();

const isSubmitting = ref(false);

const BANK_LIST = [
  'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
  'Ngân hàng TMCP Quân đội (MB Bank)',
  'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
  'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
  'Ngân hàng Nông nghiệp và Phát triển Nông thôn (Agribank)',
  'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)',
  'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
  'Ngân hàng TMCP Á Châu (ACB)',
  'Ngân hàng TMCP Tiên Phong (TPBank)',
  'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',
  'Ngân hàng TMCP Quốc tế Việt Nam (VIB)',
  'Ngân hàng TMCP Phát triển TP.HCM (HDBank)',
  'Ngân hàng TMCP Phương Đông (OCB)',
  'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)',
  'Ngân hàng TMCP Nam Á (Nam A Bank)',
  'Ngân hàng số Cake by VPBank',
  'Ngân hàng số Timo by BVBank',
  'Khác (Ngân hàng khác)',
];

const form = ref({
  representativeName: '',
  studentId: '',
  className: '',
  bankName: '',
  bankAccountNumber: '',
  isConfirmed: false,
});

/**
 * Điền trước thông tin (Prefill) khi mở modal
 */
function populateFormData() {
  const existingClaim = props.project?.rewardClaim;
  if (existingClaim) {
    form.value = {
      representativeName: existingClaim.representativeName || '',
      studentId: existingClaim.studentId || '',
      className: existingClaim.className || '',
      bankName: existingClaim.bankName || '',
      bankAccountNumber: existingClaim.bankAccountNumber || '',
      isConfirmed: Boolean(existingClaim.isConfirmed),
    };
    return;
  }

  // Tự động lấy từ hồ sơ sinh viên nếu chưa kê khai
  form.value = {
    representativeName: props.defaultUserInfo?.fullName || props.project?.leaderInfo?.fullName || '',
    studentId: props.defaultUserInfo?.studentId || props.project?.leaderInfo?.studentId || '',
    className: props.defaultUserInfo?.className || props.project?.leaderInfo?.className || '',
    bankName: '',
    bankAccountNumber: '',
    isConfirmed: false,
  };
}

// Kiểm tra form hợp lệ
const isFormValid = computed(() => {
  return (
    form.value.representativeName.trim().length > 0 &&
    form.value.studentId.trim().length > 0 &&
    form.value.className.trim().length > 0 &&
    form.value.bankName.trim().length > 0 &&
    form.value.bankAccountNumber.trim().length >= 4 &&
    form.value.isConfirmed === true
  );
});

function handleClose() {
  emit('update:isOpen', false);
}

// Xử lý phím Escape để đóng modal mượt mà
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose();
  }
}

// Theo dõi trạng thái đóng/mở để khóa scroll và khởi tạo form
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      populateFormData();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const payload = {
      representativeName: form.value.representativeName.trim(),
      studentId: form.value.studentId.trim(),
      className: form.value.className.trim(),
      bankName: form.value.bankName,
      bankAccountNumber: form.value.bankAccountNumber.trim(),
      isConfirmed: form.value.isConfirmed,
    };

    const res = await projectService.saveRewardClaim(props.project._id, payload);
    if (res?.success) {
      toastStore.add({
        message: 'Cập nhật thông tin nhận giải thưởng thành công!',
        type: 'success',
      });
      emit('submitted', {
        projectId: props.project._id,
        rewardClaim: res.data?.rewardClaim || payload,
      });
      handleClose();
    }
  } catch (error) {
    toastStore.add({
      message: error?.message || 'Không thể lưu thông tin nhận thưởng. Vui lòng thử lại.',
      type: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>


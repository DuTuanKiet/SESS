<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      @click.self="handleClose"
    >
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <header class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="min-w-0 pr-4">
            <h3 class="text-base font-bold text-[#0B1F4B]">Thông tin nhận giải thưởng</h3>
            <p class="text-xs text-slate-500 mt-0.5 truncate">
              {{ project?.title }}<span v-if="project?.award?.prizeName || project?.award?.title"> · {{ project.award.prizeName || project.award.title }}</span>
            </p>
          </div>
          <button type="button" @click="handleClose" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" aria-label="Đóng">×</button>
        </header>

        <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <p class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
            Thông tin tài khoản chỉ được lưu trong hồ sơ kê khai riêng của dự án và chỉ trưởng nhóm có quyền xem, cập nhật.
          </p>

          <p v-if="loadError" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">{{ loadError }}</p>
          <p v-if="isLoading" class="py-4 text-center text-slate-500" role="status">Đang tải thông tin kê khai...</p>

          <template v-else>
            <div v-if="rewardClaim" class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              Trạng thái kê khai: <strong>{{ rewardClaim.status || 'PENDING' }}</strong>
              <span v-if="rewardClaim.submittedAt"> · {{ formatDate(rewardClaim.submittedAt) }}</span>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <p class="font-semibold text-slate-700">Thông tin sinh viên theo hồ sơ</p>
              <p class="text-slate-600">{{ defaultUserInfo?.fullName || 'Chưa có họ tên' }}</p>
              <p class="text-slate-500">MSSV: {{ defaultUserInfo?.studentId || '—' }} · Lớp: {{ defaultUserInfo?.className || '—' }}</p>
            </div>

            <label class="block font-semibold text-slate-700">
              Ngân hàng nhận thưởng <span class="text-rose-500">*</span>
              <input v-model.trim="form.bankName" type="text" required maxlength="160" autocomplete="organization"
                class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white focus:outline-hidden" />
            </label>

            <label class="block font-semibold text-slate-700">
              Số tài khoản <span class="text-rose-500">*</span>
              <input v-model.trim="form.accountNumber" type="text" required minlength="4" maxlength="64" autocomplete="off"
                class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white font-mono focus:outline-hidden" />
            </label>

            <label class="block font-semibold text-slate-700">
              Chủ tài khoản <span class="text-rose-500">*</span>
              <input v-model.trim="form.accountHolder" type="text" required maxlength="160" autocomplete="name"
                class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white focus:outline-hidden" />
            </label>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="block font-semibold text-slate-700">
                Mã số thuế <span class="font-normal text-slate-400">(không bắt buộc)</span>
                <input v-model.trim="form.taxCode" type="text" maxlength="32" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white focus:outline-hidden" />
              </label>
              <label class="block font-semibold text-slate-700">
                Số CCCD <span class="font-normal text-slate-400">(không bắt buộc)</span>
                <input v-model.trim="form.idCardNumber" type="text" maxlength="32" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white focus:outline-hidden" />
              </label>
            </div>

            <label class="block font-semibold text-slate-700">
              Ghi chú <span class="font-normal text-slate-400">(không bắt buộc)</span>
              <textarea v-model.trim="form.note" rows="2" maxlength="2000" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#1E56D9] bg-white focus:outline-hidden"></textarea>
            </label>

            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 cursor-pointer">
              <input v-model="form.acknowledged" type="checkbox" required class="mt-0.5 rounded text-[#1E56D9]" />
              <span class="text-[11px] text-slate-600 leading-relaxed">
                Tôi xác nhận thông tin kê khai là chính xác và chịu trách nhiệm về nội dung đã cung cấp.
              </span>
            </label>
          </template>

          <footer class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button type="button" @click="handleClose" :disabled="isSubmitting" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50">Đóng</button>
            <button v-if="!isLoading" type="submit" :disabled="!isFormValid || isSubmitting || Boolean(loadError)"
              class="px-5 py-2 rounded-xl bg-[#1E56D9] text-white font-semibold hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isSubmitting ? 'Đang lưu...' : 'Lưu kê khai' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import projectService from '@/services/projectService';
import { useToastStore } from '@/stores/toast';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  project: { type: Object, default: null },
  defaultUserInfo: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:isOpen', 'submitted']);
const toastStore = useToastStore();
const isLoading = ref(false);
const isSubmitting = ref(false);
const loadError = ref('');
const rewardClaim = ref(null);
const form = ref({
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  taxCode: '',
  idCardNumber: '',
  note: '',
  acknowledged: false,
});

const isFormValid = computed(() => Boolean(
  form.value.bankName.trim()
  && form.value.accountNumber.trim().length >= 4
  && form.value.accountHolder.trim()
  && form.value.acknowledged,
));

function resetForm() {
  form.value = {
    bankName: '',
    accountNumber: '',
    accountHolder: props.defaultUserInfo?.fullName || '',
    taxCode: '',
    idCardNumber: '',
    note: '',
    acknowledged: false,
  };
  rewardClaim.value = null;
  loadError.value = '';
}

async function loadClaim() {
  if (!props.project?._id) return;
  isLoading.value = true;
  resetForm();
  try {
    const response = await projectService.getRewardClaim(props.project._id);
    rewardClaim.value = response?.data?.rewardClaim || null;
    if (rewardClaim.value) {
      form.value = {
        bankName: rewardClaim.value.bankName || '',
        accountNumber: rewardClaim.value.accountNumber || rewardClaim.value.bankAccountNumber || '',
        accountHolder: rewardClaim.value.accountHolder || rewardClaim.value.representativeName || props.defaultUserInfo?.fullName || '',
        taxCode: rewardClaim.value.taxCode || '',
        idCardNumber: rewardClaim.value.idCardNumber || '',
        note: rewardClaim.value.note || '',
        acknowledged: false,
      };
    }
  } catch (error) {
    loadError.value = error?.message || 'Không thể tải thông tin kê khai nhận thưởng.';
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  emit('update:isOpen', false);
}

function handleKeydown(event) {
  if (event.key === 'Escape' && props.isOpen) handleClose();
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}

watch(() => [props.isOpen, props.project?._id], ([isOpen]) => {
  if (isOpen) loadClaim();
});

watch(() => props.isOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value || loadError.value || !props.project?._id) return;
  isSubmitting.value = true;
  try {
    const response = await projectService.saveRewardClaim(props.project._id, {
      bankName: form.value.bankName.trim(),
      accountNumber: form.value.accountNumber.trim(),
      accountHolder: form.value.accountHolder.trim(),
      taxCode: form.value.taxCode.trim(),
      idCardNumber: form.value.idCardNumber.trim(),
      note: form.value.note.trim(),
      acknowledged: form.value.acknowledged,
    });
    const savedClaim = response?.data?.rewardClaim;
    if (!savedClaim) throw new Error('Máy chủ chưa trả về hồ sơ kê khai đã lưu.');
    rewardClaim.value = savedClaim;
    toastStore.add({ message: 'Backend đã lưu thông tin nhận thưởng.', type: 'success' });
    emit('submitted', { projectId: props.project._id, rewardClaim: savedClaim });
    handleClose();
  } catch (error) {
    toastStore.add({ message: error?.message || 'Không thể lưu thông tin nhận thưởng.', type: 'error' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

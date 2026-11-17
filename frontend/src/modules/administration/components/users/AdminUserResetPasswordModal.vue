<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Mật khẩu cũ sẽ bị vô hiệu hóa ngay lập tức và các phiên đăng nhập hiện tại của người dùng sẽ
        bị thu hồi.
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">Mật khẩu tạm mới</label>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="form.newPassword"
            type="text"
            required
            class="min-w-[180px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
          />
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="handleGeneratePassword"
          >
            Tạo ngẫu nhiên
          </button>
          <button
            type="button"
            class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="handleCopyPassword"
          >
            Sao chép
          </button>
        </div>
        <p class="mt-1 text-[11px] leading-relaxed text-slate-400">
          Tối thiểu 8 ký tự, nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
        <input
          v-model="form.mustChangeOnNextLogin"
          type="checkbox"
          class="h-4 w-4 accent-[#1E56D9]"
        />
        <span>Bắt buộc người dùng đổi mật khẩu ngay ở lần đăng nhập kế tiếp</span>
      </label>

      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
        <input v-model="form.notifyEmail" type="checkbox" class="h-4 w-4 accent-[#1E56D9]" />
        <span>Gửi hướng dẫn mật khẩu tạm qua email nhà trường</span>
      </label>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Lý do cấp lại mật khẩu
        </label>
        <textarea
          v-model="form.reason"
          rows="3"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#1E56D9] focus:ring-2 focus:ring-[#1E56D9]/15"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Cấp lại mật khẩu
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useToastStore } from '@/stores/toast';
import { generateTempPassword } from '@/modules/administration/utils/directorySpreadsheet';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);
const toastStore = useToastStore();

const form = reactive({
  newPassword: '',
  mustChangeOnNextLogin: true,
  notifyEmail: true,
  reason: 'Sinh viên / giảng viên quên mật khẩu và đề nghị hỗ trợ qua Phòng KHCN',
});

const modalTitle = computed(() =>
  props.user ? `Cấp lại mật khẩu — ${props.user.name}` : 'Cấp lại mật khẩu'
);

const modalSubtitle = computed(() =>
  props.user
    ? `${props.user.email} • Đổi gần nhất: ${props.user.passwordUpdatedAt || 'Chưa ghi nhận'}`
    : ''
);

watch(
  () => [props.isOpen, props.user],
  ([open]) => {
    if (open) {
      form.newPassword = generateTempPassword();
      form.mustChangeOnNextLogin = true;
      form.notifyEmail = true;
      form.reason = 'Sinh viên / giảng viên quên mật khẩu và đề nghị hỗ trợ qua Phòng KHCN';
    }
  },
  { immediate: true }
);

function handleGeneratePassword() {
  form.newPassword = generateTempPassword();
  toastStore.add({
    message: 'Đã tạo mật khẩu ngẫu nhiên đáp ứng độ phức tạp.',
    type: 'info',
  });
}

function handleCopyPassword() {
  const val = String(form.newPassword || '').trim();
  if (!val) {
    toastStore.add({ message: 'Chưa có mật khẩu để sao chép.', type: 'warning' });
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(val).catch(() => {});
  }
  toastStore.add({ message: `Đã sao chép mật khẩu tạm: ${val}`, type: 'success' });
}

function handleSubmit() {
  emit('submit', {
    newPassword: form.newPassword,
    mustChangeOnNextLogin: form.mustChangeOnNextLogin,
    notifyEmail: form.notifyEmail,
    reason: form.reason,
  });
}
</script>

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
    <div class="space-y-3 text-xs">
      <p
        v-if="skippedProtected"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"
      >
        Lưu ý: Tài khoản Quản trị viên bạn đang đăng nhập sẽ được tự động giữ nguyên để đảm bảo an
        toàn.
      </p>

      <div
        v-if="eligible.length"
        class="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-[#F8FAFC] p-3"
      >
        <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Danh sách áp dụng ({{ eligible.length }}):
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="u in eligible"
            :key="u.id"
            class="flex items-center justify-between gap-2"
          >
            <span class="font-medium text-slate-800">{{ u.name }}</span>
            <span class="text-slate-500">{{ u.email }}</span>
          </li>
        </ul>
      </div>

      <p v-else class="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
        Không có tài khoản nào cần đổi trạng thái trong lựa chọn hiện tại.
      </p>

      <div>
        <p class="mb-1.5 text-[11px] font-semibold text-slate-600">
          Chọn nhanh lý do (hoặc nhập bên dưới):
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="qr in quickReasons"
            :key="qr"
            type="button"
            class="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
            @click="reason = qr"
          >
            {{ qr }}
          </button>
        </div>
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Lý do thực hiện (lưu Nhật ký kiểm toán)
        </label>
        <textarea
          v-model="reason"
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
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="isLock ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#1E56D9] hover:bg-[#1d4ed8]'"
      >
        {{ isLock ? 'Xác nhận khóa' : 'Xác nhận mở khóa' }}
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  targets: {
    type: Array,
    default: () => [],
  },
  forcedStatus: {
    type: String,
    default: '',
  },
  skippedProtected: {
    type: Boolean,
    default: false,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'submit']);
const reason = ref('');

const nextStatus = computed(() => {
  if (props.forcedStatus) return props.forcedStatus;
  const first = props.targets[0];
  return first?.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
});

const isLock = computed(() => nextStatus.value === 'SUSPENDED');

const eligible = computed(() =>
  props.targets.filter((u) => u.status !== nextStatus.value)
);

const quickReasons = computed(() =>
  isLock.value
    ? [
        'Vi phạm quy chế cuộc thi',
        'Sinh viên đã tốt nghiệp / bảo lưu',
        'Theo đề nghị của Khoa / Đơn vị',
      ]
    : ['Đã xác minh lại thông tin người dùng', 'Hết thời hạn tạm khóa']
);

const modalTitle = computed(() => {
  const first = props.targets[0];
  if (isLock.value) {
    return props.targets.length > 1
      ? `Xác nhận tạm khóa ${eligible.value.length} tài khoản`
      : `Xác nhận tạm khóa — ${first?.name || ''}`;
  }
  return props.targets.length > 1
    ? `Xác nhận mở khóa ${eligible.value.length} tài khoản`
    : `Xác nhận mở khóa — ${first?.name || ''}`;
});

const modalSubtitle = computed(() =>
  isLock.value
    ? 'Tài khoản bị khóa sẽ bị đăng xuất ngay lập tức khỏi mọi thiết bị'
    : 'Người dùng sẽ có thể đăng nhập lại bình thường vào hệ thống'
);

watch(
  () => props.isOpen,
  (open) => {
    if (open) reason.value = '';
  }
);

function handleSubmit() {
  emit('submit', {
    forcedStatus: nextStatus.value,
    reason: reason.value,
    hasEligible: eligible.value.length > 0,
  });
}
</script>

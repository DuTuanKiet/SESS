<template>
  <AdminModal
    :is-open="isOpen"
    :title="modalTitle"
    subtitle="Thao tác này sẽ được lưu vào Nhật ký kiểm toán hệ thống"
    max-width="lg"
    is-form
    :close-disabled="isSubmitting"
    @close="emit('close')"
    @submit="emit('confirm')"
  >
    <div class="space-y-3 text-xs">
      <p
        v-if="linkedCount"
        class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"
      >
        <strong>Lưu ý:</strong> Có <strong>{{ linkedCount }}</strong> người trong số này hiện đã có
        tài khoản đăng nhập. Sau khi xóa khỏi danh sách hợp lệ, họ có thể bị hạn chế khi đăng nhập
        hoặc chấm điểm lại.
      </p>

      <div class="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
        <ul class="space-y-1.5">
          <li
            v-for="item in targets"
            :key="item.id"
            class="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1 last:border-0 last:pb-0"
          >
            <span class="font-semibold text-slate-800">
              {{ kind === 'students' ? item.fullName : item.name }}
              <span class="font-mono text-[11px] text-slate-500">
                ({{ kind === 'students' ? item.studentId : item.staffCode || '—' }})
              </span>
            </span>
            <span class="text-slate-500">{{ item.email }}</span>
          </li>
        </ul>
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
        :disabled="isSubmitting || !targets.length"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Xóa ({{ targets.length }})
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import { computed } from 'vue';
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  kind: {
    type: String,
    default: 'students',
  },
  targets: {
    type: Array,
    default: () => [],
  },
  linkedCount: {
    type: Number,
    default: 0,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'confirm']);

const modalTitle = computed(() => {
  const count = props.targets.length;
  if (props.kind === 'students') {
    return count > 1
      ? `Xóa ${count} sinh viên khỏi danh sách hợp lệ`
      : 'Xác nhận xóa sinh viên khỏi danh sách';
  }
  return count > 1
    ? `Xóa ${count} giám khảo khỏi danh sách duyệt`
    : 'Xác nhận xóa giám khảo khỏi danh sách';
});
</script>

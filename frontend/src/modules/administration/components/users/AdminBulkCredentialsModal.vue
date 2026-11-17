<template>
  <AdminModal
    :is-open="isOpen"
    :title="`Đã cấp nhanh ${issued.length} tài khoản mới`"
    subtitle="Tải bảng tài khoản và mật khẩu tạm ban đầu để gửi cho người dùng"
    max-width="3xl"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p>
            Hệ thống đã khởi tạo <strong>{{ issued.length }}</strong> tài khoản ở trạng thái Hoạt
            động và gắn cờ bắt buộc đổi mật khẩu ở lần đầu đăng nhập.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg bg-[#1E56D9] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
              @click="emit('export', 'xlsx')"
            >
              Tải bảng mật khẩu tạm (.xlsx)
            </button>
            <button
              type="button"
              class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
              @click="emit('export', 'csv')"
            >
              Tải bản .csv
            </button>
          </div>
        </div>
      </div>

      <div class="max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-xs">
          <thead class="sticky top-0">
            <tr class="border-b border-slate-100 bg-[#F8FAFC] text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th class="whitespace-nowrap px-3 py-2">Họ tên</th>
              <th class="whitespace-nowrap px-3 py-2">Email</th>
              <th class="whitespace-nowrap px-3 py-2">Vai trò</th>
              <th class="whitespace-nowrap px-3 py-2">Mật khẩu tạm</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in issued"
              :key="item.email"
              class="border-b border-slate-100 last:border-0"
            >
              <td class="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                {{ item.name }}
                <span class="font-mono text-[11px] text-slate-400">{{ item.code }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-2 text-slate-600">{{ item.email }}</td>
              <td class="whitespace-nowrap px-3 py-2">{{ item.role }}</td>
              <td class="whitespace-nowrap px-3 py-2 font-mono font-semibold text-[#1E56D9]">
                {{ item.tempPassword }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1E56D9] hover:text-[#1E56D9]"
        @click="emit('close')"
      >
        Đóng
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  issued: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'export']);
</script>

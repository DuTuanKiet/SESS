<template>
  <AdminModal
    :is-open="isOpen"
    title="Nhập tiêu chí từ Excel / CSV"
    subtitle="Nạp nhanh danh sách tiêu chí và trọng số từ bảng tính Excel hoặc tệp CSV"
    max-width="lg"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <!-- Vùng thả tệp (Dropzone UI) -->
      <div
        class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition hover:border-[#1E56D9]/50 hover:bg-[#F1F7FF]/30 cursor-pointer"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p class="text-xs font-semibold text-slate-700">
          Kéo thả tệp bảng tính vào đây, hoặc
          <span class="text-[#1E56D9] underline">chọn từ máy tính</span>
        </p>
        <p class="mt-1 text-[11px] text-slate-400">
          Hỗ trợ định dạng .xlsx, .xls, .csv (dung lượng tối đa 5MB)
        </p>
      </div>

      <!-- Hướng dẫn định dạng cột mẫu -->
      <div class="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-slate-700">Cấu trúc các cột trong file mẫu:</span>
          <button
            type="button"
            class="text-[#1E56D9] font-medium hover:underline text-[11px]"
            @click="rubricsStore.downloadTemplate"
          >
            Tải file mẫu (.csv)
          </button>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-600">
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">STT</span>
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">Tên tiêu chí</span>
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">Mô tả</span>
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">Trọng số (%)</span>
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">Điểm tối thiểu</span>
          <span class="rounded bg-white px-2 py-0.5 border border-slate-200">Điểm tối đa</span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400">
          * Tổng trọng số (%) của các tiêu chí trong tệp phải bằng 100% để đủ điều kiện kích hoạt.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="emit('close')"
      >
        Hủy
      </button>
      <button
        type="button"
        disabled
        title="Giai đoạn xem trước giao diện: Chưa nạp file thực tế"
        class="rounded-xl bg-[#1E56D9] px-4 py-2 text-xs font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
      >
        Nhập dữ liệu
      </button>
    </template>
  </AdminModal>
</template>

<script setup>
import AdminModal from '@/modules/administration/common/components/ui/AdminModal.vue';
import { useAdminRubricsStore } from '@/modules/administration/stores/useAdminRubricsStore';

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  targetRubricId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['close']);
const rubricsStore = useAdminRubricsStore();
</script>

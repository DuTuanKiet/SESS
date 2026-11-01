<template>
  <!-- NỘI DUNG MỤC 3: XÁC NHẬN NỘP BÀI & LỊCH SỬ -->
  <section class="space-y-6">
    <div
      v-if="project.digitalReceiptHash"
      class="bg-[#F8FBFF] rounded-2xl border border-[#C7D7F5] p-6 space-y-3"
    >
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-5 h-5 text-[#1E56D9]" />
          <h3 class="text-base font-bold text-[#0B1F4B]">Giấy xác nhận nộp hồ sơ đề tài điện tử</h3>
        </div>
        <span class="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đã xác nhận hợp lệ
        </span>
      </div>

      <p class="text-xs text-[#4B5B7A]">
        Mã xác nhận điện tử chứng nhận đề tài của nhóm bạn đã được hệ thống ghi nhận thành công:
      </p>

      <div class="p-3 bg-white rounded-xl border border-[#E4ECF7] font-mono text-xs break-all text-[#0B1F4B] select-all">
        {{ project.digitalReceiptHash }}
      </div>

      <div class="flex items-center justify-between text-xs text-[#4B5B7A] pt-1 flex-wrap gap-2">
        <span>Thời điểm nộp: {{ formatDate(project.digitalReceiptTimestamp) }}</span>
        <button
          type="button"
          @click="handleDownloadReceipt"
          class="inline-flex items-center gap-1.5 font-semibold text-[#1E56D9] hover:underline cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Tải giấy xác nhận nộp đề tài (PDF)</span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-[#E4ECF7] p-6 shadow-sm space-y-4">
      <h3 class="text-base font-bold text-[#0B1F4B]">Lịch sử các lần nộp hồ sơ</h3>
      <div class="space-y-3">
        <div
          v-for="rev in revisions"
          :key="rev._id"
          class="p-4 rounded-xl border border-[#E4ECF7] space-y-1.5 bg-[#F8FBFF]"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-[#0B1F4B]">Bản nộp lần {{ rev.versionNumber }}</span>
            <span class="text-[#4B5B7A]">{{ formatDate(rev.submittedAt) }}</span>
          </div>
          <p class="text-xs text-[#4B5B7A] line-clamp-2">
            {{ rev.snapshotData?.abstract || rev.snapshotData?.title }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ShieldCheck, Download } from 'lucide-vue-next';
import { useToastStore } from '@/stores/toast';

/**
 * Tab 3: Giấy xác nhận nộp bài điện tử & Lịch sử các lần nộp hồ sơ
 */
defineProps({
  project: {
    type: Object,
    required: true,
  },
  revisions: {
    type: Array,
    default: () => [],
  },
});

const toastStore = useToastStore();

function handleDownloadReceipt() {
  toastStore.add({ message: 'Đang chuẩn bị file Biên nhận số PDF...', type: 'info' });
}

function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>


<template>
  <div
    v-if="invitations.length > 0"
    class="bg-[#F1F7FF] border border-[#C7D7F5] rounded-2xl p-5 sm:p-6 space-y-4"
  >
    <!-- TIÊU ĐỀ KHỐI LỜI MỜI -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-[#1E56D9] text-white flex items-center justify-center shrink-0">
          <Mail class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-[#0B1F4B]">Lời mời tham gia nhóm đề tài</h3>
          <p class="text-xs text-[#4B5B7A]">Bạn nhận được {{ invitations.length }} lời mời cùng thực hiện đề tài</p>
        </div>
      </div>
    </div>

    <!-- DANH SÁCH CÁC LỜI MỜI -->
    <div class="space-y-3">
      <div
        v-for="inv in invitations"
        :key="inv._id"
        class="bg-white rounded-xl p-4 border border-[#E4ECF7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2 text-xs text-[#4B5B7A]">
            <span class="font-bold text-[#1E56D9]">{{ inv.projectCode }}</span>
            <span>•</span>
            <span>{{ inv.category || 'Chưa phân loại' }}</span>
          </div>
          <h4 class="text-sm font-bold text-[#0B1F4B] truncate">{{ inv.projectTitle }}</h4>
          <p class="text-xs text-[#4B5B7A]">
            Người mời: <strong class="text-[#0B1F4B]">{{ inv.inviterName }}</strong> ({{ inv.inviterEmail }})
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            @click="emit('reject', inv)"
            :disabled="isResponding"
            class="px-4 py-2 rounded-full text-xs font-medium text-[#4B5B7A] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Từ chối
          </button>
          <button
            type="button"
            @click="emit('accept', inv)"
            :disabled="isResponding"
            class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#1E56D9] text-white hover:bg-[#1d4ed8] transition-all cursor-pointer disabled:opacity-50"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Đồng ý tham gia</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Khối hiển thị các lời mời tham gia nhóm đề tài gửi đến sinh viên
 */
import { Mail, Check } from 'lucide-vue-next';

defineProps({
  invitations: {
    type: Array,
    default: () => [],
  },
  isResponding: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['accept', 'reject']);
</script>


<template>
  <div class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
    <div class="px-8 py-7 border-b border-[#E4ECF7]">
      <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">Lịch sử hướng dẫn các dự án</h2>
      <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Các dự án bạn đã / đang làm giảng viên hướng dẫn</p>
    </div>
    <div v-if="loading" class="p-12 space-y-4">
      <div class="flex items-start gap-4">
        <SkeletonLoader type="avatar" :height="48" :width="48" border-radius="9999" />
        <div class="flex-1 space-y-2">
          <SkeletonLoader type="text" :height="24" :width="60" />
          <SkeletonLoader type="text" :height="16" :width="40" />
        </div>
      </div>
      <div v-for="i in 3" :key="i" class="space-y-4">
        <SkeletonLoader type="text" :height="16" :width="70" />
        <SkeletonLoader type="text" :height="14" :width="50" />
        <SkeletonLoader type="text" :height="14" :width="40" />
        <SkeletonLoader type="badge" :height="24" :width="56" border-radius="9999" />
      </div>
    </div>
    <div v-else-if="history.length === 0" class="p-12">
      <EmptyState :icon="Award" title="Chưa có lịch sử hướng dẫn" description="Khi bạn bắt đầu hướng dẫn các nhóm sinh viên, các dự án và thành tích sẽ được ghi nhận tại đây." iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]" />
    </div>
    <div v-else class="overflow-hidden">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-[#F8FBFF]">
            <th class="px-8 py-4 text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider border-b border-[#E4ECF7]">Tên dự án</th>
            <th class="px-8 py-4 text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider border-b border-[#E4ECF7]">Sinh viên chủ trì</th>
            <th class="px-8 py-4 text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider border-b border-[#E4ECF7]">Giai đoạn đạt được</th>
            <th class="px-8 py-4 text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider border-b border-[#E4ECF7]">Thành tích</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E4ECF7]">
          <tr v-for="h in history" :key="h.id || h._id" class="hover:bg-[#F8FBFF]/60 transition-colors">
            <td class="px-8 py-5 text-sm text-[#0B1F4B] font-medium">{{ h.projectName || h.name || h.title || "—" }}</td>
            <td class="px-8 py-5 text-sm text-[#6B7B9A]">{{ h.teamLeader || h.leaderName || "—" }}</td>
            <td class="px-8 py-5 text-sm text-[#6B7B9A]">{{ h.stage || h.phase || "—" }}</td>
            <td class="px-8 py-5">
              <span class="inline-flex items-center rounded-full bg-[#1E56D9]/10 px-2.5 py-1 text-[10px] font-semibold text-[#1E56D9] uppercase tracking-wider">{{ h.award || h.prize || "Đang thực hiện" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Award } from "lucide-vue-next"
import EmptyState from "@/modules/mentoring/common/components/EmptyState.vue"
import SkeletonLoader from "@/modules/mentoring/common/components/SkeletonLoader.vue"

defineProps({
  history: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

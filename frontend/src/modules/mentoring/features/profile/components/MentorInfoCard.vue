<template>
  <div class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
    <div class="px-8 py-7 border-b border-[#E4ECF7]">
      <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">Thông tin giảng viên</h2>
      <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Hồ sơ công chức tại Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</p>
    </div>
    <div class="px-8 pb-7">
      <div class="flex flex-col lg:flex-row items-center gap-8">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B192C]/5 shrink-0">
          <UserCircle class="h-8 w-8 stroke-[1.5] text-[#0B192C]" />
        </div>
        <div class="flex-1 space-y-2">
          <h2 class="text-2xl font-bold text-[#0B1F4B] leading-none">{{ profile.fullName || profile.name || "Giảng viên" }}</h2>
          <p class="text-sm font-medium text-[#1E56D9] leading-none">{{ profile.position || profile.role || "Giảng viên cố vấn" }}</p>
          <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed max-w-md">{{ profile.bio || "Chưa có mô tả bổ sung." }}</p>
        </div>
      </div>
      <div class="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProfileStat label="Mã cán bộ / giảng viên" :value='profile.code || profile.mentorCode || profile.employeeId || "—"' />
        <ProfileStat label="Email trường" :value='profile.email || "—"' />
        <ProfileStat label="Khoa / Bộ môn" :value='profile.department || profile.faculty || profile.major || "—"' />
        <ProfileStat label="Số điện thoại" :value='profile.phone || profile.phoneNumber || "—"' />
      </div>
    </div>
  </div>
</template>

<script setup>
import { UserCircle } from "lucide-vue-next"
import ProfileStat from "@/modules/mentoring/features/profile/components/ProfileStat.vue"

defineProps({
  profile: {
    type: Object,
    default: () => ({})
  }
})
</script>

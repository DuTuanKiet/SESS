<template>
  <header class="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
    <div class="max-w-[1400px] mx-auto px-8 h-full flex items-center justify-between">
      <div class="flex items-center gap-3">
        <p class="text-sm text-slate-500">Không gian làm việc <span class="text-slate-300 mx-1">/</span> Giảng viên cố vấn</p>
        <span class="text-[11px] font-medium text-[#0F4C81] bg-[#F0F6FF] px-2 py-0.5 rounded">Đợt thi SESS 2026</span>
      </div>
      <div class="flex items-center gap-4">
        <RouterLink to="/advisor/notifications" class="text-slate-500 hover:text-[#0F4C81]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </RouterLink>
        <div class="h-5 w-px bg-slate-200"></div>
        <div class="flex items-center gap-3">
          <div class="text-right leading-tight">
            <p class="text-sm font-semibold text-[#0F172A]">{{ displayName }}</p>
            <p class="text-[11px] text-slate-500">Giảng viên cố vấn</p>
          </div>
          <button @click="handleLogout" class="text-xs font-medium text-slate-600 hover:text-[#0F4C81] border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">Đăng xuất</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue"
import { RouterLink, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore"
const router = useRouter()
const authStore = useAuthStore()
const displayName = computed(() => {
  const u = authStore.user
  return u?.fullName || u?.name || (u?.email ? u.email.split("@")[0] : "Giảng viên")
})
const handleLogout = () => {
  try { authStore.logout() } catch (e) {}
  try { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); sessionStorage.clear() } catch (e) {}
  router.replace("/")
}
</script>
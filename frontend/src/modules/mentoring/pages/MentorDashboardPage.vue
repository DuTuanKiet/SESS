<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div v-if="avatarUrl" class="h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_18px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70">
          <img :src="avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
        </div>
        <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-[0_10px_22px_-14px_rgba(79,70,229,0.75)]">{{ initials }}</div>
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-bold tracking-tight text-[#0f172a] sm:text-2xl">{{ displayName }}</h1>
          <span class="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Cố vấn chuyên môn SESS - CTUT</span>
          <div class="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-slate-600 sm:grid-cols-2">
            <p><span class="text-slate-400">MSCB:</span> <span class="font-medium text-slate-800">{{ employeeId }}</span></p>
            <p><span class="text-slate-400">Khoa/Bộ môn:</span> <span class="font-medium text-slate-800">{{ department }}</span></p>
            <p class="truncate"><span class="text-slate-400">Email:</span> <span class="font-medium text-slate-800">{{ email }}</span></p>
            <p><span class="text-slate-400">Điện thoại:</span> <span class="font-medium text-slate-800">{{ phone }}</span></p>
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section class="rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] lg:col-span-8">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
          <div class="flex items-center gap-2"><span class="h-5 w-1 rounded-full bg-indigo-600"></span><h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Đề tài & Nhóm sinh viên phụ trách</h2></div>
          <div class="flex items-center gap-2">
            <RouterLink to="/advisor/mentoring" class="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_-14px_rgba(79,70,229,0.8)] transition hover:-translate-y-px hover:bg-indigo-500">+ Góp ý nhanh</RouterLink>
            <button @click="fetchData" class="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">Làm mới</button>
            <RouterLink to="/advisor/projects" class="rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50">Xem tất cả</RouterLink>
          </div>
        </div>
        <div class="p-5 sm:p-6">
          <div v-if="loading" class="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 text-sm text-slate-500">Đang tải dữ liệu...</div>
          <div v-else-if="projects.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 py-10 text-center">
            <svg class="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p class="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">Chưa có nhóm sinh viên được phân công hướng dẫn. Hệ thống sẽ cập nhật khi khoa hoàn tất phân bổ đề tài.</p>
            <button @click="fetchData" class="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">Làm mới dữ liệu</button>
          </div>
          <div v-else class="space-y-3">
            <div v-for="p in projects.slice(0, 6)" :key="p.id || p._id" class="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200/70 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <p class="font-semibold tracking-tight text-slate-900">{{ p.name || p.title }}</p>
                <p class="mt-1 text-xs text-slate-500">Nhóm: {{ teamNameOf(p) }}</p>
                <p class="mt-1 text-xs text-slate-400">Mã: {{ p.code || p.projectCode || '—' }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200/70">{{ p.status || 'Đang thực hiện' }}</span>
                <RouterLink :to="`/advisor/projects/${p.id || p._id}/timeline`" class="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50">Xem tiến độ</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="space-y-6 lg:col-span-4">
        <section class="rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
          <div class="flex items-center justify-between border-b border-slate-200/60 px-5 py-4">
            <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Nhắc việc & Thông báo</h2>
            <RouterLink to="/advisor/notifications" class="text-xs font-semibold text-indigo-700 hover:text-indigo-600">Tất cả</RouterLink>
          </div>
          <div class="space-y-3 p-5">
            <div v-if="notifLoading" class="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 text-sm text-slate-500">Đang tải thông báo...</div>
            <template v-else-if="notifications.length > 0">
              <div v-for="n in notifications.slice(0, 5)" :key="n._id || n.id" class="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4">
                <div class="flex items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset" :class="n.read || n.isRead ? 'bg-slate-100 text-slate-600 ring-slate-200/70' : 'bg-indigo-50 text-indigo-700 ring-indigo-100'">{{ n.read || n.isRead ? 'Đã đọc' : 'Mới' }}</span>
                  <span class="text-[10px] text-slate-400">{{ formatDate(n.createdAt) }}</span>
                </div>
                <p class="mt-2 text-sm text-slate-700">{{ n.title || n.content }}</p>
              </div>
            </template>
            <template v-else>
              <div class="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4"><div class="flex items-center gap-2"><span class="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">Tiến độ</span><span class="text-[10px] text-slate-400">Hôm nay</span></div><p class="mt-2 text-sm text-slate-700">Rà soát kế hoạch thực hiện (Timeline) của các nhóm sinh viên.</p><RouterLink to="/advisor/timeline" class="mt-2 inline-block text-xs font-semibold text-indigo-700">Kiểm tra ngay</RouterLink></div>
              <div class="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4"><div class="flex items-center gap-2"><span class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100">Đánh giá</span><span class="text-[10px] text-slate-400">Tuần này</span></div><p class="mt-2 text-sm text-slate-700">Gửi nhận xét chuyên môn định kỳ trước hạn báo cáo giữa kỳ.</p><RouterLink to="/advisor/mentoring" class="mt-2 inline-block text-xs font-semibold text-indigo-700">Vào sổ đánh giá</RouterLink></div>
              <div class="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-4"><div class="flex items-center gap-2"><span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200/70">Hồ sơ</span><span class="text-[10px] text-slate-400">Đang chờ</span></div><p class="mt-2 text-sm text-slate-700">Cập nhật thông tin học hàm, học vị và lĩnh vực cố vấn.</p><RouterLink to="/advisor/profile" class="mt-2 inline-block text-xs font-semibold text-indigo-700">Cập nhật</RouterLink></div>
            </template>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
          <div class="mb-3 flex items-center gap-2"><span class="h-5 w-1 rounded-full bg-indigo-600"></span><h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Hỗ trợ & Tài liệu Cố vấn</h2></div>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center justify-between rounded-xl border border-slate-200/60 px-3 py-2.5 transition hover:bg-slate-50"><span class="text-slate-700">Quy chế hướng dẫn đề tài SESS 2026</span><a href="#" class="text-xs font-semibold text-indigo-700">Tải PDF</a></li>
            <li class="flex items-center justify-between rounded-xl border border-slate-200/60 px-3 py-2.5 transition hover:bg-slate-50"><span class="text-slate-700">Biểu mẫu nhận xét & chấm điểm mẫu</span><a href="#" class="text-xs font-semibold text-indigo-700">Xem</a></li>
            <li class="rounded-xl border border-slate-200/60 bg-slate-50/40 px-3 py-2.5"><p class="font-medium text-slate-700">Hỗ trợ kỹ thuật từ BTC</p><p class="mt-1 text-xs text-slate-500">Hotline: 0292.38xx.xxx • Email: hotro.sess@ctut.edu.vn</p></li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { RouterLink } from "vue-router"
import { useAuthStore } from "@/stores/authStore"
import mentorService from "../common/services/mentorService"

const authStore = useAuthStore()
const projects = ref([])
const notifications = ref([])
const profile = ref({})
const loading = ref(false)
const notifLoading = ref(false)

const user = computed(() => authStore.user || {})
const displayName = computed(() => {
  const u = user.value
  const name = u?.fullName || u?.name || (u?.email ? u.email.split("@")[0] : "Giảng viên")
  return name.startsWith("Thầy/Cô") ? name : `Thầy/Cô ${name}`
})
const avatarUrl = computed(() => user.value?.avatar || user.value?.photoURL || "")
const initials = computed(() => {
  const name = user.value?.fullName || user.value?.name || "GV"
  return name.charAt(0).toUpperCase()
})
const employeeId = computed(() => profile.value?.staffCode || profile.value?.code || authStore.user?.code || "")
const department = computed(() => profile.value?.faculty || profile.value?.department || authStore.user?.department || "")
const email = computed(() => profile.value?.email || authStore.user?.email || "")
const phone = computed(() => profile.value?.phone || profile.value?.phoneNumber || authStore.user?.phone || "")

const teamNameOf = (p) => p.teamName || (p.team ? p.team.name : p.groupName || "Chưa cập nhật")

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await mentorService.getAssignedProjects()
    projects.value = normalizeList(res)
  } catch (e) {
    projects.value = []
  } finally {
    loading.value = false
  }
}

const fetchNotifications = async () => {
  notifLoading.value = true
  try {
    const res = await mentorService.getMentorNotifications()
    notifications.value = normalizeList(res)
  } catch (e) {
    notifications.value = []
  } finally {
    notifLoading.value = false
  }
}

const formatDate = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleString("vi-VN") } catch { return "" }
}

const fetchProfile = async () => {
  try {
    const res = await mentorService.getMentorProfile()
    profile.value = res?.data || res || {}
  } catch (e) {
    profile.value = {}
  }
}

onMounted(() => {
  fetchData()
  fetchNotifications()
  fetchProfile()
})
</script>
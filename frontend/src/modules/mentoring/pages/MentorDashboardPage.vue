<template>
  <div class="space-y-6">
    <!-- Teacher Profile Executive Card -->
    <section class="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-6">
      <div class="flex items-start gap-4">
        <div v-if="avatarUrl" class="w-14 h-14 rounded-2xl overflow-hidden shadow-md shrink-0">
          <img :src="avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-14 h-14 rounded-2xl bg-[#0F4C81] text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">
          {{ initials }}
        </div>
        <div class="flex-1">
          <h1 class="text-lg font-bold text-slate-900">{{ displayName }}</h1>
          <span class="inline-block mt-1 text-xs px-2.5 py-0.5 font-medium rounded-full bg-[#EFF6FF] text-[#0F4C81]">Cố vấn chuyên môn SESS - CTUT</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-slate-600">
            <p><span class="text-slate-400">MSCB:</span> {{ employeeId }}</p>
            <p><span class="text-slate-400">Khoa/Bộ môn:</span> {{ department }}</p>
            <p><span class="text-slate-400">Email:</span> {{ email }}</p>
            <p><span class="text-slate-400">Điện thoại:</span> {{ phone }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Academic Status & Shortcut Bar removed -->

    <!-- Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-1 h-4 bg-[#0F4C81] rounded-full"></span>
            <h2 class="text-base font-bold text-slate-900">Đề tài & Nhóm sinh viên phụ trách</h2>
          </div>
          <div class="flex items-center gap-3">
            <RouterLink to="/advisor/mentoring" class="text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0B3B66] px-3 py-1.5 rounded-lg transition">+ Góp ý nhanh</RouterLink>
            <button @click="fetchData" class="text-xs text-slate-500 hover:text-[#0F4C81]">Làm mới</button>
            <RouterLink to="/advisor/projects" class="text-xs text-[#0F4C81] hover:underline">Xem tất cả ›</RouterLink>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-sm text-slate-500">Đang tải dữ liệu...</div>
          <div v-else-if="projects.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p class="text-sm text-slate-500 mt-3">Hiện tại chưa có nhóm sinh viên nào được phân công hướng dẫn. Hệ thống sẽ tự động cập nhật khi Khoa hoàn tất phân bổ đề tài.</p>
            <button @click="fetchData" class="mt-4 text-xs font-medium text-white bg-[#0F4C81] hover:bg-[#0B3B66] px-4 py-2 rounded-lg transition">Làm mới dữ liệu</button>
          </div>
          <div v-else class="space-y-3">
            <div v-for="p in projects.slice(0, 6)" :key="p.id || p._id" class="flex items-start justify-between gap-4 border border-slate-300 rounded-lg p-4 hover:border-[#0F4C81] transition-colors">
              <div>
                <p class="font-semibold text-slate-900">{{ p.name || p.title }}</p>
                <p class="text-xs text-slate-500 mt-1">Nhóm: {{ teamNameOf(p) }}</p>
                <p class="text-xs text-slate-400 mt-1">Mã: {{ p.code || p.projectCode || "—" }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 uppercase">{{ p.status || "Đang thực hiện" }}</span>
                <RouterLink :to="`/advisor/projects/${p.id || p._id}/timeline`" class="text-xs text-[#0F4C81] hover:underline">Xem tiến độ</RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="lg:col-span-4 space-y-6">
        <section class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900">Nhắc việc & Thông báo</h2>
            <RouterLink to="/advisor/notifications" class="text-xs text-[#0F4C81] hover:underline">Tất cả ›</RouterLink>
          </div>
          <div class="p-5 space-y-4">
            <div v-if="notifLoading" class="text-sm text-slate-500">Đang tải...</div>
            <div v-else-if="notifications.length === 0" class="text-sm text-slate-500">Chưa có thông báo mới.</div>
            <div v-else v-for="n in notifications.slice(0,5)" :key="n._id || n.id" class="border-l-2 border-slate-200 pl-4 py-1">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{{ n.read ? 'Đã đọc' : 'Mới' }}</span>
                <span class="text-[10px] text-slate-400">{{ formatDate(n.createdAt) }}</span>
              </div>
              <p class="text-sm text-slate-700 mt-1">{{ n.title || n.content }}</p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-1 h-4 bg-[#0F4C81] rounded-full"></span>
            <h2 class="text-base font-bold text-slate-900">Hỗ trợ & Tài liệu Cố vấn</h2>
          </div>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 px-2 rounded transition">
              <span class="text-slate-700">Quy chế hướng dẫn đề tài SESS 2026</span>
              <a href="#" class="text-xs text-[#0F4C81] hover:underline">Tải PDF</a>
            </li>
            <li class="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 px-2 rounded transition">
              <span class="text-slate-700">Biểu mẫu nhận xét & chấm điểm mẫu</span>
              <a href="#" class="text-xs text-[#0F4C81] hover:underline">Xem</a>
            </li>
            <li class="py-2 px-2">
              <p class="text-slate-700 font-medium">Hỗ trợ kỹ thuật từ BTC</p>
              <p class="text-xs text-slate-500 mt-1">Hotline: 0292.38xx.xxx • Email: hotro.sess@ctut.edu.vn</p>
            </li>
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
<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-[#0f172a]">Tiến độ & Cột mốc</h1>
      <p class="mt-1 text-sm text-slate-500">Quan sát mốc thời gian, giao deadline và theo dõi tiến độ thực hiện của từng nhóm phụ trách.</p>
    </div>

    <!-- Master: Chọn dự án -->
    <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div class="border-b border-slate-200/70 px-6 py-5 sm:px-8">
        <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Chọn dự án để xem tiến độ</h2>
        <p class="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Dữ liệu cột mốc sẽ cập nhật ngay bên dưới sau khi chọn</p>
      </div>
      <div class="px-6 pb-6 sm:px-8 sm:pb-8">
        <div class="max-w-xl">
          <div class="mb-1 flex items-center gap-3">
            <Search class="h-4 w-4 text-slate-400" />
            <label class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dự án</label>
          </div>
          <select
            v-model="selectedProjectId"
            @change="fetchMilestones"
            class="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15"
          >
            <option value="">-- Chọn một dự án --</option>
            <option v-for="p in projects" :key="p.id || p._id" :value="p.id || p._id">{{ p.name || p.title }} — {{ p.code || p.projectCode }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Detail: chưa chọn dự án -->
    <div v-if="!selectedProjectId" class="flex min-h-[280px] flex-col items-center justify-center py-16 text-center">
      <EmptyState :icon="FolderKanban" title="Hãy chọn một dự án" description="Chọn dự án từ danh sách ở trên để xem chi tiết tiến độ, các cột mốc và hạn hoàn thành." iconBg="bg-slate-100" iconColor="text-slate-500" />
    </div>

    <!-- Detail: đang tải -->
    <div v-else-if="milestonesLoading" class="space-y-4 p-12">
      <div v-for="i in 4" :key="i" class="flex items-start gap-4">
        <SkeletonLoader type="avatar" :height="40" :width="40" border-radius="9999" />
        <div class="flex-1 space-y-2">
          <SkeletonLoader type="text" :height="20" :width="60" />
          <SkeletonLoader type="text" :height="16" :width="70" />
        </div>
        <div class="flex w-full flex-col items-end gap-2 lg:w-auto">
          <SkeletonLoader type="badge" :height="24" :width="64" border-radius="9999" />
          <SkeletonLoader type="text" :height="18" :width="40" />
        </div>
      </div>
    </div>

    <!-- Detail: lỗi -->
    <div v-else-if="milestonesError" class="p-12 text-center">
      <EmptyState :icon="AlertCircle" title="Không tải được tiến độ" :description="milestonesError" iconBg="bg-red-50" iconColor="text-red-600">
        <template #actions>
          <button @click="fetchMilestones" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RefreshCw class="h-4 w-4" />
            Thử lại
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Detail: trống -->
    <div v-else-if="milestones.length === 0" class="flex min-h-[280px] flex-col items-center justify-center py-16 text-center">
      <EmptyState :icon="Clock" title="Chưa có cột mốc nào" description="Dự án này chưa có cột mốc. Bạn có thể tạo cột mốc đầu tiên để bắt đầu theo dõi tiến độ và giao deadline cho nhóm sinh viên." iconBg="bg-slate-100" iconColor="text-slate-500">
        <template #actions>
          <button @click="openCreateModal = true" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Plus class="h-4 w-4" />
            Tạo cột mốc đầu tiên
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Detail: danh sách cột mốc -->
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div class="border-b border-slate-200/70 px-6 py-5 sm:px-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">{{ selectedProject?.name || selectedProject?.title }}</h2>
            <p class="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Cột mốc & hạn hoàn thành</p>
          </div>
          <button @click="openCreateModal = true" class="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#172554]">
            <Plus class="h-3.5 w-3.5" /> Tạo cột mốc
          </button>
        </div>
      </div>
      <div class="divide-y divide-slate-200/70">
        <div v-for="m in milestones" :key="m.id || m._id" class="px-6 py-5 transition-colors hover:bg-slate-50/50 sm:px-8">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Clock class="h-4 w-4 text-[#1e3a8a]" />
              </div>
              <div>
                <p class="text-[15px] font-semibold text-[#0f172a]">{{ m.title || m.name }}</p>
                <p class="mt-1 text-[13px] leading-relaxed text-slate-600">{{ m.description || "Không có mô tả." }}</p>
              </div>
            </div>
            <div class="flex w-full flex-col items-end gap-2 lg:w-auto lg:flex-row">
              <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
              <span class="inline-flex items-center text-[12px] font-medium text-slate-600"><Calendar class="mr-1.5 h-3.5 w-3.5" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal tạo cột mốc -->
    <div v-if="openCreateModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" @click.self="openCreateModal = false">
      <div class="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)]" @click.stop>
        <div class="border-b border-slate-200/70 px-6 py-5">
          <h3 class="text-base font-semibold tracking-tight text-[#0f172a]">Tạo cột mốc mới</h3>
          <p class="mt-1 text-sm text-slate-500">Giao mốc thời gian cho dự án "{{ selectedProject?.name || selectedProject?.title }}"</p>
        </div>
        <div class="space-y-4 px-6 pb-6">
          <div>
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tiêu đề cột mốc *</label>
            <input v-model="newMilestone.title" class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" placeholder="Ví dụ: Hoàn thành bản thiết kế ban đầu" />
          </div>
          <div>
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mô tả yêu cầu</label>
            <textarea v-model="newMilestone.description" rows="3" class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" placeholder="Yêu cầu cụ thể sinh viên cần hoàn thành tại mốc này…" />
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ngày bắt đầu</label>
              <input type="date" v-model="newMilestone.startDate" class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
            </div>
            <div>
              <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thời hạn *</label>
              <input type="date" v-model="newMilestone.dueDate" :min="tomorrowStr" class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
              <p v-if="dueDateError" class="mt-1 text-xs text-red-600">Hạn chót phải là một ngày trong tương lai</p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-200/70 px-6 py-4">
          <button @click="openCreateModal = false" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Hủy</button>
          <button @click="createMilestone" :disabled="creating || !newMilestone.title || !newMilestone.dueDate || dueDateError" class="rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">Tạo cột mốc</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import {
  Loader2,
  AlertCircle,
  FolderKanban,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Calendar,
} from "lucide-vue-next"
import mentorService from "../common/services/mentorService"
import EmptyState from "@/modules/mentoring/common/components/EmptyState.vue"
import SkeletonLoader from "@/modules/mentoring/common/components/SkeletonLoader.vue"

const projects = ref([])
const selectedProjectId = ref("")
const milestones = ref([])
const milestonesLoading = ref(false)
const milestonesError = ref("")
const openCreateModal = ref(false)
const creating = ref(false)
const newMilestone = ref({ title: "", description: "", startDate: "", dueDate: "" })
const tomorrowStr = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})
const dueDateError = computed(() => {
  if (!newMilestone.value.dueDate) return false
  const d = new Date(newMilestone.value.dueDate)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d <= today
})

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const selectedProject = computed(() => projects.value.find((p) => (p.id || p._id) === selectedProjectId.value))

const fetchProjects = async () => {
  try {
    const res = await mentorService.getAssignedProjects()
    projects.value = normalizeList(res)
    if (!selectedProjectId.value && projects.value.length > 0) {
      selectedProjectId.value = projects.value[0].id || projects.value[0]._id
    }
  } catch (e) {
    projects.value = []
  }
}

const fetchMilestones = async () => {
  if (!selectedProjectId.value) {
    milestones.value = []
    return
  }
  milestonesLoading.value = true
  milestonesError.value = ""
  try {
    const res = await mentorService.getProjectMilestones(selectedProjectId.value)
    milestones.value = normalizeList(res)
  } catch (e) {
    milestonesError.value = e.response?.data?.message || "Không thể tải danh sách cột mốc"
    milestones.value = []
  } finally {
    milestonesLoading.value = false
  }
}

const createMilestone = async () => {
  if (!selectedProjectId.value) return
  creating.value = true
  try {
    await mentorService.createMilestone(selectedProjectId.value, {
      title: newMilestone.value.title,
      description: newMilestone.value.description,
      startDate: newMilestone.value.startDate || null,
      dueDate: newMilestone.value.dueDate,
    })
    openCreateModal.value = false
    newMilestone.value = { title: "", description: "", startDate: "", dueDate: "" }
    fetchMilestones()
  } catch (e) {
    alert(e.response?.data?.message || "Tạo cột mốc thất bại")
  } finally {
    creating.value = false
  }
}

const statusLabel = (s) => {
  if (!s) return "Sắp tới"
  const map = { PENDING: "Sắp tới", IN_PROGRESS: "Đang thực hiện", COMPLETED: "Hoàn thành", OVERDUE: "Quá hạn" }
  return map[s] || s
}

const statusBadge = (s) => {
  const map = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200/70",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200/70",
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    OVERDUE: "bg-rose-50 text-rose-700 ring-rose-200/70",
  }
  return map[s] || "bg-slate-50 text-slate-700 ring-slate-200/70"
}

const formatDate = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("vi-VN") } catch { return "" }
}

onMounted(fetchProjects)
watch(selectedProjectId, (newId) => { if (newId) fetchMilestones() })
</script>

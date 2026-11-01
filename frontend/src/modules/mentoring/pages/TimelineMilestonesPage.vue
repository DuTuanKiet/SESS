<template>
  <div class="space-y-10">
    <div>
      <h1 class="text-2xl font-bold text-[#0B1F4B] leading-none">Tiến độ & Cột mốc</h1>
      <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">Quan sát mốc thời gian, giao deadline và theo dõi tiến độ thực hiện của từng nhóm phụ trách.</p>
    </div>

    <!-- Master: Chọn dự án -->
    <div class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div class="px-8 py-7 border-b border-[#E4ECF7]">
        <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">Chọn dự án để xem tiến độ</h2>
        <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Dữ liệu cột mốc sẽ cập nhật ngay bên dưới sau khi chọn</p>
      </div>
      <div class="px-8 pb-8">
        <div class="max-w-xl">
          <div class="flex items-center gap-3 mb-1">
            <Search class="h-4 w-4 text-[#9BB4E8]" />
            <label class="text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider leading-none">Dự án</label>
          </div>
          <select
            v-model="selectedProjectId"
            @change="fetchMilestones"
            class="w-full rounded-xl border border-[#E4ECF7] bg-white px-4 py-3.5 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">-- Chọn một dự án --</option>
            <option v-for="p in projects" :key="p.id || p._id" :value="p.id || p._id">{{ p.name || p.title }} — {{ p.code || p.projectCode }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Detail: chưa chọn dự án -->
    <div v-if="!selectedProjectId" class="min-h-[300px] flex flex-col items-center justify-center py-20 text-center">
      <EmptyState :icon="FolderKanban" title="Hãy chọn một dự án" description="Chọn dự án từ danh sách ở trên để xem chi tiết tiến độ, các cột mốc và hạn hoàn thành." iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]" />
    </div>

    <!-- Detail: đang tải -->
    <div v-else-if="milestonesLoading" class="p-16 space-y-4">
      <div v-for="i in 4" :key="i" class="flex items-start gap-4">
        <SkeletonLoader type="avatar" :height="40" :width="40" border-radius="9999" />
        <div class="flex-1 space-y-2">
          <SkeletonLoader type="text" :height="20" :width="60" />
          <SkeletonLoader type="text" :height="16" :width="70" />
        </div>
        <div class="flex flex-col items-end gap-2 w-full lg:w-auto">
          <SkeletonLoader type="badge" :height="24" :width="64" border-radius="9999" />
          <SkeletonLoader type="text" :height="18" :width="40" />
        </div>
      </div>
    </div>

    <!-- Detail: lỗi -->
    <div v-else-if="milestonesError" class="p-16 text-center">
      <EmptyState :icon="AlertCircle" title="Không tải được tiến độ" :description="milestonesError" iconBg="bg-[#FEF3F2]" iconColor="text-[#C2410C]">
        <template #actions>
          <button @click="fetchMilestones" class="inline-flex items-center gap-2 rounded-xl border border-[#E4ECF7] bg-white px-5 py-2.5 text-sm font-medium text-[#0B1F4B] shadow-sm hover:bg-[#F8FAFC] transition-colors">
            <RefreshCw class="w-4 h-4 stroke-[1.5]" />
            Thử lại
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Detail: trống -->
    <div v-else-if="milestones.length === 0" class="min-h-[300px] flex flex-col items-center justify-center py-20 text-center">
      <EmptyState :icon="Clock" title="Chưa có cột mốc nào" description="Dự án này chưa có cột mốc. Bạn có thể tạo cột mốc đầu tiên để bắt đầu theo dõi tiến độ và giao deadline cho nhóm sinh viên." iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]">
        <template #actions>
          <button @click="openCreateModal = true" class="inline-flex items-center gap-2 rounded-xl border border-[#E4ECF7] bg-white px-5 py-2.5 text-sm font-medium text-[#0B1F4B] shadow-sm hover:bg-[#F8FAFC] transition-colors">
            <Plus class="w-4 h-4 stroke-[1.5]" />
            Tạo cột mốc đầu tiên
          </button>
        </template>
      </EmptyState>
    </div>

    <!-- Detail: danh sách cột mốc -->
    <div v-else class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div class="px-8 py-7 border-b border-[#E4ECF7]">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">{{ selectedProject?.name || selectedProject?.title }}</h2>
            <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Cột mốc & hạn hoàn thành</p>
          </div>
          <button @click="openCreateModal = true" class="inline-flex items-center gap-2 rounded-xl border border-[#1E56D9] bg-[#1E56D9] px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(30,86,217,0.25)] transition-all hover:bg-[#1d4ed8] hover:shadow-[0_6px_16px_rgba(30,86,217,0.35)] active:scale-95">
            <Plus class="h-3.5 w-3.5 stroke-[1.5]" /> Tạo cột mốc
          </button>
        </div>
      </div>
      <div class="divide-y divide-[#E4ECF7]">
        <div v-for="m in milestones" :key="m.id || m._id" class="px-8 py-6 transition-colors hover:bg-[#F8FBFF]/60">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B192C]/5 shrink-0">
                <Clock class="h-4 w-4 stroke-[1.5] text-[#0B192C]" />
              </div>
              <div>
                <p class="text-base font-semibold text-[#0B1F4B] leading-none">{{ m.title || m.name }}</p>
                <p class="mt-1 text-[12px] text-[#6B7B9A] leading-relaxed">{{ m.description || "Không có mô tả." }}</p>
              </div>
            </div>
            <div class="flex flex-col lg:flex-row items-end gap-3 w-full lg:w-auto">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider leading-none" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
              <span class="text-[12px] font-medium text-[#0B1F4B] leading-none"><Calendar class="h-3.5 w-3.5 stroke-[1.5] mr-1.5" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal tạo cột mốc -->
    <div v-if="openCreateModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="openCreateModal = false">
      <div class="bg-white rounded-2xl border border-[#E4ECF7] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] w-full max-w-md mx-4" @click.stop>
        <div class="px-7 py-6 border-b border-[#E4ECF7]">
          <h3 class="text-lg font-bold text-[#0B1F4B] leading-none">Tạo cột mốc mới</h3>
          <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">Giao mốc thời gian cho dự án "{{ selectedProject?.name || selectedProject?.title }}"</p>
        </div>
        <div class="px-7 pb-7 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider mb-2">Tiêu đề cột mốc *</label>
            <input v-model="newMilestone.title" class="w-full rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] px-4 py-3 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" placeholder="Ví dụ: Hoàn thành bản thiết kế ban đầu" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider mb-2">Mô tả yêu cầu</label>
            <textarea v-model="newMilestone.description" rows="3" class="w-full rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] px-4 py-3 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" placeholder="Yêu cầu cụ thể sinh viên cần hoàn thành tại mốc này…" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider mb-2">Ngày bắt đầu</label>
              <input type="date" v-model="newMilestone.startDate" class="w-full rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] px-4 py-3 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider mb-2">Thời hạn *</label>
              <input type="date" v-model="newMilestone.dueDate" class="w-full rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] px-4 py-3 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" />
            </div>
          </div>
        </div>
        <div class="px-7 pt-5 pb-7 border-t border-[#E4ECF7] flex justify-end gap-3">
          <button @click="openCreateModal = false" class="rounded-xl px-5 py-2.5 text-sm font-medium text-[#6B7B9A] bg-white border border-[#E4ECF7] transition-all hover:bg-[#F8FAFC]">Hủy</button>
          <button @click="createMilestone" :disabled="creating || !newMilestone.title || !newMilestone.dueDate" class="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-[#1E56D9] shadow-[0_4px_12px_rgba(30,86,217,0.25)] transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#1d4ed8] active:scale-95">Tạo cột mốc</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
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
  if (!s) return "Chờ xử lý"
  const map = { PENDING: "Đang chờ", IN_PROGRESS: "Đang thực hiện", COMPLETED: "Hoàn thành", OVERDUE: "Quá hạn" }
  return map[s] || s
}

const statusBadge = (s) => {
  const map = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border border-blue-100",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    OVERDUE: "bg-rose-50 text-rose-700 border border-rose-100",
  }
  return map[s] || "bg-slate-50 text-slate-700 border border-slate-100"
}

const formatDate = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("vi-VN") } catch { return "" }
}

onMounted(fetchProjects)
</script>

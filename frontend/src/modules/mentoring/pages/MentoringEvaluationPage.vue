<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-[#0f172a]">Góp ý & Đánh giá</h1>
      <p class="mt-1 text-sm text-slate-500">Trao đổi phản hồi chi tiết, ghi nhận nhận xét theo từng cột mốc để nhóm sinh viên cải tiến dự án.</p>
    </div>

    <!-- Master: Chọn dự án -->
    <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div class="border-b border-slate-200/70 px-6 py-5 sm:px-8">
        <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Chọn dự án để xem góp ý</h2>
        <p class="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Danh sách cột mốc và lịch sử góp ý sẽ hiển thị ngay bên dưới</p>
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
      <EmptyState :icon="MessageSquareText" title="Hãy chọn một dự án" description="Chọn dự án từ danh sách ở trên để xem các cột mốc và trao đổi góp ý chi tiết." iconBg="bg-slate-100" iconColor="text-slate-500" />
    </div>

    <!-- Detail: đang tải -->
    <div v-else-if="loading" class="space-y-4 p-12">
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
    <div v-else-if="error" class="p-12 text-center">
      <EmptyState :icon="AlertCircle" title="Không tải được dữ liệu" :description="error" iconBg="bg-red-50" iconColor="text-red-600">
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
      <EmptyState :icon="Clock" title="Chưa có cột mốc nào" :description="emptyMilestonesDescription" iconBg="bg-slate-100" iconColor="text-slate-500" />
    </div>

    <!-- Detail: danh sách cột mốc + góp ý -->
    <div v-else class="divide-y divide-slate-200/70">
      <div class="border-b border-slate-200/70 px-6 py-5 sm:px-8">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">{{ currentProjectName }}</h2>
            <p class="mt-1 text-[11px] uppercase tracking-wider text-slate-500">Lịch sử góp ý theo cột mốc</p>
          </div>
        </div>
      </div>
      <div class="py-6">
        <div v-for="m in milestones" :key="m.id || m._id" class="px-6 pb-6 last:pb-0 sm:px-8">
          <div class="mb-3 flex items-start gap-4">
            <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <ClipboardList class="h-4 w-4 text-[#1e3a8a]" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[15px] font-semibold text-[#0f172a]">{{ m.title || m.name }}</p>
              <p class="mt-1 text-[13px] leading-relaxed text-slate-600">{{ m.description || "Không có mô tả." }}</p>
              <div class="mt-2 flex items-center gap-3">
                <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
                <span class="inline-flex items-center text-[11px] text-slate-500"><Calendar class="mr-1.5 h-3.5 w-3.5" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="(c, ci) in (m.comments || []).slice(0, 3)" :key="ci" class="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <div class="mb-2 flex items-center gap-2">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-[#1e3a8a]">Bạn</span>
                <span class="text-[10px] text-slate-400">{{ formatDateTime(c.createdAt || c.updatedAt) }}</span>
              </div>
              <p class="text-sm leading-relaxed text-[#0f172a]">{{ c.content || c.comment || c.message || "" }}</p>
            </div>
            <div v-if="(m.comments || []).length > 3" class="text-right text-[11px] text-slate-400">và còn {{ (m.comments || []).length - 3 }} góp ý khác…</div>
            <button @click="openFeedback(m)" class="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#1e3a8a] transition hover:bg-slate-50">
              <MessageSquareText class="h-3.5 w-3.5" /> Thêm góp ý
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal thêm góp ý -->
    <div v-if="openFeedbackModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" @click.self="openFeedbackModal = false">
      <div class="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-12px_rgba(15,23,42,0.18)]" @click.stop>
        <div class="border-b border-slate-200/70 px-6 py-5">
          <h3 class="text-base font-semibold tracking-tight text-[#0f172a]">Góp ý cho cột mốc</h3>
          <p class="mt-1 text-sm text-slate-500">{{ selectedMilestone?.title || selectedMilestone?.name }}</p>
        </div>
        <div class="space-y-4 px-6 pb-6">
          <div>
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nội dung góp ý</label>
            <textarea v-model="feedbackText" rows="5" class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" placeholder="Nhận xét, kiến nghị và hướng cải tiến cho nhóm sinh viên…" />
          </div>
          <p class="text-[11px] text-slate-500">Góp ý không chứa điểm số, chỉ mang mục tiêu hỗ trợ nhóm hoàn thiện đề tài.</p>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-200/70 px-6 py-4">
          <button @click="openFeedbackModal = false" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Hủy</button>
          <button @click="submitFeedback" :disabled="submitting || !feedbackText.trim()" class="rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">Gửi góp ý</button>
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
  MessageSquareText,
  Clock,
  Search,
  RefreshCw,
  Calendar,
  ClipboardList,
} from "lucide-vue-next"
import mentorService from "../common/services/mentorService"
import EmptyState from "@/modules/mentoring/common/components/EmptyState.vue"
import SkeletonLoader from "@/modules/mentoring/common/components/SkeletonLoader.vue"

const projects = ref([])
const selectedProjectId = ref("")
const milestones = ref([])
const loading = ref(false)
const error = ref("")
const openFeedbackModal = ref(false)
const selectedMilestone = ref(null)
const feedbackText = ref("")
const submitting = ref(false)

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const currentProjectName = computed(() => {
  const p = projects.value.find((x) => (x.id || x._id) === selectedProjectId.value)
  return p ? (p.name || p.title) : ""
})

const emptyMilestonesDescription = computed(() => `Dự án "${currentProjectName.value}" chưa có cột mốc để trao đổi góp ý.`)

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
  loading.value = true
  error.value = ""
  try {
    const res = await mentorService.getProjectMilestones(selectedProjectId.value)
    milestones.value = normalizeList(res)
  } catch (e) {
    error.value = e.response?.data?.message || "Không thể tải dữ liệu đánh giá"
    milestones.value = []
  } finally {
    loading.value = false
  }
}

const openFeedback = (m) => {
  selectedMilestone.value = m
  feedbackText.value = ""
  openFeedbackModal.value = true
}

const submitFeedback = async () => {
  if (!selectedMilestone.value) return
  submitting.value = true
  try {
    await mentorService.addMilestoneFeedback(selectedProjectId.value, selectedMilestone.value.id || selectedMilestone.value._id, {
      content: feedbackText.value,
      comment: feedbackText.value,
    })
    feedbackText.value = ""
    openFeedbackModal.value = false
    fetchMilestones()
  } catch (e) {
    alert(e.response?.data?.message || "Gửi góp ý thất bại")
  } finally {
    submitting.value = false
  }
}

const statusLabel = (s) => {
  if (!s) return "Chờ xử lý"
  const map = { PENDING: "Đang chờ", IN_PROGRESS: "Đang thực hiện", COMPLETED: "Hoàn thành", OVERDUE: "Quá hạn" }
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

const formatDateTime = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" }) } catch { return "" }
}

onMounted(fetchProjects)
</script>

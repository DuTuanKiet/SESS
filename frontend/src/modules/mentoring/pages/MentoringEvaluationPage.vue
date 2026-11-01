<template>
  <div class="space-y-10">
    <div>
      <h1 class="text-2xl font-bold text-[#0B1F4B] leading-none">Góp ý & Đánh giá</h1>
      <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">Trao đổi phản hồi chi tiết, ghi nhận nhận xét theo từng cột mốc để nhóm sinh viên cải tiến dự án.</p>
    </div>

    <!-- Master: Chọn dự án -->
    <div class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div class="px-8 py-7 border-b border-[#E4ECF7]">
        <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">Chọn dự án để xem góp ý</h2>
        <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Danh sách cột mốc và lịch sử góp ý sẽ hiển thị ngay bên dưới</p>
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
      <EmptyState :icon="MessageSquareText" title="Hãy chọn một dự án" description="Chọn dự án từ danh sách ở trên để xem các cột mốc và trao đổi góp ý chi tiết." iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]" />
    </div>

    <!-- Detail: đang tải -->
    <div v-else-if="loading" class="p-16 space-y-4">
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
    <div v-else-if="error" class="p-16 text-center">
      <EmptyState :icon="AlertCircle" title="Không tải được dữ liệu" :description="error" iconBg="bg-[#FEF3F2]" iconColor="text-[#C2410C]">
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
      <EmptyState :icon="Clock" title="Chưa có cột mốc nào" :description="emptyMilestonesDescription" iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]" />
    </div>

    <!-- Detail: danh sách cột mốc + góp ý -->
    <div v-else class="divide-y divide-[#E4ECF7]">
      <div class="px-8 py-7 border-b border-[#E4ECF7]">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-[#0B1F4B] leading-none">{{ currentProjectName }}</h2>
            <p class="mt-1 text-[11px] text-[#6B7B9A] uppercase tracking-wider leading-none">Lịch sử góp ý theo cột mốc</p>
          </div>
        </div>
      </div>
      <div class="py-6">
        <div v-for="m in milestones" :key="m.id || m._id" class="px-8 pb-6 last:pb-0">
          <div class="flex items-start gap-4 mb-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B192C]/5 shrink-0 mt-0.5">
              <ClipboardList class="h-4 w-4 stroke-[1.5] text-[#0B192C]" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-semibold text-[#0B1F4B] leading-none">{{ m.title || m.name }}</p>
              <p class="mt-1 text-[12px] text-[#6B7B9A] leading-relaxed">{{ m.description || "Không có mô tả." }}</p>
              <div class="mt-2 flex items-center gap-3">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider leading-none" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
                <span class="text-[11px] text-[#9BB4E8] leading-none"><Calendar class="h-3.5 w-3.5 stroke-[1.5] mr-1.5" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <div v-for="(c, ci) in (m.comments || []).slice(0, 3)" :key="ci" class="rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] font-bold text-[#1E56D9] uppercase tracking-wider">Bạn</span>
                <span class="text-[10px] text-[#9BB4E8]">{{ formatDateTime(c.createdAt || c.updatedAt) }}</span>
              </div>
              <p class="text-sm text-[#0B1F4B] leading-relaxed">{{ c.content || c.comment || c.message || "" }}</p>
            </div>
            <div v-if="(m.comments || []).length > 3" class="text-[11px] text-[#9BB4E8] text-right">và còn {{ (m.comments || []).length - 3 }} góp ý khác…</div>
            <button @click="openFeedback(m)" class="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#1E56D9]/30 bg-[#1E56D9]/5 px-3.5 py-2 text-xs font-semibold text-[#1E56D9] uppercase tracking-wider transition-all hover:bg-[#1E56D9] hover:text-white active:scale-95">
              <MessageSquareText class="h-3.5 w-3.5 stroke-[1.5]" /> Thêm góp ý
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal thêm góp ý -->
    <div v-if="openFeedbackModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="openFeedbackModal = false">
      <div class="bg-white rounded-2xl border border-[#E4ECF7] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] w-full max-w-md mx-4" @click.stop>
        <div class="px-7 py-6 border-b border-[#E4ECF7]">
          <h3 class="text-lg font-bold text-[#0B1F4B] leading-none">Góp ý cho cột mốc</h3>
          <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">{{ selectedMilestone?.title || selectedMilestone?.name }}</p>
        </div>
        <div class="px-7 pb-7 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-[#6B7B9A] uppercase tracking-wider mb-2">Nội dung góp ý</label>
            <textarea v-model="feedbackText" rows="5" class="w-full rounded-xl border border-[#E4ECF7] bg-[#F8FBFF] px-4 py-3 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" placeholder="Nhận xét, kiến nghị và hướng cải tiến cho nhóm sinh viên…" />
          </div>
          <p class="mt-1 text-[11px] text-[#9BB4E8] leading-none">Góp ý không chứa điểm số, chỉ mang mục tiêu hỗ trợ nhóm hoàn thiện đề tài.</p>
        </div>
        <div class="px-7 pt-5 pb-7 border-t border-[#E4ECF7] flex justify-end gap-3">
          <button @click="openFeedbackModal = false" class="rounded-xl px-5 py-2.5 text-sm font-medium text-[#6B7B9A] bg-white border border-[#E4ECF7] transition-all hover:bg-[#F8FAFC]">Hủy</button>
          <button @click="submitFeedback" :disabled="submitting || !feedbackText.trim()" class="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-[#1E56D9] shadow-[0_4px_12px_rgba(30,86,217,0.25)] transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#1d4ed8] active:scale-95">Gửi góp ý</button>
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

const formatDateTime = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" }) } catch { return "" }
}

onMounted(fetchProjects)
</script>

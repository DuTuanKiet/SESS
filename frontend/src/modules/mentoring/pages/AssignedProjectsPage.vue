<template>
  <div class="space-y-6">
    <div v-if="!selectedProject">
      <div class="mb-4 flex items-center gap-2">
        <span class="h-5 w-1 rounded-full bg-[#1e3a8a]"></span>
        <h1 class="text-lg font-semibold tracking-tight text-[#0f172a]">Đề tài & Nhóm sinh viên phụ trách</h1>
      </div>
      <div v-if="loading" class="text-sm text-slate-500">Đang tải...</div>
      <div v-else-if="projects.length === 0" class="rounded-2xl border border-slate-200/70 bg-white py-10 text-center text-sm text-slate-500 shadow-sm">Chưa có đề tài. <button @click="fetchProjects" class="font-medium text-[#1e3a8a] underline-offset-2 hover:underline">Làm mới</button></div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div v-for="p in projects" :key="p.id || p._id" @click="selectedProject = p" class="cursor-pointer rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1e3a8a]/25 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.12)]">
          <p class="font-semibold tracking-tight text-[#1e3a8a]">{{ p.title || p.name }}</p>
          <p class="mt-1 inline-block rounded-lg border border-slate-200/70 bg-slate-50 px-2 py-1 text-xs text-slate-600">{{ p.teamName || 'Nhóm' }} • {{ (p.members || []).map(m => m.email).join(', ') }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ p.status || 'Đang triển khai' }}</p>
        </div>
      </div>
    </div>

    <div v-else>
      <button @click="selectedProject = null" class="mb-4 text-sm font-medium text-[#1e3a8a] hover:text-[#172554]">← Quay lại danh sách đề tài</button>
      <div class="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
        <h2 class="mb-4 text-lg font-semibold tracking-tight text-[#0f172a]">{{ selectedProject.title || selectedProject.name }}</h2>
        <div class="mb-4 flex flex-wrap gap-2">
          <button v-for="t in tabs" :key="t" @click="activeTab = t" class="rounded-lg px-3 py-1.5 text-xs font-medium transition" :class="activeTab === t ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">{{ t }}</button>
        </div>

        <div v-if="activeTab === 'Tổng quan'">
          <div class="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nhóm trưởng</p>
            <div class="flex flex-col gap-1 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5">
              <p class="text-sm text-[#0f172a]"><span class="font-medium text-slate-500">Họ tên:</span> {{ selectedProject.leader?.fullName || selectedProject.leaderName || 'Chưa cập nhật' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Mã số sinh viên:</span> {{ selectedProject.leader?.studentId || selectedProject.leaderStudentId || '—' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Email:</span> {{ selectedProject.leader?.email || selectedProject.leaderEmail || '—' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Vai trò:</span> Nhóm trưởng</p>
            </div>
          </div>

          <p class="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thành viên</p>
          <ul class="mt-1 space-y-2 text-sm text-slate-700">
            <li v-for="(m, index) in (selectedProject.members || [])" :key="m.email || m.studentId || `member-${index}`" class="flex flex-col gap-1 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5">
              <p class="text-sm text-[#0f172a]"><span class="font-medium text-slate-500">Họ tên:</span> {{ m.fullName || m.userId?.fullName || 'Chưa cập nhật' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Mã số sinh viên:</span> {{ m.studentId || m.userId?.studentId || m.studentCode || '—' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Email:</span> {{ m.email || m.userId?.email || '—' }}</p>
              <p class="text-sm text-slate-600"><span class="font-medium text-slate-500">Vai trò:</span> {{ m.role || 'Thành viên' }}</p>
            </li>
          </ul>
        </div>

        <div v-if="activeTab === 'Tiến độ & Cột mốc'" class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <button @click="showMilestone = true" class="rounded-lg bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#172554]">+ Giao cột mốc mới</button>
            <span v-if="milestonesLoading" class="animate-pulse text-xs text-[#1e3a8a]">Đang tải…</span>
          </div>

          <div v-if="showMilestone" class="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
            <input v-model="msTitle" placeholder="Tên cột mốc" class="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
            <input v-model="msDue" type="date" :min="tomorrowStr" class="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
            <p v-if="msDueError" class="mb-2 text-xs text-red-600">Hạn chót phải từ ngày mai trở đi.</p>
            <button @click="createMilestone" :disabled="creating || !msTitle.trim() || !msDue || msDueError" class="rounded-lg bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">Lưu</button>
          </div>

          <div v-if="milestonesError" class="rounded-lg border border-red-100 bg-red-50/70 p-4 text-sm text-red-700">{{ milestonesError }}</div>

          <div v-else-if="milestones.length === 0" class="rounded-xl border border-slate-200/70 bg-slate-50/50 p-6 text-center text-sm text-slate-500">Chưa có cột mốc nào cho dự án này.</div>

          <div v-else class="space-y-3">
            <div v-for="m in milestones" :key="m._id" class="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Calendar class="h-4 w-4 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-[#0f172a]">{{ m.title || m.name }}</p>
                    <p v-if="m.description" class="mt-1 line-clamp-2 text-xs text-slate-500">{{ m.description }}</p>
                  </div>
                </div>
                <div class="flex items-end gap-3">
                  <span class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
                  <span class="inline-flex items-center gap-1 text-xs text-slate-500"><Calendar class="h-3 w-3" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'Góp ý & Đánh giá'" class="space-y-4">
          <div class="rounded-xl border border-slate-200/70 bg-slate-50/40 p-5">
            <h3 class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gửi góp ý cho dự án</h3>
            <textarea v-model="feedbackContent" rows="4" placeholder="Nhận xét của bạn về tiến độ dự án..." class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
            <div class="mt-3 flex items-center gap-2">
              <button @click="sendFeedback" :disabled="sending || !feedbackContent.trim()" class="rounded-lg bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">Gửi nhận xét</button>
              <span v-if="sending" class="animate-pulse text-xs text-slate-500">Đang gửi…</span>
              <span v-else-if="feedbackStatus" class="text-xs text-emerald-600">{{ feedbackStatus }}</span>
            </div>
          </div>

          <div class="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm">
            <h3 class="border-b border-slate-200/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Lịch sử góp ý</h3>
            <div v-if="feedbacksLoading" class="p-5 text-center text-sm text-slate-500">Đang tải lịch sử góp ý…</div>
            <div v-else-if="feedbacksError" class="p-5 text-center text-sm text-red-700">{{ feedbacksError }}</div>
            <div v-else-if="feedbacks.length === 0" class="p-5 text-center text-sm text-slate-500">Chưa có góp ý nào cho dự án này.</div>
            <div v-else class="divide-y divide-slate-200/70">
              <div v-for="f in feedbacks" :key="f._id" class="px-5 py-4">
                <div class="mb-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <span class="line-clamp-1 text-sm font-semibold text-[#0f172a]">{{ f.content }}</span>
                  <span class="text-xs text-slate-500">{{ formatDateTime(f.createdAt) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#1e3a8a]">
                    <span class="h-2 w-2 rounded-full bg-[#1e3a8a]"></span>
                    {{ (f.mentor && f.mentor.fullName) || (f.mentor && f.mentor.email) || 'Giảng viên' }}
                  </span>
                  <span class="text-xs text-slate-400">• Dự án {{ projectId }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { Calendar } from "lucide-vue-next"
import mentorService from "../common/services/mentorService"

const projects = ref([])
const loading = ref(false)
const selectedProject = ref(null)
const activeTab = ref("Tổng quan")
const tabs = ["Tổng quan", "Tiến độ & Cột mốc", "Góp ý & Đánh giá"]
const showMilestone = ref(false)
const msTitle = ref("")
const msDue = ref("")
const msDueError = ref(false)
const milestones = ref([])
const milestonesLoading = ref(false)
const milestonesError = ref("")
const creating = ref(false)
const feedbackContent = ref("")
const sending = ref(false)
const feedbackStatus = ref("")
const feedbacks = ref([])
const feedbacksLoading = ref(false)
const feedbacksError = ref("")

const projectId = computed(() => selectedProject.value ? (selectedProject.value.id || selectedProject.value._id) : null)

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const isValidEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const tomorrowStr = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})

watch(msDue, (val) => {
  if (!val) { msDueError.value = false; return }
  const d = new Date(val)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  msDueError.value = d <= today
})

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await mentorService.getAssignedProjects()
    const list = normalizeList(res)
    projects.value = list
    if (!selectedProject.value && projects.value.length > 0) selectedProject.value = projects.value[0]
    console.log('[AssignedProjectsPage] Fetched projects:', projects.value)
    console.log('[AssignedProjectsPage] Selected project:', selectedProject.value)
  } catch (e) {
    projects.value = []
  } finally {
    loading.value = false
  }
}

const fetchMilestones = async () => {
  const pid = projectId.value
  if (!pid) return
  milestonesLoading.value = true
  milestonesError.value = ""
  try {
    const res = await mentorService.getProjectMilestones(pid)
    milestones.value = normalizeList(res)
  } catch (e) {
    milestonesError.value = e.response?.data?.message || "Không thể tải danh sách cột mốc"
    milestones.value = []
  } finally {
    milestonesLoading.value = false
  }
}

  const createMilestone = async () => {
  const pid = projectId.value
  if (!pid || creating.value || !String(msTitle.value || '').trim() || !msDue.value || msDueError.value) return
  creating.value = true
  try {
    // Lấy ngày hôm nay theo giờ địa phương, tránh lệch múi giờ UTC khi dùng toISOString()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dueDateObj = new Date(msDue.value)
    const payload = {
      title: String(msTitle.value || '').trim(),
      description: String(msTitle.value || '').trim() || 'Cột mốc',
      startDate: `${year}-${month}-${day}T00:00:00.000Z`,
      dueDate: dueDateObj.toISOString(),
    }
    console.log('[AssignedProjectsPage] Payload gửi lên API milestone:', JSON.stringify(payload, null, 2))
    await mentorService.createMilestone(pid, payload)
    msTitle.value = ""
    msDue.value = ""
    showMilestone.value = false
    await fetchMilestones()
  } catch (e) {
    console.error('[AssignedProjectsPage] Chi tiết validation errors:', JSON.stringify(e.response?.data?.errors || e.response?.data || e.message, null, 2))
    milestonesError.value = e.response?.data?.message || "Tạo cột mốc thất bại"
  } finally {
    creating.value = false
  }
}

const sendFeedback = async () => {
  const pid = projectId.value
  if (!pid || !String(feedbackContent.value || '').trim() || sending.value) return
  sending.value = true
  feedbackStatus.value = ""
  try {
    await mentorService.createProjectFeedback(pid, { content: feedbackContent.value })
    feedbackContent.value = ""
    feedbackStatus.value = "Đã gửi nhận xét thành công."
    await fetchFeedbacks()
  } catch (e) {
    feedbackStatus.value = e.response?.data?.message || "Gửi nhận xét thất bại"
  } finally {
    sending.value = false
  }
}

const fetchFeedbacks = async () => {
  const pid = projectId.value
  if (!pid) return
  feedbacksLoading.value = true
  feedbacksError.value = ""
  try {
    const res = await mentorService.getProjectFeedbacks(pid)
    feedbacks.value = normalizeList(res)
  } catch (e) {
    feedbacksError.value = e.response?.data?.message || "Không thể tải lịch sử góp ý"
    feedbacks.value = []
  } finally {
    feedbacksLoading.value = false
  }
}

const formatDate = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("vi-VN") } catch { return "" }
}

const formatDateTime = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) } catch { return "" }
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

onMounted(fetchProjects)
watch(projectId, (pid) => {
  if (pid) {
    fetchMilestones()
    fetchFeedbacks()
  } else {
    milestones.value = []
    feedbacks.value = []
  }
})
</script>

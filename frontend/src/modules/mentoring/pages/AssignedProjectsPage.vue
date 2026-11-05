<template>
  <div class="space-y-6">
    <div v-if="!selectedProject">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-1 h-4 bg-[#0F4C81] rounded-full"></span>
        <h1 class="text-lg font-bold text-slate-900">Đề tài & Nhóm sinh viên phụ trách</h1>
      </div>
      <div v-if="loading" class="text-sm text-slate-500">Đang tải...</div>
      <div v-else-if="projects.length === 0" class="text-center py-8 text-slate-500">Chưa có đề tài. <button @click="fetchProjects" class="text-[#0F4C81] underline">Làm mới</button></div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="p in projects" :key="p.id || p._id" @click="selectedProject = p" class="bg-slate-50 rounded-2xl border border-slate-300 shadow-sm p-5 cursor-pointer hover:border-[#0F4C81] transition">
          <p class="font-bold text-[#0F4C81]">{{ p.title || p.name }}</p>
          <p class="text-xs text-slate-500 mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1 inline-block">{{ p.teamName || 'Nhóm' }} • {{ (p.members || []).map(m => m.email).join(', ') }}</p>
          <p class="text-xs text-slate-400 mt-2">{{ p.status || 'Đang triển khai' }}</p>
        </div>
      </div>
    </div>

    <div v-else>
      <button @click="selectedProject = null" class="text-sm text-[#0F4C81] mb-4">← Quay lại danh sách đề tài</button>
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-6">
        <h2 class="text-lg font-bold text-slate-900 mb-4">{{ selectedProject.title || selectedProject.name }}</h2>
        <div class="flex gap-2 mb-4">
          <button v-for="t in tabs" :key="t" @click="activeTab = t" class="px-3 py-1.5 text-xs rounded-lg" :class="activeTab === t ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-600'">{{ t }}</button>
        </div>

        <div v-if="activeTab === 'Tổng quan'">
          <div class="mt-4 rounded-xl border border-slate-100 bg-white p-4">
            <p class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Nhóm trưởng</p>
            <div class="flex flex-col gap-1 px-3 py-2 rounded-lg border border-slate-100 bg-[#F8FBFF]">
              <p class="text-sm font-semibold text-slate-900"><strong>Họ tên:</strong> {{ selectedProject.leader?.fullName || selectedProject.leaderName || 'Chưa cập nhật' }}</p>
              <p class="text-sm text-slate-600"><strong>Mã số sinh viên:</strong> {{ selectedProject.leader?.studentId || selectedProject.leaderStudentId || '—' }}</p>
              <p class="text-sm text-slate-600"><strong>Email:</strong> {{ selectedProject.leader?.email || selectedProject.leaderEmail || '—' }}</p>
              <p class="text-sm text-slate-600"><strong>Vai trò:</strong> Nhóm trưởng</p>
            </div>
          </div>

          <p class="text-sm font-bold text-slate-900 uppercase tracking-wider mt-5 mb-2">Thành viên</p>
          <ul class="mt-1 space-y-1 text-sm text-slate-700">
            <li v-for="(m, index) in (selectedProject.members || [])" :key="m.email || m.studentId || `member-${index}`" class="flex flex-col gap-1 px-3 py-2 rounded-lg border border-slate-100 bg-white">
              <p class="text-sm font-semibold text-slate-900"><strong>Họ tên:</strong> {{ m.fullName || m.userId?.fullName || 'Chưa cập nhật' }}</p>
              <p class="text-sm text-slate-600"><strong>Mã số sinh viên:</strong> {{ m.studentId || m.userId?.studentId || m.studentCode || '—' }}</p>
              <p class="text-sm text-slate-600"><strong>Email:</strong> {{ m.email || m.userId?.email || '—' }}</p>
              <p class="text-sm text-slate-600"><strong>Vai trò:</strong> {{ m.role || 'Thành viên' }}</p>
            </li>
          </ul>
        </div>

        <div v-if="activeTab === 'Tiến độ & Cột mốc'" class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <button @click="showMilestone = true" class="text-xs font-medium text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg">+ Giao cột mốc mới</button>
            <span v-if="milestonesLoading" class="text-xs text-[#0F4C81] animate-pulse">Đang tải…</span>
          </div>

          <div v-if="showMilestone" class="border border-slate-200 rounded-lg p-4 mb-4">
            <input v-model="msTitle" placeholder="Tên cột mốc" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <input v-model="msDue" type="date" :min="tomorrowStr" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <p v-if="msDueError" class="text-xs text-red-600 mb-2">Hạn chót phải từ ngày mai trở đi.</p>
            <button @click="createMilestone" :disabled="creating || !msTitle.trim() || !msDue || msDueError" class="text-xs text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0E4375] transition-colors">Lưu</button>
          </div>

          <div v-if="milestonesError" class="p-4 rounded-lg border border-[#FEE2E2] bg-[#FEF3F2] text-sm text-[#C2410C]">{{ milestonesError }}</div>

          <div v-else-if="milestones.length === 0" class="p-6 rounded-lg border border-slate-200 bg-slate-50 text-center text-sm text-slate-500">Chưa có cột mốc nào cho dự án này.</div>

          <div v-else class="space-y-3">
            <div v-for="m in milestones" :key="m._id" class="border border-slate-200 rounded-xl p-4 bg-white">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B192C]/5 shrink-0">
                    <Calendar class="h-4 w-4 stroke-[1.5] text-[#0B192C]" />
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ m.title || m.name }}</p>
                    <p v-if="m.description" class="text-xs text-slate-500 mt-1 line-clamp-2">{{ m.description }}</p>
                  </div>
                </div>
                <div class="flex items-end gap-3">
                  <span class="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider" :class="statusBadge(m.status)">{{ statusLabel(m.status) }}</span>
                  <span class="text-xs text-slate-500"><Calendar class="h-3 w-3 stroke-[1.5] mr-1" /> {{ formatDate(m.dueDate || m.deadline) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'Góp ý & Đánh giá'" class="space-y-4">
          <div class="bg-[#F8FBFF] rounded-xl border border-[#E4ECF7] p-5">
            <h3 class="text-sm font-bold text-[#0B1F4B] uppercase tracking-wider mb-3">Gửi góp ý cho dự án</h3>
            <textarea v-model="feedbackContent" rows="4" placeholder="Nhận xét của bạn về tiến độ dự án..." class="w-full border border-[#E4ECF7] rounded-lg px-3 py-2 text-sm text-[#0B1F4B] focus:ring-2 focus:ring-[#1E56D9]/30 focus:border-[#1E56D9] outline-none transition-all" />
            <div class="mt-3 flex items-center gap-2">
              <button @click="sendFeedback" :disabled="sending || !feedbackContent.trim()" class="text-xs font-medium text-white bg-[#1E56D9] px-3 py-1.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#1d4ed8] transition-colors">Gửi nhận xét</button>
              <span v-if="sending" class="text-xs text-[#6B7B9A] animate-pulse">Đang gửi…</span>
              <span v-else-if="feedbackStatus" class="text-xs text-emerald-600">{{ feedbackStatus }}</span>
            </div>
          </div>

          <div class="border border-[#E4ECF7] rounded-xl bg-white">
            <h3 class="text-sm font-bold text-[#0B1F4B] uppercase tracking-wider px-5 py-3 border-b border-[#E4ECF7]">Lịch sử góp ý</h3>
            <div v-if="feedbacksLoading" class="p-5 text-center text-sm text-[#6B7B9A]">Đang tải lịch sử góp ý…</div>
            <div v-else-if="feedbacksError" class="p-5 text-center text-sm text-[#C2410C]">{{ feedbacksError }}</div>
            <div v-else-if="feedbacks.length === 0" class="p-5 text-center text-sm text-[#6B7B9A]">Chưa có góp ý nào cho dự án này.</div>
            <div v-else class="divide-y divide-[#E4ECF7]">
              <div v-for="f in feedbacks" :key="f._id" class="px-5 py-4">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                  <span class="text-sm font-semibold text-[#0B1F4B] line-clamp-1">{{ f.content }}</span>
                  <span class="text-xs text-[#6B7B9A]">{{ formatDateTime(f.createdAt) }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium text-[#1E56D9]">
                    <span class="h-2 w-2 rounded-full bg-[#1E56D9]"></span>
                    {{ (f.mentor && f.mentor.fullName) || (f.mentor && f.mentor.email) || 'Giảng viên' }}
                  </span>
                  <span class="text-xs text-[#9BB4E8]">• Dự án {{ projectId }}</span>
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
    PENDING: "bg-amber-50 text-amber-700 border border-amber-100",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border border-blue-100",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    OVERDUE: "bg-rose-50 text-rose-700 border border-rose-100",
  }
  return map[s] || "bg-slate-50 text-slate-700 border border-slate-100"
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

<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-6 space-y-4">
    <h2 class="text-base font-bold text-slate-900">Gửi Email Hàng Loạt đến Sinh viên</h2>

    <!-- Bước 1: Chọn đề tài -->
    <div v-if="step === 1">
      <p class="text-xs text-slate-500 mb-2">Bước 1: Chọn đề tài cần gửi</p>
      <div class="space-y-2">
        <label v-for="p in projects" :key="p.id || p._id" class="flex items-start gap-2 text-sm text-slate-700 border border-slate-100 rounded-lg p-3 hover:bg-slate-50 cursor-pointer transition">
          <input type="checkbox" v-model="selectedProjectIds" :value="p.id || p._id" class="accent-[#0F4C81] mt-1" />
          <div class="flex-1">
            <p class="font-medium text-slate-900">{{ p.title || p.name }}</p>
            <p class="text-xs text-slate-500">{{ (p.members || []).length }} thành viên + Nhóm trưởng</p>
          </div>
          <span class="text-xs text-[#0F4C81] font-medium">{{ selectedProjectIds.includes(p.id || p._id) ? 'Đã chọn' : 'Chọn' }}</span>
        </label>
      </div>
      <p class="text-xs text-slate-500 mt-2">Đã chọn: {{ selectedProjectIds.length }} đề tài</p>
      <button @click="goStep2" :disabled="selectedProjectIds.length === 0" class="text-xs font-medium text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0B3B66] transition-colors">Tiếp tục chọn người nhận</button>
    </div>

    <!-- Bước 2: Chọn từng email cá nhân -->
    <div v-else>
      <div class="flex items-center gap-2 mb-4">
        <button @click="step = 1" class="text-xs text-[#0F4C81] underline hover:text-[#0B3B66]">← Quay lại chọn đề tài</button>
        <span class="text-xs text-slate-400">|</span>
        <p class="text-xs font-semibold text-slate-900">Bước 2: Chọn email người nhận</p>
      </div>

      <div v-if="recipientsLoading" class="p-4 text-center text-sm text-slate-500">Đang tải danh sách người nhận…</div>

      <div v-else-if="totalRecipients === 0" class="p-4 text-center text-sm text-slate-500">Không có địa chỉ email nào để chọn.</div>

      <div v-else class="space-y-4">
        <div v-for="(recips, pid) in recipientMap" :key="pid" class="border border-slate-100 rounded-xl p-3">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="font-semibold text-slate-900">{{ projectNameMap[pid] || 'Đề tài' }}</p>
              <p class="text-xs text-slate-500">{{ recips.length }} người nhận có sẵn</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="toggleAll(pid, true)" class="text-[10px] text-slate-600 hover:text-[#0F4C81] underline px-1">Chọn tất cả</button>
              <button @click="toggleAll(pid, false)" class="text-[10px] text-slate-600 hover:text-[#0F4C81] underline px-1">Bỏ chọn tất cả</button>
            </div>
          </div>

          <!-- Nhóm trưởng -->
          <div v-if="leaderOf(pid)" class="mb-2 pb-2 border-b border-slate-50">
            <label class="flex items-center gap-2 border border-[#FDE68A] rounded-lg p-2 bg-[#FFF7ED] cursor-pointer transition">
              <input type="checkbox" v-model="selectedEmails" :value="leaderOf(pid).email" class="accent-[#0F4C81] mt-0.5" />
              <div class="flex-1">
                <p class="text-sm text-slate-900 break-words">{{ leaderOf(pid).name }}</p>
                <p class="text-xs text-slate-500">{{ leaderOf(pid).email }} <span class="text-[#0F4C81] text-xs font-medium">(Nhóm trưởng)</span></p>
              </div>
            </label>
          </div>

          <!-- Thành viên -->
          <div v-if="membersOf(pid).length > 0">
            <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 ml-1">Thành viên</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label v-for="r in membersOf(pid)" :key="r.email" class="flex items-center gap-2 border border-slate-100 rounded-lg p-2 hover:bg-[#F8FBFF] cursor-pointer transition">
                <input type="checkbox" v-model="selectedEmails" :value="r.email" class="accent-[#0F4C81] mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-slate-900 break-words">{{ r.name }}</p>
                  <p class="text-xs text-slate-500">{{ r.email }} <span v-if="r.role" class="text-[#1E56D9] text-xs">{{ `(${r.role})` }}</span></p>
                </div>
              </label>
            </div>
          </div>

          <!-- Fallback if no separate leader/members split -->
          <div v-if="leaderOf(pid) === null && membersOf(pid).length === 0 && recips.length > 0">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label v-for="r in recips" :key="r.email" class="flex items-center gap-2 border border-slate-100 rounded-lg p-2 hover:bg-[#F8FBFF] cursor-pointer transition">
                <input type="checkbox" v-model="selectedEmails" :value="r.email" class="accent-[#0F4C81] mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm text-slate-900 break-words">{{ r.name }}</p>
                  <p class="text-xs text-slate-500">{{ r.email }} <span class="text-[#0F4C81]">{{ r.isLeader ? '(Nhóm trưởng)' : '' }}</span></p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <p class="text-xs text-slate-500 mt-2">Tổng email đã chọn: <span class="font-semibold text-[#0F4C81]">{{ selectedEmails.length }}</span></p>

      <div class="pt-4 border-t border-slate-100">
        <p class="text-xs text-slate-500 mb-1">Tiêu đề</p>
        <input v-model="subject" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
      </div>
      <div>
        <p class="text-xs text-slate-500 mb-1">Nội dung</p>
        <textarea v-model="body" rows="6" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"></textarea>
      </div>
      <button @click="send" :disabled="sending || selectedEmails.length === 0" class="w-full text-xs font-medium text-white bg-[#0F4C81] px-4 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0B3B66] transition-colors">{{ sending ? 'Đang gửi...' : 'Gửi email đến các địa chỉ đã chọn' }}</button>
      <p v-if="status" class="text-sm text-emerald-600 mt-2">{{ status }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import mentorService from "../common/services/mentorService"

const projects = ref([])
const step = ref(1)
const selectedProjectIds = ref([])
const recipientMap = ref({})
const projectNameMap = ref({})
const recipientsLoading = ref(false)
const selectedEmails = ref([])
const subject = ref("")
const body = ref("")
const status = ref("")
const sending = ref(false)

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const isValidEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

/**
 * Chuẩn hóa bất kỳ item thành cấu trúc { id, name, studentId, email, role }.
 * Hỗ trợ item là string thuần hoặc object có các trường email/userEmail/userId/leaderEmail.
 */
const normalizeRecipient = (item, defaultRole = 'Thành viên') => {
  if (!item) return null
  // Nếu là string thuần -> coi là email
  if (typeof item === 'string') {
    const email = item.trim()
    if (!email) return null
    return { id: email, name: email, studentId: '', email, role: defaultRole }
  }
  // Nếu là object
  const email = item.email || item.userEmail || (item.userId && item.userId.email) || item.leaderEmail || item
  if (!email || typeof email !== 'string' || email.trim() === '') return null
  const emailStr = String(email).trim()
  return {
    id: emailStr,
    name: item.fullName || item.name || item.userId?.fullName || emailStr,
    studentId: item.studentId || item.studentCode || (item.userId && item.userId.studentId) || '',
    email: emailStr,
    role: item.role || defaultRole,
  }
}

const fetchData = async () => {
  try {
    const res = await mentorService.getAssignedProjects()
    projects.value = normalizeList(res)
  } catch (e) {
    projects.value = []
  }
}

const goStep2 = async () => {
  if (selectedProjectIds.value.length === 0) return
  recipientsLoading.value = true
  recipientMap.value = {}
  projectNameMap.value = {}
  try {
    for (const pid of selectedProjectIds.value) {
      const p = projects.value.find((x) => (x.id || x._id) === pid)
      projectNameMap.value[pid] = p ? (p.title || p.name) : 'Đề tài'
      const recips = []

      // Nhóm trưởng: ưu tiên leaderEmail của dự án
      const leaderNorm = normalizeRecipient(
        { email: p?.leaderEmail || p?.leader?.email || '', fullName: p?.leader?.fullName || p?.leaderName || '', role: 'Nhóm trưởng', isLeader: true },
        'Nhóm trưởng'
      )
      if (leaderNorm) {
        leaderNorm.isLeader = true
        recips.push(leaderNorm)
      }

      // Thành viên: hỗ trợ cả mảng nhúng trong project và mảng teamMembers
      const rawMembers = []
      if (p?.members && Array.isArray(p.members)) rawMembers.push(...p.members)
      if (p?.teamMembers && Array.isArray(p.teamMembers)) rawMembers.push(...p.teamMembers)
      const memberObjs = rawMembers.map((m) => normalizeRecipient(m, 'Thành viên')).filter(Boolean)

      // Gộp: nhóm trưởng trước, thành viên sau; loại trùng email
      const seen = new Set()
      const all = []
      recips.forEach((r) => { if (r.email && !seen.has(r.email)) { all.push(r); seen.add(r.email) } })
      memberObjs.forEach((m) => { if (m.email && !seen.has(m.email)) { all.push(m); seen.add(m.email) } })

      recipientMap.value[pid] = all.filter((r) => {
        if (!r.email || typeof r.email !== 'string' || r.email.trim() === '') return false
        return true
      })

      console.log('[SendEmailPage] Danh sách người nhận sau chuẩn hóa:', recipientMap.value[pid])
    }
  } catch (e) {
    recipientMap.value = {}
  } finally {
    recipientsLoading.value = false
  }
  step.value = 2
}

const leaderOf = (pid) => {
  const recips = recipientMap.value[pid] || []
  return recips.find((r) => r.isLeader) || null
}

const membersOf = (pid) => {
  const recips = recipientMap.value[pid] || []
  return recips.filter((r) => !r.isLeader)
}

const totalRecipients = computed(() => {
  let n = 0
  Object.values(recipientMap.value).forEach((list) => { n += list.length })
  return n
})

const toggleAll = (pid, selectAll) => {
  const recips = recipientMap.value[pid] || []
  const emails = recips.map((r) => r.email)
  if (selectAll) {
    emails.forEach((e) => { if (!selectedEmails.value.includes(e)) selectedEmails.value.push(e) })
  } else {
    selectedEmails.value = selectedEmails.value.filter((e) => !emails.includes(e))
  }
}

const send = async () => {
  if (sending.value || selectedEmails.value.length === 0) return
  sending.value = true
  status.value = ""
  try {
    // Chuẩn hóa danh sách email: loại bỏ undefined/null/rỗng, validate định dạng trước khi gửi
    const rawRecipients = selectedEmails.value.filter((e) => e && typeof e === 'string' && e.trim() !== '')
    const invalidEmails = rawRecipients.filter((e) => !isValidEmail(e))
    const recipients = rawRecipients.filter((e) => isValidEmail(e))
    console.log('[SendEmailPage] Payload gửi email:', { emails: recipients, subject: subject.value, content: body.value })
    if (invalidEmails.length > 0) {
      status.value = `Có ${invalidEmails.length} địa chỉ email không hợp lệ đã được loại bỏ.`
    }
    if (recipients.length === 0) {
      status.value = "Không có địa chỉ email hợp lệ để gửi."
      sending.value = false
      return
    }
    const payload = { emails: recipients, subject: subject.value, content: body.value }
    await mentorService.sendBulkEmail(payload)
    status.value = `Đã gửi email thành công đến ${recipients.length} địa chỉ.`
  } catch (e) {
    status.value = "Gửi thất bại: " + (e.response?.data?.message || "")
  } finally {
    sending.value = false
  }
}

onMounted(fetchData)
</script>

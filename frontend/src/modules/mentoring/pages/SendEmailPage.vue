<template>
  <div class="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
    <h2 class="text-base font-semibold tracking-tight text-[#0f172a]">Gửi Email Hàng Loạt đến Sinh viên</h2>

    <!-- Bước 1: Chọn đề tài -->
    <div v-if="step === 1">
      <p class="mb-2 text-xs font-medium text-slate-500">Bước 1: Chọn đề tài cần gửi</p>
      <div class="space-y-2">
        <label v-for="p in projects" :key="p.id || p._id" class="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200/70 p-3 text-sm text-slate-700 transition hover:bg-slate-50">
          <input type="checkbox" v-model="selectedProjectIds" :value="p.id || p._id" class="mt-1 accent-[#1e3a8a]" />
          <div class="flex-1">
            <p class="font-medium text-[#0f172a]">{{ p.title || p.name }}</p>
            <p class="text-xs text-slate-500">{{ (p.members || []).length }} thành viên + Nhóm trưởng</p>
          </div>
          <span class="text-xs font-medium text-[#1e3a8a]">{{ selectedProjectIds.includes(p.id || p._id) ? 'Đã chọn' : 'Chọn' }}</span>
        </label>
      </div>
      <p class="mt-2 text-xs text-slate-500">Đã chọn: {{ selectedProjectIds.length }} đề tài</p>
      <button @click="goStep2" :disabled="selectedProjectIds.length === 0" class="mt-2 rounded-lg bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">Tiếp tục chọn người nhận</button>
    </div>

    <!-- Bước 2: Chọn từng email cá nhân -->
    <div v-else>
      <div class="mb-4 flex items-center gap-2">
        <button @click="step = 1" class="text-xs font-medium text-[#1e3a8a] hover:text-[#172554]">← Quay lại chọn đề tài</button>
        <span class="text-xs text-slate-300">|</span>
        <p class="text-xs font-semibold text-[#0f172a]">Bước 2: Chọn email người nhận</p>
      </div>

      <div v-if="recipientsLoading" class="p-4 text-center text-sm text-slate-500">Đang tải danh sách người nhận…</div>

      <div v-else-if="totalRecipients === 0" class="p-4 text-center text-sm text-slate-500">Không có địa chỉ email nào để chọn.</div>

      <div v-else class="space-y-4">
        <div v-for="(recips, pid) in recipientMap" :key="pid" class="rounded-xl border border-slate-200/70 p-3">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="font-semibold text-[#0f172a]">{{ projectNameMap[pid] || 'Đề tài' }}</p>
              <p class="text-xs text-slate-500">{{ recips.length }} người nhận có sẵn</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="toggleAll(pid, true)" class="px-1 text-[10px] text-slate-600 underline hover:text-[#1e3a8a]">Chọn tất cả</button>
              <button @click="toggleAll(pid, false)" class="px-1 text-[10px] text-slate-600 underline hover:text-[#1e3a8a]">Bỏ chọn tất cả</button>
            </div>
          </div>

          <!-- Nhóm trưởng -->
          <div v-if="leaderOf(pid)" class="mb-2 border-b border-slate-100 pb-2">
            <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200/70 bg-amber-50/50 p-2 transition">
              <input type="checkbox" v-model="selectedEmails" :value="leaderOf(pid).email" class="mt-0.5 accent-[#1e3a8a]" />
              <div class="flex-1">
                <p class="break-words text-sm text-[#0f172a]">{{ leaderOf(pid).name }}</p>
                <p class="text-xs text-slate-500">{{ leaderOf(pid).email }} <span class="text-xs font-medium text-[#1e3a8a]">(Nhóm trưởng)</span></p>
              </div>
            </label>
          </div>

          <!-- Thành viên -->
          <div v-if="membersOf(pid).length > 0">
            <p class="mb-1 ml-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Thành viên</p>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label v-for="r in membersOf(pid)" :key="r.email" class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/70 p-2 transition hover:bg-slate-50">
                <input type="checkbox" v-model="selectedEmails" :value="r.email" class="mt-0.5 accent-[#1e3a8a]" />
                <div class="flex-1">
                  <p class="break-words text-sm text-[#0f172a]">{{ r.name }}</p>
                  <p class="text-xs text-slate-500">{{ r.email }} <span v-if="r.role" class="text-xs text-slate-600">{{ `(${r.role})` }}</span></p>
                </div>
              </label>
            </div>
          </div>

          <!-- Fallback if no separate leader/members split -->
          <div v-if="leaderOf(pid) === null && membersOf(pid).length === 0 && recips.length > 0">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label v-for="r in recips" :key="r.email" class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/70 p-2 transition hover:bg-slate-50">
                <input type="checkbox" v-model="selectedEmails" :value="r.email" class="mt-0.5 accent-[#1e3a8a]" />
                <div class="flex-1">
                  <p class="break-words text-sm text-[#0f172a]">{{ r.name }}</p>
                  <p class="text-xs text-slate-500">{{ r.email }} <span class="text-[#1e3a8a]">{{ r.isLeader ? '(Nhóm trưởng)' : '' }}</span></p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-2 text-xs text-slate-500">Tổng email đã chọn: <span class="font-semibold text-[#1e3a8a]">{{ selectedEmails.length }}</span></p>

      <div class="border-t border-slate-200/70 pt-4">
        <p class="mb-1 text-xs font-medium text-slate-500">Tiêu đề</p>
        <input v-model="subject" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15" />
      </div>
      <div>
        <p class="mb-1 text-xs font-medium text-slate-500">Nội dung</p>
        <textarea v-model="body" rows="6" class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-500/15"></textarea>
      </div>
      <button @click="send" :disabled="sending || selectedEmails.length === 0" class="w-full rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172554] disabled:cursor-not-allowed disabled:opacity-60">{{ sending ? 'Đang gửi...' : 'Gửi email đến các địa chỉ đã chọn' }}</button>
      <p v-if="status" class="mt-2 text-sm text-emerald-600">{{ status }}</p>
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

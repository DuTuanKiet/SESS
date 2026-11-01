<template>
  <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-6 space-y-4">
    <h2 class="text-base font-bold text-slate-900">Gửi Email Hàng Loạt đến Sinh viên</h2>
    <div>
      <p class="text-xs text-slate-500 mb-2">Chọn nhóm nhận</p>
      <div class="space-y-3">
        <label v-for="p in projects" :key="p.id || p._id" class="flex items-start gap-2 text-sm text-slate-700 border border-slate-100 rounded-lg p-3 hover:bg-slate-50">
          <input type="checkbox" v-model="selected" :value="p.id || p._id" class="accent-[#0F4C81] mt-1" />
          <div>
            <p class="font-medium">{{ p.title || p.name }} ({{ p.teamName || 'Nhóm' }})</p>
          <div class="bg-slate-50 border border-slate-300 rounded-xl p-3">
            <p class="text-xs text-slate-500 mt-1">{{ memberEmails(p).join(', ') }}</p>
          </div>
          </div>
        </label>
      </div>
      <p class="text-xs text-slate-500 mt-2">Tổng email nhận: {{ totalEmails }}</p>
    </div>
    <div>
      <p class="text-xs text-slate-500 mb-1">Tiêu đề</p>
      <input v-model="subject" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white" />
    </div>
    <div>
      <p class="text-xs text-slate-500 mb-1">Nội dung</p>
      <textarea v-model="body" rows="6" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"></textarea>
    </div>
    <button @click="send" class="bg-[#0F4C81] hover:bg-[#0B3B66] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition" :disabled="sending">{{ sending ? 'Đang gửi...' : 'Gửi email hàng loạt' }}</button>
    <p v-if="status" class="text-sm text-emerald-600">{{ status }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import mentorService from "../common/services/mentorService"

const projects = ref([])
const selected = ref([])
const subject = ref("")
const body = ref("")
const status = ref("")
const sending = ref(false)

const memberEmails = (p) => {
  const emails = []
  if (p.members && Array.isArray(p.members)) {
    p.members.forEach(m => { if (m.email) emails.push(m.email) })
  }
  if (p.team && Array.isArray(p.team.members)) {
    p.team.members.forEach(m => { if (m.email) emails.push(m.email) })
  }
  return emails.length ? emails : ["(chưa có email)"]
}

const totalEmails = computed(() => {
  let count = 0
  projects.value.forEach(p => {
    if (selected.value.includes(p.id || p._id)) count += memberEmails(p).filter(e => e !== "(chưa có email)").length
  })
  return count
})

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const fetchData = async () => {
  try {
    const res = await mentorService.getAssignedProjects()
    projects.value = normalizeList(res)
  } catch (e) {
    projects.value = []
  }
}

const send = async () => {
  sending.value = true
  try {
    const payload = { groupIds: selected.value, subject: subject.value, content: body.value }
    await mentorService.sendBulkEmail(payload)
    status.value = "Gửi email thành công"
  } catch (e) {
    status.value = "Gửi thất bại"
  } finally {
    sending.value = false
  }
}

onMounted(fetchData)
</script>
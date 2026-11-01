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
          <p class="text-sm text-slate-600">Thành viên:</p>
          <ul class="mt-2 space-y-1 text-sm text-slate-700">
            <li v-for="m in (selectedProject.members || [])" :key="m.email">{{ m.name }} — {{ m.email }}</li>
          </ul>
        </div>

        <div v-if="activeTab === 'Tiến độ & Cột mốc'">
          <button @click="showMilestone = true" class="text-xs font-medium text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg mb-3">+ Giao cột mốc mới</button>
          <div v-if="showMilestone" class="border border-slate-200 rounded-lg p-4 mb-3">
            <input v-model="msTitle" placeholder="Tên cột mốc" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <input v-model="msDue" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <button @click="addMilestone" class="text-xs text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg">Lưu</button>
          </div>
          <ul class="space-y-2">
            <li v-for="m in milestones" :key="m.title" class="text-sm border border-slate-100 rounded-lg p-3">{{ m.title }} — Hạn: {{ m.due }}</li>
          </ul>
        </div>

        <div v-if="activeTab === 'Góp ý & Đánh giá'">
          <textarea v-model="feedback" rows="4" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" placeholder="Nhận xét..."></textarea>
          <button @click="sendFeedback" class="text-xs text-white bg-[#0F4C81] px-3 py-1.5 rounded-lg">Gửi nhận xét</button>
          <p v-if="fbStatus" class="text-sm text-emerald-600 mt-2">{{ fbStatus }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import mentorService from "../common/services/mentorService"

const projects = ref([])
const loading = ref(false)
const selectedProject = ref(null)
const activeTab = ref("Tổng quan")
const tabs = ["Tổng quan", "Tiến độ & Cột mốc", "Góp ý & Đánh giá"]
const showMilestone = ref(false)
const msTitle = ref("")
const msDue = ref("")
const milestones = ref([])
const feedback = ref("")
const fbStatus = ref("")

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
    projects.value = list.length ? list : [
      { id: 1, title: "Smart Agri", teamName: "Nhóm A", status: "Đang triển khai", members: [{ name: "Nguyễn Văn A", email: "a@ctut.edu.vn" }, { name: "Trần Thị B", email: "b@ctut.edu.vn" }] },
    ]
  } catch (e) {
    projects.value = []
  } finally {
    loading.value = false
  }
}

const addMilestone = () => {
  if (!msTitle.value) return
  milestones.value.push({ title: msTitle.value, due: msDue.value })
  msTitle.value = ""; msDue.value = ""; showMilestone.value = false
}

const sendFeedback = () => {
  fbStatus.value = "Đã gửi nhận xét"
}

onMounted(fetchProjects)
</script>
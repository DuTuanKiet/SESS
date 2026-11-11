<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-[#0f172a]">Hồ sơ & Vinh danh</h1>
      <p class="mt-1 text-sm text-slate-500">Thông tin cá nhân, đơn vị công tác và lịch sử thành tích hướng dẫn dự án khởi nghiệp.</p>
    </div>

    <div class="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] sm:p-6">
      <MentorInfoCard :profile="profile" />
    </div>
    <MentorHonorHistoryCard :history="history" :loading="historyLoading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import mentorService from "../common/services/mentorService"
import MentorInfoCard from "@/modules/mentoring/features/profile/components/MentorInfoCard.vue"
import MentorHonorHistoryCard from "@/modules/mentoring/features/profile/components/MentorHonorHistoryCard.vue"

const profile = ref({})
const history = ref([])
const historyLoading = ref(false)

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  if (res && res.data && Array.isArray(res.data.history)) return res.data.history
  return []
}

const fetchData = async () => {
  try {
    const p = await mentorService.getMentorProfile()
    profile.value = p && p.data ? p.data : (p || {})
  } catch (e) {
    profile.value = {}
  }
  historyLoading.value = true
  try {
    const h = await mentorService.getMentorHonorHistory()
    history.value = normalizeList(h)
  } catch (e) {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

onMounted(fetchData)
</script>

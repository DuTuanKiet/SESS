<template>
  <div class="space-y-10">
    <div>
      <h1 class="text-2xl font-bold text-[#0B1F4B] leading-none">Hồ sơ & Vinh danh</h1>
      <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">Thông tin cá nhân, đơn vị công tác và lịch sử thành tích hướng dẫn dự án khởi nghiệp.</p>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] p-6">
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

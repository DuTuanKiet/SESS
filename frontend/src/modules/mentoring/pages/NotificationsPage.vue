<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-[#0f172a]">Thông báo</h1>
      <p class="mt-1 text-sm text-slate-500">Trung tâm thông báo: bài nộp mới, nhắc nhở deadline, cảnh báo và các cập nhật từ hệ thống.</p>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div v-if="loading" class="space-y-4 p-12">
        <div v-for="i in 4" :key="i" class="flex items-start gap-4">
          <SkeletonLoader type="avatar" :height="40" :width="40" border-radius="9999" />
          <div class="flex-1 space-y-2">
            <SkeletonLoader type="text" :height="20" :width="60" />
            <SkeletonLoader type="text" :height="16" :width="70" />
          </div>
          <SkeletonLoader type="badge" :height="24" :width="48" border-radius="9999" />
        </div>
      </div>

      <div v-else-if="error" class="p-12 text-center">
        <EmptyState :icon="AlertCircle" title="Không tải được thông báo" :description="error" iconBg="bg-red-50" iconColor="text-red-600">
          <template #actions>
            <button @click="fetchNotifications" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <RefreshCw class="h-4 w-4" />
              Thử lại
            </button>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="notifications.length === 0" class="p-12 text-center">
        <EmptyState :icon="Inbox" title="Hộp thông báo trong sạch" description="Hiện tại bạn chưa có thông báo mới. Chúng tôi sẽ thông báo kịp thời khi có bài nộp, nhắc nhớ deadline hoặc cập nhật quan trọng." iconBg="bg-slate-100" iconColor="text-slate-500" />
      </div>

      <div v-else class="divide-y divide-slate-200/70">
        <div v-for="n in notifications" :key="n.id || n._id" class="group cursor-pointer px-6 py-5 transition-colors hover:bg-slate-50/70 sm:px-8">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-center gap-2">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset" :class="n.read ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/70' : 'bg-slate-100 text-[#1e3a8a] ring-slate-200/70'">
                  {{ n.read ? "Đã đọc" : "Mới" }}
                </span>
                <span class="ml-auto text-[11px] text-slate-400">{{ formatDate(n.createdAt || n.timestamp) }}</span>
              </div>
              <h3 class="text-[15px] font-semibold text-[#0f172a] transition-colors group-hover:text-[#1e3a8a]">{{ n.title || n.message || "Thông báo" }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ n.content || n.body || n.description || "" }}</p>
            </div>
            <ChevronRight class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#1e3a8a]" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { AlertCircle, Inbox, RefreshCw, ChevronRight } from "lucide-vue-next"
import mentorService from "../common/services/mentorService"
import EmptyState from "@/modules/mentoring/common/components/EmptyState.vue"
import SkeletonLoader from "@/modules/mentoring/common/components/SkeletonLoader.vue"

const notifications = ref([])
const loading = ref(false)
const error = ref("")

const normalizeList = (res) => {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.items)) return res.items
  return []
}

const fetchNotifications = async () => {
  loading.value = true
  error.value = ""
  try {
    const res = await mentorService.getMentorNotifications()
    notifications.value = normalizeList(res)
  } catch (e) {
    error.value = e.response?.data?.message || "Không thể tải danh sách thông báo"
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (d) => {
  if (!d) return ""
  try { return new Date(d).toLocaleString("vi-VN") } catch { return "" }
}

onMounted(fetchNotifications)
</script>

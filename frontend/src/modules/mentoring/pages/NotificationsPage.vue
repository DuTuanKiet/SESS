<template>
  <div class="space-y-10">
    <div>
      <h1 class="text-2xl font-bold text-[#0B1F4B] leading-none">Thông báo</h1>
      <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">Trung tâm thông báo: bài nộp mới, nhắc nhở deadline, cảnh báo và các cập nhật từ hệ thống.</p>
    </div>

    <div class="overflow-hidden rounded-2xl border border-[#E4ECF7] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div v-if="loading" class="p-16 space-y-4">
        <div v-for="i in 4" :key="i" class="flex items-start gap-4">
          <SkeletonLoader type="avatar" :height="40" :width="40" border-radius="9999" />
          <div class="flex-1 space-y-2">
            <SkeletonLoader type="text" :height="20" :width="60" />
            <SkeletonLoader type="text" :height="16" :width="70" />
          </div>
          <SkeletonLoader type="badge" :height="24" :width="48" border-radius="9999" />
        </div>
      </div>

      <div v-else-if="error" class="p-16 text-center">
        <EmptyState :icon="AlertCircle" title="Không tải được thông báo" :description="error" iconBg="bg-[#FEF3F2]" iconColor="text-[#C2410C]">
          <template #actions>
            <button @click="fetchNotifications" class="inline-flex items-center gap-2 rounded-xl border border-[#E4ECF7] bg-white px-5 py-2.5 text-sm font-medium text-[#0B1F4B] shadow-sm hover:bg-[#F8FAFC] transition-colors">
              <RefreshCw class="w-4 h-4 stroke-[1.5]" />
              Thử lại
            </button>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="notifications.length === 0" class="p-16 text-center">
        <EmptyState :icon="Inbox" title="Hộp thông báo trong sạch" description="Hiện tại bạn chưa có thông báo mới. Chúng tôi sẽ thông báo kịp thời khi có bài nộp, nhắc nhớ deadline hoặc cập nhật quan trọng." iconBg="bg-[#F1F7FF]" iconColor="text-[#9BB4E8]" />
      </div>

      <div v-else class="divide-y divide-[#E4ECF7]">
        <div v-for="n in notifications" :key="n.id || n._id" @click="handleNotificationClick(n)" class="px-8 py-6 transition-colors hover:bg-[#F8FBFF]/60 cursor-pointer group">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="n.read ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-[#1E56D9]/10 text-[#1E56D9] border border-[#1E56D9]/20'">
                  {{ n.read ? "Đã đọc" : "Mới" }}
                </span>
                <span class="ml-auto text-[11px] text-[#9BB4E8] leading-none">{{ formatDate(n.createdAt || n.timestamp) }}</span>
              </div>
              <h3 class="text-base font-semibold text-[#0B1F4B] leading-none group-hover:text-[#1E56D9] transition-colors">{{ n.title || n.message || "Thông báo" }}</h3>
              <p class="mt-1 text-sm text-[#6B7B9A] leading-relaxed">{{ n.content || n.body || n.description || "" }}</p>
            </div>
            <ChevronRight class="h-4 w-4 text-[#C7D7F5] group-hover:text-[#1E56D9] transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { getLoginRedirect } from '@/router/authRedirect';
import { ref, onMounted } from "vue"
import { AlertCircle, Inbox, RefreshCw, ChevronRight } from "lucide-vue-next"
import mentorService from "../common/services/mentorService"
import EmptyState from "@/modules/mentoring/common/components/EmptyState.vue"
import SkeletonLoader from "@/modules/mentoring/common/components/SkeletonLoader.vue"

const router = useRouter();
const authStore = useAuthStore();
const readingIds = new Set();

// Merge: giữ giao diện mentor dev; click đọc qua API chung rồi tới đích nội bộ đúng quyền.
async function handleNotificationClick(notification) {
  const id = notification.id || notification._id;
  if (readingIds.has(id)) return;
  const generation = authStore.sessionVersion;
  readingIds.add(id);
  try {
    if (!notification.read) await mentorService.markNotificationAsRead(id);
    if (generation !== authStore.sessionVersion) return;
    notification.read = true;
    notification.isRead = true;
    const target = notification.actionUrl || notification.link;
    if (target) await router.push(getLoginRedirect(router, { user: authStore.user, requestedPath: target }));
  } catch {
    if (generation === authStore.sessionVersion) error.value = 'Không thể mở thông báo. Vui lòng thử lại.';
  } finally {
    readingIds.delete(id);
  }
}

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

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToastStore } from '@/stores/toast';
import { evaluatorService } from '@/services/evaluatorService';
import { Bell, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-vue-next';

const router = useRouter();
const toastStore = useToastStore();

const notifications = ref([]);
const isLoading = ref(false);
const error = ref('');

const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length);

function typeVariant(type) {
  const map = {
    info: 'bg-indigo-50 border-indigo-100/80',
    warning: 'bg-amber-50 border-amber-100/80',
    success: 'bg-emerald-50 border-emerald-100/80',
  };
  return map[type] || map.info;
}

function typeIconColor(type) {
  const map = {
    info: 'text-indigo-600',
    warning: 'text-amber-600',
    success: 'text-emerald-600',
  };
  return map[type] || map.info;
}

function formatTime(createdAt) {
  if (!createdAt) return '—';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function loadNotifications() {
  isLoading.value = true;
  error.value = '';
  try {
    const res = await evaluatorService.getNotifications({ limit: 100 });
    const payload = res?.data || res || {};
    notifications.value = payload.notifications || payload.data || payload || [];
    if (!Array.isArray(notifications.value)) notifications.value = [];
  } catch (e) {
    error.value = e?.message || 'Không tải được danh sách thông báo.';
    toastStore.add({ message: error.value, type: 'error', duration: 5000 });
  } finally {
    isLoading.value = false;
  }
}

async function markAsRead(notification) {
  if (!notification || notification.isRead) return;
  try {
    await evaluatorService.markNotificationAsRead(notification._id);
    notification.isRead = true;
  } catch (e) {
    toastStore.add({ message: e?.message || 'Không thể đánh dấu đã đọc.', type: 'error', duration: 4000 });
  }
}

async function markAllAsRead() {
  try {
    await evaluatorService.markAllNotificationsAsRead();
    notifications.value.forEach((n) => { n.isRead = true; });
    toastStore.add({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.', type: 'success', duration: 3000 });
  } catch (e) {
    toastStore.add({ message: e?.message || 'Không thể đánh dấu tất cả đã đọc.', type: 'error', duration: 5000 });
  }
}

async function goTo(notification) {
  await markAsRead(notification);
  if (!notification?.link) return;
  router.push(notification.link);
}

onMounted(loadNotifications);
</script>

<template>
  <div class="judge-notifications">
    <div class="mx-auto max-w-5xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-200/70">Cập nhật hệ thống</p>
          <h1 class="text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl">Thông báo</h1>
          <p class="mt-1.5 text-sm text-slate-500">Cập nhật từ Ban Tổ Chức và hệ thống SESS liên quan đến công tác chấm điểm.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="unreadCount > 0" class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/70">{{ unreadCount }} chưa đọc</span>
          <button type="button" @click="loadNotifications" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-px hover:text-slate-900 hover:shadow-md"><RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />Tải lại</button>
          <button v-if="unreadCount > 0" type="button" @click="markAllAsRead" class="inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(79,70,229,0.8)] transition hover:-translate-y-px hover:bg-indigo-500">Đánh dấu tất cả đã đọc</button>
        </div>
      </div>

      <div v-if="error && !isLoading" role="alert" class="mb-4 flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800"><AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-500" /><span>{{ error }}</span></div>

      <div v-if="isLoading && notifications.length === 0" class="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white py-20 text-sm text-slate-500 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]"><Clock class="mb-2 h-5 w-5 animate-spin text-indigo-500" /><span>Đang tải thông báo...</span></div>

      <div v-else-if="notifications.length === 0" class="rounded-2xl border border-slate-200/60 bg-white px-6 py-16 text-center shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-indigo-50 text-slate-400 ring-1 ring-slate-200/70"><CheckCircle class="h-6 w-6" /></div>
        <h3 class="text-sm font-semibold text-slate-900">Không có thông báo nào</h3>
        <p class="mx-auto mt-1 max-w-md text-[13px] text-slate-500">Bạn đã xem hết thông báo hiện có hoặc chưa có cập nhật mới từ Ban Tổ Chức.</p>
      </div>

      <div v-else class="space-y-3">
        <article v-for="notif in notifications" :key="String(notif._id)" @click="goTo(notif)" class="group cursor-pointer rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/70 hover:shadow-[0_18px_40px_-22px_rgba(79,70,229,0.18)] sm:p-5" :class="notif.isRead ? '' : 'ring-1 ring-inset ring-indigo-200/60'">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border" :class="typeVariant(notif.type)"><Bell class="h-4 w-4" :class="typeIconColor(notif.type)" /></div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700">{{ notif.title || 'Thông báo hệ thống' }}</h3>
                <span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="notif.isRead ? 'bg-slate-50 text-slate-400 ring-slate-200/70' : 'bg-indigo-50 text-indigo-700 ring-indigo-200/70'">{{ notif.isRead ? 'Đã đọc' : 'Mới' }}</span>
              </div>
              <p class="mb-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{{ notif.content || notif.message || '—' }}</p>
              <div class="flex items-center gap-2 text-[11px] text-slate-400"><Clock class="h-3 w-3" /><span>{{ formatTime(notif.createdAt) }}</span><span v-if="notif.link" class="ml-auto font-semibold text-indigo-700">Mở chi tiết →</span></div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

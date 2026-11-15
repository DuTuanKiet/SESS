<template>
  <div class="font-sans bg-white min-h-[75vh]">
    <!-- 1. HEADER TRANG THÔNG BÁO -->
    <section class="bg-[#F1F7FF] border-b border-[#E4ECF7] py-8 lg:py-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5 max-w-2xl">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-bold text-[#0B1F4B] tracking-tight">
              Thông báo của Bạn
            </h1>
            <span
              v-if="notificationStore.unreadCount > 0"
              class="inline-flex items-center rounded-full bg-[#1E56D9] px-2.5 py-0.5 text-xs font-semibold text-white"
            >
              {{ notificationStore.unreadCount }} chưa đọc
            </span>
          </div>
          <p class="text-sm text-[#4B5B7A] leading-relaxed">
            Theo dõi lời mời tham gia nhóm, phản hồi từ Giảng viên Cố vấn và các cập nhật đề tài khởi nghiệp.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            :disabled="notificationStore.isLoading"
            @click="handleRefresh"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#C7D7F5] bg-white px-4 py-2 text-xs font-semibold text-[#0B1F4B] shadow-2xs transition hover:bg-slate-50 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': notificationStore.isLoading }" />
            <span>Tải lại</span>
          </button>

          <button
            v-if="notificationStore.unreadCount > 0"
            type="button"
            :disabled="notificationStore.isLoading || notificationStore.isUpdating"
            @click="handleMarkAllRead"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1E56D9] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8] cursor-pointer disabled:opacity-60"
          >
            <CheckCheck class="w-3.5 h-3.5" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 2. KHU VỰC NỘI DUNG CHÍNH: DANH SÁCH & CHI TIẾT THÔNG BÁO -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Cảnh báo lỗi khi tải dữ liệu -->
      <div
        v-if="notificationStore.error"
        role="alert"
        class="mb-6 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <span>{{ notificationStore.error }}</span>
        </div>
        <button
          type="button"
          @click="handleRefresh"
          class="text-xs font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
        >
          Thử lại
        </button>
      </div>

      <!-- Loading lần đầu -->
      <div
        v-if="notificationStore.isLoading && notificationStore.notifications.length === 0"
        class="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <div class="lg:col-span-5 space-y-3">
          <div
            v-for="i in 4"
            :key="i"
            class="rounded-2xl border border-[#E4ECF7] bg-white p-4 animate-pulse space-y-2.5"
          >
            <div class="h-3.5 bg-slate-100 rounded w-1/3"></div>
            <div class="h-4 bg-slate-100 rounded w-3/4"></div>
            <div class="h-3 bg-slate-50 rounded w-full"></div>
          </div>
        </div>
        <div class="lg:col-span-7 rounded-2xl border border-[#E4ECF7] bg-[#F8FBFF] p-8 animate-pulse space-y-4">
          <div class="h-5 bg-slate-100 rounded w-1/4"></div>
          <div class="h-6 bg-slate-100 rounded w-2/3"></div>
          <div class="h-24 bg-slate-100 rounded w-full"></div>
        </div>
      </div>

      <!-- Bố cục Master-Detail Responsive cho Mobile, Tablet và Desktop -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Cột Danh sách Thông báo (Desktop bên trái 5/12; Mobile/Tablet xếp dưới khung chi tiết khi đã chọn) -->
        <section
          class="lg:col-span-5 lg:order-1 rounded-2xl border border-[#E4ECF7] bg-white overflow-hidden shadow-xs"
          :class="selectedNotification ? 'order-2' : 'order-1'"
        >
          <!-- Tabs Lọc -->
          <div class="flex items-center justify-between border-b border-[#E4ECF7] bg-[#F8FBFF] px-4">
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="handleFilterChange('all')"
                class="px-3 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer"
                :class="
                  notificationStore.activeFilter === 'all'
                    ? 'border-[#1E56D9] text-[#1E56D9]'
                    : 'border-transparent text-[#4B5B7A] hover:text-[#0B1F4B]'
                "
              >
                Tất cả
              </button>
              <button
                type="button"
                @click="handleFilterChange('unread')"
                class="px-3 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
                :class="
                  notificationStore.activeFilter === 'unread'
                    ? 'border-[#1E56D9] text-[#1E56D9]'
                    : 'border-transparent text-[#4B5B7A] hover:text-[#0B1F4B]'
                "
              >
                <span>Chưa đọc</span>
                <span
                  v-if="notificationStore.unreadCount > 0"
                  class="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                >
                  {{ notificationStore.unreadCount }}
                </span>
              </button>
            </div>
            <span class="text-[11px] text-[#4B5B7A]">
              {{ notificationStore.notifications.length }} thông báo
            </span>
          </div>

          <!-- Trạng thái trống -->
          <div
            v-if="notificationStore.notifications.length === 0"
            class="p-10 text-center"
          >
            <div class="w-12 h-12 rounded-2xl bg-[#F1F7FF] text-[#1E56D9] mx-auto flex items-center justify-center mb-3">
              <Inbox class="w-6 h-6" />
            </div>
            <h3 class="text-sm font-bold text-[#0B1F4B]">
              {{
                notificationStore.activeFilter === 'unread'
                  ? 'Không có thông báo chưa đọc'
                  : 'Chưa có thông báo nào'
              }}
            </h3>
            <p class="mt-1 text-xs text-[#4B5B7A]">
              {{
                notificationStore.activeFilter === 'unread'
                  ? 'Bạn đã đọc hết tất cả thông báo hiện tại.'
                  : 'Các cập nhật về đề tài và lời mời nhóm sẽ xuất hiện tại đây.'
              }}
            </p>
          </div>

          <!-- Danh sách các mục thông báo -->
          <div v-else class="divide-y divide-[#E4ECF7] max-h-[600px] overflow-y-auto">
            <button
              v-for="item in notificationStore.notifications"
              :key="item.id"
              type="button"
              @click="handleSelectNotification(item)"
              class="w-full text-left p-4 transition-colors cursor-pointer flex items-start gap-3 relative"
              :class="[
                selectedNotification?.id === item.id
                  ? 'bg-[#F1F7FF] ring-1 ring-inset ring-[#C7D7F5]'
                  : item.isRead
                    ? 'bg-white hover:bg-slate-50'
                    : 'bg-blue-50/35 hover:bg-blue-50/60',
              ]"
            >
              <div
                class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                :class="getTypeMeta(item.type).iconBoxClass"
              >
                <component :is="getTypeMeta(item.type).icon" class="w-4 h-4" />
              </div>

              <div class="flex-1 min-w-0 pr-3">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span
                    class="text-[10px] font-semibold uppercase tracking-wider"
                    :class="getTypeMeta(item.type).labelClass"
                  >
                    {{ getTypeMeta(item.type).label }}
                  </span>
                  <span class="text-[11px] text-[#4B5B7A] shrink-0">
                    {{ formatRelativeTime(item.createdAt) }}
                  </span>
                </div>
                <h4
                  class="text-xs sm:text-sm text-[#0B1F4B] truncate"
                  :class="item.isRead ? 'font-medium' : 'font-bold'"
                >
                  {{ item.title }}
                </h4>
                <p class="mt-0.5 text-xs text-[#4B5B7A] line-clamp-2 leading-relaxed">
                  {{ item.message || item.content }}
                </p>
              </div>

              <span
                v-if="!item.isRead"
                class="w-2 h-2 rounded-full bg-[#1E56D9] absolute right-3.5 top-4.5 shrink-0"
                title="Chưa đọc"
              ></span>
            </button>

            <div v-if="notificationStore.hasMore" class="p-3 text-center bg-slate-50/60">
              <button
                type="button"
                :disabled="notificationStore.isLoading"
                @click="notificationStore.loadMore()"
                class="text-xs font-semibold text-[#1E56D9] hover:underline cursor-pointer disabled:text-slate-400"
              >
                {{ notificationStore.isLoading ? 'Đang tải...' : 'Tải thêm thông báo' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Cột Khung Chi tiết Thông báo (Desktop bên phải 7/12; Mobile/Tablet hiện trước để đọc ngay) -->
        <section
          class="lg:col-span-7 lg:order-2 rounded-2xl border border-[#E4ECF7] bg-white p-6 sm:p-8 shadow-xs min-h-[340px] flex flex-col"
          :class="selectedNotification ? 'order-1' : 'order-2'"
        >
          <template v-if="selectedNotification">
            <div class="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#E4ECF7]">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                  :class="getTypeMeta(selectedNotification.type).iconBoxClass"
                >
                  <component :is="getTypeMeta(selectedNotification.type).icon" class="w-5 h-5" />
                </div>
                <div>
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border"
                    :class="getTypeMeta(selectedNotification.type).badgeClass"
                  >
                    {{ getTypeMeta(selectedNotification.type).label }}
                  </span>
                  <div class="mt-1 flex items-center gap-1.5 text-xs text-[#4B5B7A]">
                    <Clock class="w-3.5 h-3.5" />
                    <span>{{ formatDateTime(selectedNotification.createdAt) }}</span>
                    <span>•</span>
                    <span>{{ formatRelativeTime(selectedNotification.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                :class="
                  selectedNotification.isRead
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-blue-50 text-[#1E56D9] border border-[#C7D7F5]'
                "
              >
                {{ selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc' }}
              </span>
            </div>

            <div class="py-6 flex-1 space-y-4">
              <h2 class="text-lg sm:text-xl font-bold text-[#0B1F4B] leading-snug">
                {{ selectedNotification.title }}
              </h2>
              <div class="rounded-xl bg-[#F8FBFF] border border-[#E4ECF7] p-4 sm:p-5">
                <p class="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                  {{ selectedNotification.content || selectedNotification.message || 'Không có nội dung chi tiết.' }}
                </p>
              </div>
            </div>

            <div class="pt-5 border-t border-[#E4ECF7] flex flex-wrap items-center justify-between gap-3">
              <button
                v-if="!selectedNotification.isRead"
                type="button"
                :disabled="notificationStore.isUpdating"
                @click="handleMarkSingleRead(selectedNotification.id)"
                class="inline-flex items-center gap-1.5 rounded-full border border-[#C7D7F5] bg-white px-4 py-2 text-xs font-semibold text-[#1E56D9] hover:bg-[#F1F7FF] transition cursor-pointer"
              >
                <CheckCheck class="w-3.5 h-3.5" />
                <span>Đánh dấu đã đọc</span>
              </button>
              <span v-else class="text-xs text-[#4B5B7A]">
                Bạn đã xem thông báo này.
              </span>

              <button
                v-if="hasValidTargetUrl(selectedNotification.targetUrl)"
                type="button"
                @click="handleGoToTarget(selectedNotification.targetUrl)"
                class="inline-flex items-center gap-2 rounded-full bg-[#1E56D9] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1d4ed8] cursor-pointer ml-auto"
              >
                <span>Đi tới nội dung liên quan</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </template>

          <template v-else>
            <div class="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div class="w-14 h-14 rounded-2xl bg-[#F1F7FF] text-[#1E56D9] flex items-center justify-center mb-4">
                <Bell class="w-6 h-6" />
              </div>
              <h3 class="text-base font-bold text-[#0B1F4B]">
                Chọn một thông báo để xem chi tiết
              </h3>
              <p class="mt-1.5 max-w-sm text-xs sm:text-sm text-[#4B5B7A] leading-relaxed">
                Nhấn vào bất kỳ thông báo nào ở danh sách bên cạnh để đọc toàn bộ nội dung và mở liên kết đề tài tương ứng.
              </p>
            </div>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Trang Thông báo dành cho Sinh viên (/student/notifications).
 * Hỗ trợ đọc chi tiết thông báo khi điều hướng từ chuông Navbar (?id=...) và lọc trạng thái đã đọc/chưa đọc.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Inbox,
  Info,
  MessageSquare,
  RefreshCw,
  Trophy,
  UserPlus,
  XCircle,
} from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notificationStore';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const toastStore = useToastStore();

const selectedId = ref(String(route.query.id || ''));
// Lưu lại thông báo vừa xem để không bị mất khỏi khung chi tiết khi đang bật bộ lọc 'unread'
const cachedSelectedItem = ref(null);

const selectedNotification = computed(() => {
  const list = notificationStore.notifications;
  if (selectedId.value) {
    const matched = list.find((item) => item.id === selectedId.value);
    if (matched) return matched;
    if (cachedSelectedItem.value?.id === selectedId.value) return cachedSelectedItem.value;
  }
  return list[0] || null;
});

function hasValidTargetUrl(targetUrl) {
  return Boolean(targetUrl && targetUrl.startsWith('/') && !targetUrl.startsWith('//'));
}

async function handleSelectNotification(item) {
  if (!item?.id) return;
  selectedId.value = item.id;
  cachedSelectedItem.value = { ...item, isRead: true };
  router.replace({ name: 'student-notifications', query: { id: item.id } });
  if (!item.isRead) {
    await notificationStore.markAsRead(item.id);
  }
}

async function handleMarkSingleRead(id) {
  if (!id) return;
  if (cachedSelectedItem.value?.id === id) {
    cachedSelectedItem.value = { ...cachedSelectedItem.value, isRead: true };
  }
  await notificationStore.markAsRead(id);
}

async function handleFilterChange(filter) {
  await notificationStore.setFilter(filter);
}

async function handleRefresh() {
  await notificationStore.fetchNotifications({ page: 1 });
}

async function handleMarkAllRead() {
  const isSuccess = await notificationStore.markAllAsRead();
  if (isSuccess) {
    if (cachedSelectedItem.value) {
      cachedSelectedItem.value = { ...cachedSelectedItem.value, isRead: true };
    }
    toastStore.add({
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      type: 'success',
      duration: 3000,
    });
  }
}

function handleGoToTarget(targetUrl) {
  if (!hasValidTargetUrl(targetUrl)) return;
  router.push(targetUrl);
}

function getTypeMeta(type) {
  switch (type) {
    case 'invitation':
      return {
        label: 'Lời mời nhóm',
        icon: UserPlus,
        iconBoxClass: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        labelClass: 'text-indigo-600',
      };
    case 'feedback':
      return {
        label: 'Phản hồi cố vấn',
        icon: MessageSquare,
        iconBoxClass: 'bg-blue-50 text-[#1E56D9] border-blue-200',
        badgeClass: 'bg-blue-50 text-[#1E56D9] border-blue-200',
        labelClass: 'text-[#1E56D9]',
      };
    case 'project':
      return {
        label: 'Cập nhật đề tài',
        icon: ClipboardCheck,
        iconBoxClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        labelClass: 'text-emerald-600',
      };
    case 'competition':
      return {
        label: 'Cuộc thi',
        icon: Trophy,
        iconBoxClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        labelClass: 'text-emerald-600',
      };
    case 'warning':
    case 'cancellation':
      return {
        label: 'Cảnh báo',
        icon: AlertTriangle,
        iconBoxClass: 'bg-amber-50 text-amber-600 border-amber-200',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        labelClass: 'text-amber-600',
      };
    case 'error':
      return {
        label: 'Lưu ý quan trọng',
        icon: XCircle,
        iconBoxClass: 'bg-rose-50 text-rose-600 border-rose-200',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        labelClass: 'text-rose-600',
      };
    case 'success':
    case 'review':
      return {
        label: 'Kết quả xét duyệt',
        icon: CircleCheck,
        iconBoxClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        labelClass: 'text-emerald-600',
      };
    case 'info':
    case 'system':
    default:
      return {
        label: 'Thông báo hệ thống',
        icon: Info,
        iconBoxClass: 'bg-[#F1F7FF] text-[#1E56D9] border-[#C7D7F5]',
        badgeClass: 'bg-[#F1F7FF] text-[#1E56D9] border-[#C7D7F5]',
        labelClass: 'text-[#1E56D9]',
      };
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const past = new Date(dateString).getTime();
  if (Number.isNaN(past)) return '';
  const diffMs = Date.now() - past;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

async function syncNotificationSelection(queryId) {
  if (queryId) {
    selectedId.value = String(queryId);
    // Nếu thông báo vừa click từ chuông không có trong tab 'unread', chuyển về 'all' để luôn hiển thị chi tiết
    if (notificationStore.activeFilter === 'unread') {
      await notificationStore.setFilter('all');
    }
  }
  if (notificationStore.notifications.length === 0 && !notificationStore.isLoading) {
    await notificationStore.fetchNotifications({ page: 1 });
  }
  const target = notificationStore.notifications.find((item) => item.id === selectedId.value);
  if (target) {
    cachedSelectedItem.value = target;
    if (!target.isRead) {
      await notificationStore.markAsRead(target.id);
    }
  }
}

watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      syncNotificationSelection(newId);
    }
  },
);

onMounted(() => {
  syncNotificationSelection(route.query.id);
});
</script>

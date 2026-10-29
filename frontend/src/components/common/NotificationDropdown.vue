<template>
  <div class="relative" ref="dropdownRef">
    <!-- Nút Chuông Thông Báo -->
    <button
      type="button"
      @click="toggleDropdown"
      class="relative p-2.5 rounded-full text-slate-600 hover:text-[#0B1F4B] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E56D9]/20 cursor-pointer"
      :class="{ 'bg-slate-100 text-[#0B1F4B]': isOpen }"
      title="Thông báo"
      aria-label="Xem thông báo"
    >
      <Bell class="w-5 h-5" />

      <!-- Badge hiển thị số lượng chưa đọc (Tĩnh, không nhấp nháy giật mắt) -->
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs"
      >
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </button>

    <!-- Popover Danh Sách Thông Báo -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[520px]"
      >
        <!-- Header Popover -->
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-[#0B1F4B]">Thông báo</h3>
            <span
              v-if="notificationStore.unreadCount > 0"
              class="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E56D9] text-[11px] font-semibold"
            >
              {{ notificationStore.unreadCount }} mới
            </span>
          </div>

          <button
            v-if="notificationStore.unreadCount > 0"
            type="button"
            @click="handleMarkAllRead"
            class="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E56D9] hover:text-[#1d4ed8] transition-colors cursor-pointer"
          >
            <CheckCheck class="w-3.5 h-3.5" />
            <span>Đã đọc tất cả</span>
          </button>
        </div>

        <!-- Tabs Lọc -->
        <div class="flex border-b border-slate-100 px-4 bg-slate-50/50 shrink-0">
          <button
            type="button"
            @click="notificationStore.setFilter('all')"
            class="py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer"
            :class="
              notificationStore.activeFilter === 'all'
                ? 'border-[#1E56D9] text-[#1E56D9]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            "
          >
            Tất cả
          </button>
          <button
            type="button"
            @click="notificationStore.setFilter('unread')"
            class="py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5"
            :class="
              notificationStore.activeFilter === 'unread'
                ? 'border-[#1E56D9] text-[#1E56D9]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            "
          >
            <span>Chưa đọc</span>
            <span
              v-if="notificationStore.unreadCount > 0"
              class="w-2 h-2 rounded-full bg-red-500"
            ></span>
          </button>
        </div>

        <!-- Danh Sách Nội Dung Thông Báo Cuộn Dọc -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
          <!-- Trạng thái đang tải -->
          <div v-if="notificationStore.isLoading" class="p-8 text-center text-slate-400">
            <div
              class="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin text-[#1E56D9]"
            ></div>
            <p class="mt-2 text-xs">Đang tải thông báo...</p>
          </div>

          <!-- Trạng thái trống (Empty State) -->
          <div
            v-else-if="notificationStore.filteredNotifications.length === 0"
            class="p-8 text-center"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3"
            >
              <Inbox class="w-6 h-6" />
            </div>
            <p class="text-xs font-medium text-slate-600">
              {{
                notificationStore.activeFilter === 'unread'
                  ? 'Bạn không có thông báo chưa đọc nào.'
                  : 'Không có thông báo mới nào.'
              }}
            </p>
          </div>

          <!-- Danh sách từng thẻ thông báo -->
          <div
            v-for="item in notificationStore.filteredNotifications"
            :key="item.id"
            @click="handleNotificationClick(item)"
            class="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative group"
            :class="{ 'bg-blue-50/30': !item.isRead }"
          >
            <!-- Icon theo loại thông báo -->
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
              :class="getTypeBadgeConfig(item.type).classes"
            >
              <component :is="getTypeBadgeConfig(item.type).icon" class="w-4 h-4" />
            </div>

            <!-- Nội dung thông báo -->
            <div class="flex-1 min-w-0 pr-3">
              <div class="flex items-center justify-between gap-2 mb-1">
                <h4
                  class="text-xs font-semibold text-[#0B1F4B] truncate"
                  :class="{ 'font-bold': !item.isRead }"
                >
                  {{ item.title }}
                </h4>
                <span class="text-[10px] text-slate-400 shrink-0">
                  {{ formatRelativeTime(item.createdAt) }}
                </span>
              </div>
              <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {{ item.message }}
              </p>
            </div>

            <!-- Chấm xanh đánh dấu chưa đọc -->
            <div
              v-if="!item.isRead"
              class="w-2 h-2 rounded-full bg-[#1E56D9] absolute right-3 top-4 shrink-0 shadow-xs"
              title="Chưa đọc"
            ></div>
          </div>
        </div>

        <!-- Footer Popover -->
        <div class="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <router-link
            to="/student/notifications"
            @click="isOpen = false"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E56D9] hover:text-[#1d4ed8] transition-colors"
          >
            <span>Xem tất cả thông báo</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bell,
  CheckCheck,
  Clock,
  MessageSquare,
  Trophy,
  Info,
  ExternalLink,
  Inbox,
} from 'lucide-vue-next';
import { useNotificationStore } from '@/stores/notificationStore';

const router = useRouter();
const notificationStore = useNotificationStore();

const isOpen = ref(false);
const dropdownRef = ref(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && notificationStore.notifications.length === 0) {
    notificationStore.fetchNotifications();
  }
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

function handleNotificationClick(item) {
  notificationStore.markAsRead(item.id);
  isOpen.value = false;
  if (item.targetUrl) {
    router.push(item.targetUrl);
  }
}

function handleMarkAllRead() {
  notificationStore.markAllAsRead();
}

/**
 * Cấu hình Icon và Class theo loại thông báo
 */
function getTypeBadgeConfig(type) {
  switch (type) {
    case 'deadline':
      return {
        icon: Clock,
        classes: 'bg-amber-50 text-amber-600 border-amber-200',
      };
    case 'feedback':
      return {
        icon: MessageSquare,
        classes: 'bg-blue-50 text-[#1E56D9] border-blue-200',
      };
    case 'competition':
      return {
        icon: Trophy,
        classes: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      };
    case 'system':
    default:
      return {
        icon: Info,
        classes: 'bg-purple-50 text-purple-600 border-purple-200',
      };
  }
}

/**
 * Format thời gian tương đối thân thiện theo tiếng Việt
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffMs = now - past;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Vừa xong';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN');
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Khởi tạo nạp thông báo ban đầu
  notificationStore.fetchNotifications();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>


import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationService } from '@/services/notificationService';

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([]);
  const isLoading = ref(false);
  const activeFilter = ref('all'); // 'all' | 'unread'
  const error = ref(null);

  // Getters
  const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length);

  const filteredNotifications = computed(() => {
    const list =
      activeFilter.value === 'unread'
        ? notifications.value.filter((n) => !n.isRead)
        : [...notifications.value];

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  // Adapter chuẩn hoá dữ liệu
  function normalizeNotificationList(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
  }

  // Actions
  async function fetchNotifications() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await notificationService.getNotifications();
      notifications.value = normalizeNotificationList(res);
      return notifications.value;
    } catch (err) {
      error.value = 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.';
      console.error('[NotificationStore] Fetch error:', err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function markAsRead(id) {
    const target = notifications.value.find((n) => n.id === id);
    if (!target || target.isRead) return;

    // Cập nhật lạc quan (Optimistic update)
    target.isRead = true;

    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      // Rollback nếu thất bại
      target.isRead = false;
      console.error('[NotificationStore] Mark read error:', err);
    }
  }

  async function markAllAsRead() {
    if (unreadCount.value === 0) return;

    // Lưu lại trạng thái cũ phòng khi thất bại
    const previousState = notifications.value.map((n) => ({ id: n.id, isRead: n.isRead }));
    notifications.value.forEach((n) => {
      n.isRead = true;
    });

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      // Rollback
      notifications.value = notifications.value.map((n) => {
        const prev = previousState.find((p) => p.id === n.id);
        return prev ? { ...n, isRead: prev.isRead } : n;
      });
      console.error('[NotificationStore] Mark all read error:', err);
    }
  }

  function setFilter(filter) {
    activeFilter.value = filter;
  }

  return {
    notifications,
    isLoading,
    activeFilter,
    error,
    unreadCount,
    filteredNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setFilter,
  };
});


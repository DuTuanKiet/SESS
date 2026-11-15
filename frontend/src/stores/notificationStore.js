import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { notificationService } from '@/services/notificationService';

const DEFAULT_PAGE_SIZE = 20;

// Chuẩn hóa bản ghi thông báo để tương thích với cấu trúc Backend (content/link/_id) lẫn legacy (message/actionUrl/id)
function normalizeNotification(notification) {
  return {
    ...notification,
    id: String(notification.id ?? notification._id ?? ''),
    title: notification.title || 'Thông báo hệ thống',
    message: notification.message ?? notification.content ?? '',
    content: notification.content ?? notification.message ?? '',
    type: notification.type || 'info',
    isRead: Boolean(notification.isRead ?? notification.read ?? false),
    targetUrl: notification.targetUrl ?? notification.actionUrl ?? notification.link ?? '',
  };
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const isUpdating = ref(false);
  const activeFilter = ref('all');
  const error = ref(null);
  const pagination = ref({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  });
  let latestFetchId = 0;
  let sessionGeneration = 0;
  const loadedUserId = ref('');
  const hasInitialLoaded = ref(false);

  const filteredNotifications = computed(() => notifications.value);
  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages);

  async function fetchNotifications({ page = 1, append = false } = {}) {
    const fetchId = ++latestFetchId;
    isLoading.value = true;
    error.value = null;

    try {
      const response = await notificationService.getNotifications({
        status: activeFilter.value,
        page,
        limit: pagination.value.limit,
      });
      if (fetchId !== latestFetchId) return notifications.value;

      const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
      const rawList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : [];
      const fetchedNotifications = rawList.map(normalizeNotification);

      if (append) {
        const existingIds = new Set(notifications.value.map((item) => item.id));
        notifications.value = [
          ...notifications.value,
          ...fetchedNotifications.filter((item) => !existingIds.has(item.id)),
        ];
      } else {
        notifications.value = fetchedNotifications;
      }

      const resolvedUnread = payload?.unreadCount ?? response?.unreadCount;
      unreadCount.value = Number.isFinite(Number(resolvedUnread))
        ? Number(resolvedUnread)
        : fetchedNotifications.filter((item) => !item.isRead).length;

      const pageMeta = payload?.pagination ?? response?.pagination ?? {};
      const totalItems = Number(pageMeta.totalItems ?? payload?.total ?? fetchedNotifications.length);
      const limitVal = Number(pageMeta.limit ?? DEFAULT_PAGE_SIZE);
      pagination.value = {
        page: Number(pageMeta.page ?? page),
        limit: limitVal,
        totalItems,
        totalPages: Number(pageMeta.totalPages ?? (fetchedNotifications.length ? 1 : 0)),
      };
      return notifications.value;
    } catch (requestError) {
      if (fetchId === latestFetchId) {
        error.value = 'Không thể tải danh sách thông báo. Vui lòng thử lại.';
      }
      console.error('[NotificationStore] Fetch error:', requestError);
      return [];
    } finally {
      if (fetchId === latestFetchId) isLoading.value = false;
    }
  }

  async function setFilter(filter) {
    if (!['all', 'unread'].includes(filter) || filter === activeFilter.value) return;

    activeFilter.value = filter;
    notifications.value = [];
    pagination.value = { page: 1, limit: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 };
    return fetchNotifications();
  }

  async function loadMore() {
    if (isLoading.value || !hasMore.value) return;
    return fetchNotifications({ page: pagination.value.page + 1, append: true });
  }

  async function markAsRead(id) {
    const target = notifications.value.find((notification) => notification.id === id);
    if (!target || target.isRead) return true;
    if (isUpdating.value) return false;

    const generation = sessionGeneration;
    const previousUnreadCount = unreadCount.value;
    isUpdating.value = true;
    target.isRead = true;
    unreadCount.value = Math.max(0, previousUnreadCount - 1);

    try {
      const response = await notificationService.markAsRead(id);
      if (generation !== sessionGeneration) return false;
      error.value = null;
      const serverUnreadCount = response?.data?.unreadCount ?? response?.unreadCount;
      if (serverUnreadCount !== undefined && Number.isFinite(Number(serverUnreadCount))) {
        unreadCount.value = Number(serverUnreadCount);
      }
      if (activeFilter.value === 'unread') {
        notifications.value = [];
        pagination.value = { page: 1, limit: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 };
        await fetchNotifications();
      }
      return true;
    } catch (requestError) {
      if (generation !== sessionGeneration) return false;
      target.isRead = false;
      unreadCount.value = previousUnreadCount;
      error.value = 'Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.';
      console.error('[NotificationStore] Mark read error:', requestError);
      return false;
    } finally {
      if (generation === sessionGeneration) isUpdating.value = false;
    }
  }

  async function markAllAsRead() {
    if (unreadCount.value === 0) return true;
    if (isUpdating.value) return false;

    const generation = sessionGeneration;
    const previousState = notifications.value.map(({ id, isRead }) => ({ id, isRead }));
    const previousUnreadCount = unreadCount.value;
    isUpdating.value = true;
    notifications.value = notifications.value.map((notification) => ({ ...notification, isRead: true }));
    unreadCount.value = 0;

    try {
      const response = await notificationService.markAllAsRead();
      if (generation !== sessionGeneration) return false;
      error.value = null;
      const serverUnreadCount = response?.data?.unreadCount ?? response?.unreadCount;
      if (serverUnreadCount !== undefined && Number.isFinite(Number(serverUnreadCount))) {
        unreadCount.value = Number(serverUnreadCount);
      }
      if (activeFilter.value === 'unread') {
        notifications.value = [];
        pagination.value = { page: 1, limit: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 };
      }
      return true;
    } catch (requestError) {
      if (generation !== sessionGeneration) return false;
      notifications.value = notifications.value.map((notification) => {
        const previous = previousState.find((item) => item.id === notification.id);
        return previous ? { ...notification, isRead: previous.isRead } : notification;
      });
      unreadCount.value = previousUnreadCount;
      error.value = 'Không thể đánh dấu đã đọc tất cả. Vui lòng thử lại.';
      console.error('[NotificationStore] Mark all read error:', requestError);
      return false;
    } finally {
      if (generation === sessionGeneration) isUpdating.value = false;
    }
  }

  function clear() {
    sessionGeneration += 1;
    latestFetchId += 1;
    loadedUserId.value = '';
    hasInitialLoaded.value = false;
    notifications.value = [];
    unreadCount.value = 0;
    isLoading.value = false;
    isUpdating.value = false;
    activeFilter.value = 'all';
    error.value = null;
    pagination.value = { page: 1, limit: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 };
  }

  // Giữ nguyên dữ liệu thông báo khi Navbar remount giữa các Layout của cùng một người dùng
  async function syncUserSession(userId) {
    const normalizedId = String(userId || '');
    if (!normalizedId) {
      clear();
      return;
    }
    if (loadedUserId.value !== normalizedId) {
      clear();
      loadedUserId.value = normalizedId;
      hasInitialLoaded.value = true;
      await fetchNotifications();
      return;
    }
    if (!hasInitialLoaded.value && !isLoading.value) {
      hasInitialLoaded.value = true;
      await fetchNotifications();
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    isUpdating,
    activeFilter,
    error,
    pagination,
    filteredNotifications,
    hasMore,
    fetchNotifications,
    setFilter,
    loadMore,
    markAsRead,
    markAllAsRead,
    clear,
    syncUserSession,
  };
});

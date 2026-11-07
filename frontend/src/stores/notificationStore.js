import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { notificationService } from '@/services/notificationService';

const DEFAULT_PAGE_SIZE = 20;

function normalizeNotification(notification) {
  return {
    ...notification,
    id: notification.id ?? notification._id,
    targetUrl: notification.targetUrl ?? notification.actionUrl ?? '',
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
  let pendingFetch = null;

  const filteredNotifications = computed(() => notifications.value);
  const hasMore = computed(() => pagination.value.page < pagination.value.totalPages);

  // Merge: các component cùng yêu cầu một trang dùng chung request, clear() hủy kết quả phiên cũ.
  function fetchNotifications({ page = 1, append = false } = {}) {
    const key = `${sessionGeneration}:${activeFilter.value}:${page}:${append}`;
    if (pendingFetch?.key === key) return pendingFetch.promise;
    const entry = { key, promise: null };
    entry.promise = loadNotifications({ page, append }).finally(() => {
      if (pendingFetch === entry) pendingFetch = null;
    });
    pendingFetch = entry;
    return entry.promise;
  }

  async function loadNotifications({ page, append }) {
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

      const fetchedNotifications = Array.isArray(response?.data)
        ? response.data.map(normalizeNotification)
        : [];

      if (append) {
        const existingIds = new Set(notifications.value.map((item) => item.id));
        notifications.value = [
          ...notifications.value,
          ...fetchedNotifications.filter((item) => !existingIds.has(item.id)),
        ];
      } else {
        notifications.value = fetchedNotifications;
      }

      unreadCount.value = Number(response?.unreadCount ?? 0);
      pagination.value = {
        page: Number(response?.pagination?.page ?? page),
        limit: Number(response?.pagination?.limit ?? DEFAULT_PAGE_SIZE),
        totalItems: Number(response?.pagination?.totalItems ?? fetchedNotifications.length),
        totalPages: Number(response?.pagination?.totalPages ?? (fetchedNotifications.length ? 1 : 0)),
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

  function invalidatePendingFetch() {
    // Kết quả list bắt đầu trước thao tác đọc không được ghi đè trạng thái vừa cập nhật.
    latestFetchId += 1;
    pendingFetch = null;
    isLoading.value = false;
  }

  async function markAsRead(id) {
    const target = notifications.value.find((notification) => notification.id === id);
    if (!target || target.isRead) return true;
    if (isUpdating.value) return false;

    invalidatePendingFetch();
    const generation = sessionGeneration;
    const previousUnreadCount = unreadCount.value;
    isUpdating.value = true;
    target.isRead = true;
    unreadCount.value = Math.max(0, previousUnreadCount - 1);

    try {
      const response = await notificationService.markAsRead(id);
      if (generation !== sessionGeneration) return false;
      error.value = null;
      if (Number.isFinite(Number(response?.unreadCount))) {
        unreadCount.value = Number(response.unreadCount);
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

    invalidatePendingFetch();
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
      if (Number.isFinite(Number(response?.unreadCount))) {
        unreadCount.value = Number(response.unreadCount);
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
    pendingFetch = null;
    latestFetchId += 1;
    notifications.value = [];
    unreadCount.value = 0;
    isLoading.value = false;
    isUpdating.value = false;
    activeFilter.value = 'all';
    error.value = null;
    pagination.value = { page: 1, limit: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 };
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
  };
});

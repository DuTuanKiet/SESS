import httpClient from './http/httpClient';

/**
 * Service quản lý thông báo hệ thống SESS
 * Hỗ trợ cờ IS_MOCK để chuyển đổi linh hoạt giữa dữ liệu giả lập và Backend thực tế
 */
export const IS_MOCK = true;

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_01',
    title: 'Hạn chót nộp hồ sơ sơ khảo',
    message: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2026 sẽ đóng cổng nhận hồ sơ sau 48 giờ.',
    type: 'deadline',
    targetUrl: '/competitions',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 phút trước
    isRead: false,
  },
  {
    id: 'notif_02',
    title: 'Nhận xét mới từ Cố vấn',
    message: 'TS. Nguyễn Văn Hướng đã gửi góp ý chuyên môn cho bản thuyết minh dự án.',
    type: 'feedback',
    targetUrl: '/student/projects',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
    isRead: false,
  },
  {
    id: 'notif_03',
    title: 'Cuộc thi mới mở đăng ký',
    message: 'Thử thách Đổi mới Sáng tạo Khoa CNTT chính thức nhận đề tài mùa giải mới.',
    type: 'competition',
    targetUrl: '/competitions',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
    isRead: false,
  },
  {
    id: 'notif_04',
    title: 'Xác nhận hồ sơ hợp lệ',
    message: 'Hồ sơ đăng ký dự án của bạn đã vượt qua bước kiểm tra định dạng ban đầu.',
    type: 'system',
    targetUrl: '/student/projects',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước
    isRead: true,
  },
];

export const notificationService = {
  /**
   * Lấy danh sách thông báo người dùng
   * @param {Object} params - { status: 'all' | 'unread', limit: number, page: number }
   * @returns {Promise<{ success: boolean, data: Array, unreadCount: number }>}
   */
  async getNotifications(params = {}) {
    if (IS_MOCK) {
      await delay(250);
      return {
        success: true,
        data: [...MOCK_NOTIFICATIONS],
        unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length,
      };
    }

    const res = await httpClient.get('/notifications', { params });
    return res.data;
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * @param {string|number} id
   */
  async markAsRead(id) {
    if (IS_MOCK) {
      await delay(150);
      const item = MOCK_NOTIFICATIONS.find((n) => n.id === id);
      if (item) {
        item.isRead = true;
      }
      return { success: true, message: 'Đã đánh dấu đọc thành công' };
    }

    const res = await httpClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc
   */
  async markAllAsRead() {
    if (IS_MOCK) {
      await delay(200);
      MOCK_NOTIFICATIONS.forEach((n) => {
        n.isRead = true;
      });
      return { success: true, message: 'Đã đánh dấu đọc toàn bộ' };
    }

    const res = await httpClient.patch('/notifications/read-all');
    return res.data;
  },

  /**
   * Thêm thông báo mới vào danh sách (dùng cho mock và thông báo tức thì)
   */
  addNotification({ title, message, type = 'system', targetUrl = '/student/projects' }) {
    const newNotif = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      targetUrl,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    MOCK_NOTIFICATIONS.unshift(newNotif);
    return newNotif;
  },
};

export default notificationService;

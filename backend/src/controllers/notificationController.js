const notificationService = require('../services/notificationService');

/** Lấy danh sách thông báo có lọc và phân trang cho tài khoản hiện tại. */
const handleGetNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications({
      ...req.query,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      code: 'NOTIFICATIONS_FETCHED',
      message: 'Lấy danh sách thông báo thành công.',
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
};

/** Đánh dấu một thông báo của tài khoản hiện tại là đã đọc. */
const handleMarkNotificationRead = async (req, res, next) => {
  try {
    const result = await notificationService.markNotificationRead({
      notificationId: req.params.id,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      code: 'NOTIFICATION_MARKED_READ',
      message: 'Đã đánh dấu thông báo là đã đọc.',
      data: result.notification,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

/** Đánh dấu toàn bộ thông báo của tài khoản hiện tại là đã đọc. */
const handleMarkAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead({ userId: req.user.id });

    return res.status(200).json({
      success: true,
      code: 'NOTIFICATIONS_MARKED_READ',
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      data: result,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

/** Merge: POST của dev giữ khả năng tạo, quyền admin và schema được kiểm tra trước controller. */
const handleCreateNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    return res.status(201).json({ success: true, message: 'Tạo thông báo thành công.', data: notification });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  handleGetNotifications, handleMarkNotificationRead, handleMarkAllNotificationsRead,
  handleCreateNotification,
};

const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');

const notificationController = {
  /**
   * GET /api/v1/notifications
   * Lấy danh sách thông báo của người dùng hiện tại (theo recipientId + role).
   * Query params: unreadOnly (boolean), limit (number)
   */
  getNotifications: async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role || req.user.systemRole || 'judge';

    const { unreadOnly, limit } = req.query;

    const filter = {
      recipientId: userId,
      recipientRole: userRole,
    };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      recipientRole: userRole,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công.',
      data: {
        notifications,
        unreadCount,
        total: notifications.length,
      },
    });
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   * Đánh dấu một thông báo là đã đọc.
   */
  markAsRead: async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId,
    });

    if (!notification) {
      throw ApiError.notFound('Không tìm thấy thông báo', 'NOTIFICATION_NOT_FOUND');
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc.',
      data: notification,
    });
  },

  /**
   * PATCH /api/v1/notifications/read-all
   * Đánh dấu tất cả thông báo của người dùng là đã đọc.
   */
  markAllAsRead: async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role || req.user.systemRole || 'judge';

    await Notification.updateMany(
      { recipientId: userId, recipientRole: userRole, isRead: false },
      { isRead: true },
    );

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
    });
  },

  /**
   * POST /api/v1/notifications
   * Tạo thông báo mới (dành cho admin/system).
   * Body: { recipientId, recipientRole, title, content, type, link, relatedEvaluationId, relatedProjectId }
   */
  createNotification: async (req, res) => {
    const {
      recipientId,
      recipientRole,
      title,
      content,
      type = 'info',
      link,
      relatedEvaluationId,
      relatedProjectId,
    } = req.body;

    if (!recipientId || !recipientRole || !title || !content) {
      throw ApiError.badRequest(
        'Thiếu thông tin bắt buộc: recipientId, recipientRole, title, content',
        'MISSING_FIELD',
      );
    }

    const notification = await Notification.create({
      recipientId,
      recipientRole,
      title,
      content,
      type,
      link: link || '',
      relatedEvaluationId: relatedEvaluationId || null,
      relatedProjectId: relatedProjectId || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công.',
      data: notification,
    });
  },
};

module.exports = notificationController;

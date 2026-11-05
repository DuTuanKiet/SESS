const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

/**
 * GET /api/v1/notifications
 * Lấy danh sách thông báo của người dùng hiện tại.
 */
router.get('/', authenticate, notificationController.getNotifications);

/**
 * PATCH /api/v1/notifications/:id/read
 * Đánh dấu một thông báo là đã đọc.
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * PATCH /api/v1/notifications/read-all
 * Đánh dấu tất cả thông báo là đã đọc.
 */
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * POST /api/v1/notifications
 * Tạo thông báo mới (admin/system).
 */
router.post('/', authenticate, notificationController.createNotification);

module.exports = router;

const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  notificationIdParamsSchema,
  notificationQuerySchema,
  notificationBodySchema,
} = require('../validations/notificationValidation');

const router = express.Router();

router.get(
  '/',
  authenticate,
  validate({ query: notificationQuerySchema }),
  notificationController.handleGetNotifications,
);

router.patch(
  '/read-all',
  authenticate,
  notificationController.handleMarkAllNotificationsRead,
);

router.patch(
  '/:id/read',
  authenticate,
  validate({ params: notificationIdParamsSchema }),
  notificationController.handleMarkNotificationRead,
);

// Merge: POST dev dùng cùng service, nhưng chỉ admin được tạo thông báo cho người khác.
router.post('/', authenticate, checkRole('admin'), validate({ body: notificationBodySchema }),
  notificationController.handleCreateNotification);

module.exports = router;

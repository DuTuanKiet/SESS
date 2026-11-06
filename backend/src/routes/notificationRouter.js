const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  notificationIdParamsSchema,
  notificationQuerySchema,
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

module.exports = router;

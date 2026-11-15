const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
  notificationIdParamsSchema,
  notificationQuerySchema,
} = require('../validations/notificationValidation');

const router = express.Router();

/** GET /api/v1/notifications */
router.get(
  '/',
  authenticate,
  validate({ query: notificationQuerySchema }),
  notificationController.getNotifications,
);

/** PATCH /api/v1/notifications/read-all */
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

/** PATCH /api/v1/notifications/:id/read */
router.patch(
  '/:id/read',
  authenticate,
  validate({ params: notificationIdParamsSchema }),
  notificationController.markAsRead,
);

/** POST /api/v1/notifications (Admin/system) */
router.post('/', authenticate, authorizeRoles(USER_ROLES.ADMIN), notificationController.createNotification);

module.exports = router;

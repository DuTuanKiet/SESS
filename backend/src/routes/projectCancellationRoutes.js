const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  handleRequestCancellation,
  handleListCancellationRequests,
  handleReviewCancellationRequest,
} = require('../controllers/projectCancellationController');
const {
  projectCancellationParamsSchema,
  cancellationReviewParamsSchema,
  createCancellationRequestBodySchema,
  listCancellationRequestsQuerySchema,
  reviewCancellationRequestBodySchema,
} = require('../validations/projectCancellationValidation');
const { USER_ROLES } = require('../utils/constants');

/**
 * Quy trình hủy dự án có bằng chứng (Enterprise Edition).
 *
 *  POST   /api/v1/projects/:projectId/cancellation-requests
 *  GET    /api/v1/projects/cancellation-requests           (Admin)
 *  PATCH  /api/v1/projects/cancellation-requests/:requestId/review   (Admin)
 *
 * LƯU Ý: file này PHẢI được mount TRƯỚC projectRouter để các path tĩnh
 * (/cancellation-requests) không bị projectRouter bắt mất bởi /:id.
 */

/** Gửi yêu cầu hủy dự án (thành viên / giảng viên hướng dẫn / Admin) */
router.post(
  '/:projectId/cancellation-requests',
  authenticate,
  validate({
    params: projectCancellationParamsSchema,
    body: createCancellationRequestBodySchema,
  }),
  handleRequestCancellation,
);

/** Danh sách yêu cầu hủy dự án (Admin) */
router.get(
  '/cancellation-requests',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({ query: listCancellationRequestsQuerySchema }),
  handleListCancellationRequests,
);

/** Duyệt / Từ chối yêu cầu hủy dự án (Admin) */
router.patch(
  '/cancellation-requests/:requestId/review',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: cancellationReviewParamsSchema,
    body: reviewCancellationRequestBodySchema,
  }),
  handleReviewCancellationRequest,
);

module.exports = router;

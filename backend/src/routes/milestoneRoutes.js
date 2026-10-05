const express = require('express');
const router = express.Router({ mergeParams: true });

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {projectIdParamsSchema, milestoneIdParamsSchema, createMilestoneBodySchema, updateMilestoneBodySchema, submitEvidenceBodySchema, addCommentBodySchema,} = require('../validations/milestoneValidation');
const {handleCreateMilestone, handleUpdateMilestone, handleGetMilestones, handleGetMilestoneById, handleSubmitEvidence, handleAddComment, handleGetComments,} = require('../controllers/milestoneController');
const { SYSTEM_ROLES } = require('../utils/constants');

/**
 * GET /api/v1/projects/:projectId/milestones
 * Lấy danh sách milestones. Yêu cầu đăng nhập.
 */
router.get(
  '/',
  authMiddleware,
  validate({ params: projectIdParamsSchema }),
  handleGetMilestones
);

/**
 * GET /api/v1/projects/:projectId/milestones/:milestoneId
 * Lấy chi tiết milestone. Yêu cầu đăng nhập.
 */
router.get(
  '/:milestoneId',
  authMiddleware,
  validate({ params: milestoneIdParamsSchema }),
  handleGetMilestoneById
);

/**
 * POST /api/v1/projects/:projectId/milestones
 * Tạo milestone. Chỉ Mentor.
 */
router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.MENTOR),
  validate({ params: projectIdParamsSchema, body: createMilestoneBodySchema }),
  handleCreateMilestone
);

/**
 * PUT /api/v1/projects/:projectId/milestones/:milestoneId
 * Cập nhật milestone. Chỉ Mentor.
 */
router.put(
  '/:milestoneId',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.MENTOR),
  validate({ params: milestoneIdParamsSchema, body: updateMilestoneBodySchema }),
  handleUpdateMilestone
);

/**
 * POST /api/v1/projects/:projectId/milestones/:milestoneId/evidence
 * Sinh viên nộp minh chứng (chỉ Project Owner). Chỉ Student.
 */
router.post(
  '/:milestoneId/evidence',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.STUDENT),
  validate({ params: milestoneIdParamsSchema, body: submitEvidenceBodySchema }),
  handleSubmitEvidence
);

/**
 * POST /api/v1/projects/:projectId/milestones/:milestoneId/comments
 * Mentor góp ý milestone (Completed/Overdue, trong 5 ngày từ khi nộp minh chứng). Chỉ Mentor.
 */
router.post(
  '/:milestoneId/comments',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.MENTOR),
  validate({ params: milestoneIdParamsSchema, body: addCommentBodySchema }),
  handleAddComment
);

/**
 * GET /api/v1/projects/:projectId/milestones/:milestoneId/comments
 * Lấy danh sách góp ý của milestone. Yêu cầu đăng nhập.
 */
router.get(
  '/:milestoneId/comments',
  authMiddleware,
  validate({ params: milestoneIdParamsSchema }),
  handleGetComments
);

module.exports = router;

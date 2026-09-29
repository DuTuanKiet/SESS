const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  getMentorsQuerySchema,
  getMentorByIdParamsSchema,
  getAssignmentsByProjectParamsSchema,
  paginationQuerySchema,
  assignMentorBodySchema,
  reassignMentorBodySchema,
} = require('../validations/mentorValidation');
const {
  handleGetMentors,
  handleGetMentorById,
  handleAssignMentor,
  handleReassignMentor,
  handleGetProjectAssignmentHistory,
  handleGetAuditHistory,
} = require('../controllers/mentorController');
const { SYSTEM_ROLES } = require('../utils/constants');

/**
 * GET /api/v1/mentors
 * Lấy danh sách mentor. Yêu cầu đăng nhập.
 */
router.get(
  '/mentors',
  authMiddleware,
  validate({ query: getMentorsQuerySchema }),
  handleGetMentors
);

/**
 * GET /api/v1/mentors/:mentorId
 * Lấy chi tiết hồ sơ mentor. Yêu cầu đăng nhập.
 */
router.get(
  '/mentors/:mentorId',
  authMiddleware,
  validate({ params: getMentorByIdParamsSchema }),
  handleGetMentorById
);


/**
 * GET /api/v1/mentor-assignments/audit-history
 * Lấy lịch sử Audit Log phân công mentor. Chỉ Admin.
 */
router.get(
  '/mentor-assignments/audit-history',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ query: paginationQuerySchema }),
  handleGetAuditHistory
);

/**
 * GET /api/v1/mentor-assignments/project/:projectId
 * Lấy lịch sử phân công mentor của một dự án. Yêu cầu đăng nhập.
 */
router.get(
  '/mentor-assignments/project/:projectId',
  authMiddleware,
  validate({ params: getAssignmentsByProjectParamsSchema }),
  handleGetProjectAssignmentHistory
);

/**
 * POST /api/v1/mentor-assignments
 * Phân công mentor cho dự án. Chỉ Admin.
 */
router.post(
  '/mentor-assignments',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ body: assignMentorBodySchema }),
  handleAssignMentor
);

/**
 * POST /api/v1/mentor-assignments/reassign
 * Phân công lại mentor cho dự án. Chỉ Admin.
 */
router.post(
  '/mentor-assignments/reassign',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ body: reassignMentorBodySchema }),
  handleReassignMentor
);

module.exports = router;

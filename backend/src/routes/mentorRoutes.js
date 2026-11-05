const express = require('express');
const { SYSTEM_ROLES } = require('../utils/constants');
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
  handleGetMyMentorProfile,
  handleGetMyAssignedProjects,
  handleGetMyNotifications,
  handleSendEmail,
  handleRequestCancelAssignment,
  handleGetHonorHistory,
  handleUpdateMyMentorProfile,
} = require('../controllers/mentorController');

// Self-service mentor routes
router.get('/mentors/me/profile', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleGetMyMentorProfile);
router.put('/mentors/me/profile', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleUpdateMyMentorProfile);
router.get('/mentors/me/assigned-projects', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleGetMyAssignedProjects);
router.get('/mentors/me/notifications', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleGetMyNotifications);
router.post('/mentors/me/send-email', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleSendEmail);
router.post('/mentors/me/request-cancel-assignment', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleRequestCancelAssignment);
router.get('/mentors/me/honor-history', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleGetHonorHistory);

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

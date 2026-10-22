const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const {
  handleCreateEmergencyReassignment,
  handleGetEmergencyReassignments,
  handleCompleteEmergencyReassignment,
  handleRevokeEmergencyReassignment,
} = require('../controllers/emergencyJudgeReassignmentController');
const { SYSTEM_ROLES } = require('../utils/constants');

/**
 * POST /api/v1/emergency-judge-reassignments
 * Tạo điều chuyển khẩn cấp BGK (Admin).
 */
router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  handleCreateEmergencyReassignment,
);

/**
 * GET /api/v1/emergency-judge-reassignments
 * Lấy danh sách điều chuyển khẩn cấp (Admin).
 */
router.get(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  handleGetEmergencyReassignments,
);

/**
 * POST /api/v1/emergency-judge-reassignments/:reassignmentId/complete
 * Hoàn thành điều chuyển khẩn cấp (Admin).
 */
router.post(
  '/:reassignmentId/complete',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  handleCompleteEmergencyReassignment,
);

/**
 * POST /api/v1/emergency-judge-reassignments/:reassignmentId/revoke
 * Thu hồi điều chuyển khẩn cấp (Admin).
 */
router.post(
  '/:reassignmentId/revoke',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  handleRevokeEmergencyReassignment,
);

module.exports = router;

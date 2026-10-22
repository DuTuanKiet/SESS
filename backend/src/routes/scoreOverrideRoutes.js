const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const {
  handleCreateScoreOverride,
  handleGetScoreOverrides,
  handleRevokeScoreOverride,
} = require('../controllers/scoreOverrideController');
const { SYSTEM_ROLES } = require('../utils/constants');

/**
 * POST /api/v1/score-overrides
 * Điều chỉnh điểm số Rubric (Admin / Judge). Bắt buộc lý do + audit log.
 */
router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  handleCreateScoreOverride,
);

/**
 * GET /api/v1/score-overrides
 * Lấy danh sách điều chỉnh điểm (Admin / Judge).
 */
router.get(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  handleGetScoreOverrides,
);

/**
 * POST /api/v1/score-overrides/:overrideId/revoke
 * Thu hồi điều chỉnh điểm (Admin / Judge).
 */
router.post(
  '/:overrideId/revoke',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  handleRevokeScoreOverride,
);

module.exports = router;

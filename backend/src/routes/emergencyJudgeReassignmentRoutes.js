const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  handleCreateEmergencyReassignment,
  handleGetEmergencyReassignments,
  handleCompleteEmergencyReassignment,
  handleRevokeEmergencyReassignment,
} = require('../controllers/emergencyJudgeReassignmentController');
const {
  createEmergencyReassignmentBodySchema,
  emergencyReassignmentQuerySchema,
  emergencyReassignmentParamsSchema,
  revokeEmergencyReassignmentBodySchema,
} = require('../validations/emergencyJudgeReassignmentValidation');
const { SYSTEM_ROLES } = require('../utils/constants');

router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ body: createEmergencyReassignmentBodySchema }),
  handleCreateEmergencyReassignment,
);

router.get(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ query: emergencyReassignmentQuerySchema }),
  handleGetEmergencyReassignments,
);

router.post(
  '/:reassignmentId/complete',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: emergencyReassignmentParamsSchema }),
  handleCompleteEmergencyReassignment,
);

router.post(
  '/:reassignmentId/revoke',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: emergencyReassignmentParamsSchema, body: revokeEmergencyReassignmentBodySchema }),
  handleRevokeEmergencyReassignment,
);

module.exports = router;

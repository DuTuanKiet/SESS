const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  handleCreateScoreOverride,
  handleGetScoreOverrides,
  handleRevokeScoreOverride,
} = require('../controllers/scoreOverrideController');
const {
  createScoreOverrideBodySchema,
  scoreOverrideQuerySchema,
  revokeScoreOverrideParamsSchema,
  revokeScoreOverrideBodySchema,
} = require('../validations/scoreOverrideValidation');
const { SYSTEM_ROLES } = require('../utils/constants');

router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  validate({ body: createScoreOverrideBodySchema }),
  handleCreateScoreOverride,
);

router.get(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  validate({ query: scoreOverrideQuerySchema }),
  handleGetScoreOverrides,
);

router.post(
  '/:overrideId/revoke',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.JUDGE),
  validate({ params: revokeScoreOverrideParamsSchema, body: revokeScoreOverrideBodySchema }),
  handleRevokeScoreOverride,
);

module.exports = router;

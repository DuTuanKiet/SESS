const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const adminEvaluationController = require('../controllers/adminEvaluationController');
const {
  assignJudgeBodySchema,
  roundParamsSchema,
  migrateLegacyEvaluationsBodySchema,
} = require('../validations/adminEvaluationValidation');

const router = express.Router();

router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.post('/assign', validate({ body: assignJudgeBodySchema }), adminEvaluationController.assignJudge);
router.get(
  '/rounds/:evaluationRoundId/assignments',
  validate({ params: roundParamsSchema }),
  adminEvaluationController.listRoundAssignments,
);
router.post(
  '/migrations/evaluation-submissions/dry-run',
  validate({ body: migrateLegacyEvaluationsBodySchema }),
  adminEvaluationController.migrateLegacyEvaluations,
);

module.exports = router;
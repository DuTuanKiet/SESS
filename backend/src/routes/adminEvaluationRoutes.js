const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const adminEvaluationController = require('../controllers/adminEvaluationController');
const evaluationRoundController = require('../controllers/evaluationRoundController');
const {
  assignJudgeBodySchema,
  roundParamsSchema,
  migrateLegacyEvaluationsBodySchema,
  createRoundBodySchema,
  updateRoundBodySchema,
} = require('../validations/adminEvaluationValidation');

const router = express.Router();

router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get('/rounds', evaluationRoundController.handleListRounds);
router.post('/rounds', validate({ body: createRoundBodySchema }), evaluationRoundController.handleCreateRound);
router.patch('/rounds/:evaluationRoundId', validate({ params: roundParamsSchema, body: updateRoundBodySchema }), evaluationRoundController.handleUpdateRound);

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
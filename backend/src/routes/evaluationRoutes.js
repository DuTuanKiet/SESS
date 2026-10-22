const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  handleAssignJudge,
  handleSubmitScore,
  handleGetEvaluationSummary,
} = require('../controllers/evaluationController');
const {
  evaluationParamsSchema,
  assignJudgeBodySchema,
  submitScoreBodySchema,
} = require('../validations/evaluationValidation');
const { USER_ROLES } = require('../utils/constants');

/**
 * Vòng chấm điểm Rubric của Ban Giám khảo -> trạng thái EVALUATED (Enterprise Edition).
 *
 *  POST /api/v1/projects/:projectId/judges             - Gán giám khảo vào tiểu ban (Admin)
 *  POST /api/v1/projects/:projectId/evaluation/scores  - Giám khảo nộp phiếu chấm điểm
 *  GET  /api/v1/projects/:projectId/evaluation          - Tổng hợp vòng chấm điểm
 */

/** Gán giám khảo vào tiểu ban (Admin) */
router.post(
  '/:projectId/judges',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: evaluationParamsSchema,
    body: assignJudgeBodySchema,
  }),
  handleAssignJudge,
);

/** Giám khảo nộp phiếu chấm điểm */
router.post(
  '/:projectId/evaluation/scores',
  authenticate,
  authorizeRoles(USER_ROLES.JUDGE),
  validate({
    params: evaluationParamsSchema,
    body: submitScoreBodySchema,
  }),
  handleSubmitScore,
);

/** Tổng hợp vòng chấm điểm */
router.get(
  '/:projectId/evaluation',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.JUDGE, USER_ROLES.MENTOR, USER_ROLES.TEACHER),
  validate({ params: evaluationParamsSchema }),
  handleGetEvaluationSummary,
);

module.exports = router;

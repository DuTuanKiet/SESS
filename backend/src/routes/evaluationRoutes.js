const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { createLegacyEvaluationDeprecationMiddleware } = require('../middlewares/legacyEvaluationMiddleware');
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
 * @deprecated Legacy project-centric evaluation endpoints (EvaluationSubmission).
 * Unified pipeline uses HumanEvaluation + EvaluationRound + EvaluationRubric:
 * - Admin assignment: POST /api/v1/admin/evaluations/assign
 * - Judge workspace: /api/v1/evaluator/*
 * These routes remain temporarily as adapters for backward compatibility.
 *
 *  POST /api/v1/projects/:projectId/judges             - Gán giám khảo vào tiểu ban (Admin) [LEGACY]
 *  POST /api/v1/projects/:projectId/evaluation/scores  - Giám khảo nộp phiếu chấm điểm [LEGACY]
 *  GET  /api/v1/projects/:projectId/evaluation          - Tổng hợp vòng chấm điểm [LEGACY]
 */

/** @deprecated Use POST /api/v1/admin/evaluations/assign (HumanEvaluation DRAFT) */
router.post(
  '/:projectId/judges',
  createLegacyEvaluationDeprecationMiddleware('POST /projects/:projectId/judges'),
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: evaluationParamsSchema,
    body: assignJudgeBodySchema,
  }),
  handleAssignJudge,
);

/** @deprecated Use POST /api/v1/evaluator/submit/:evaluationId (HumanEvaluation) */
router.post(
  '/:projectId/evaluation/scores',
  createLegacyEvaluationDeprecationMiddleware('POST /projects/:projectId/evaluation/scores'),
  authenticate,
  authorizeRoles(USER_ROLES.JUDGE),
  validate({
    params: evaluationParamsSchema,
    body: submitScoreBodySchema,
  }),
  handleSubmitScore,
);

/** @deprecated Prefer unified HumanEvaluation summaries; adapter kept for compatibility */
router.get(
  '/:projectId/evaluation',
  createLegacyEvaluationDeprecationMiddleware('GET /projects/:projectId/evaluation'),
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.JUDGE, USER_ROLES.MENTOR, USER_ROLES.TEACHER),
  validate({ params: evaluationParamsSchema }),
  handleGetEvaluationSummary,
);

module.exports = router;

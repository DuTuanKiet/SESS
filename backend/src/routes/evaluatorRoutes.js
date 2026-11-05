const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const { getAssignments, getWorkspace, submit, getSummary } = require('../controllers/evaluatorController');
const { evaluationIdParamsSchema, submitEvaluationBodySchema } = require('../validations/evaluatorValidation');

router.get('/assignments', authenticate, authorizeRoles(USER_ROLES.JUDGE, USER_ROLES.ADMIN), getAssignments);
router.get(
  '/workspace/:evaluationId',
  authenticate,
  authorizeRoles(USER_ROLES.JUDGE, USER_ROLES.ADMIN),
  validate({ params: evaluationIdParamsSchema }),
  getWorkspace,
);
router.get(
  '/summary/:evaluationId',
  authenticate,
  authorizeRoles(USER_ROLES.JUDGE, USER_ROLES.ADMIN),
  validate({ params: evaluationIdParamsSchema }),
  getSummary,
);
router.post(
  '/submit/:evaluationId',
  authenticate,
  authorizeRoles(USER_ROLES.JUDGE, USER_ROLES.ADMIN),
  validate({ params: evaluationIdParamsSchema, body: submitEvaluationBodySchema }),
  submit,
);

module.exports = router;
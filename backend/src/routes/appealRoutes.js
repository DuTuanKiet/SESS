const express = require('express');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const appealController = require('../controllers/appealController');
const {
  projectAppealParamsSchema,
  reviewAppealParamsSchema,
  createAppealBodySchema,
  listAppealsQuerySchema,
  reviewAppealBodySchema,
} = require('../validations/appealValidation');

const router = express.Router();

router.post(
  '/projects/:projectId/appeals',
  authenticate,
  validate({ params: projectAppealParamsSchema, body: createAppealBodySchema }),
  appealController.handleCreateAppeal,
);
router.get(
  '/projects/:projectId/appeals',
  authenticate,
  validate({ params: projectAppealParamsSchema, query: listAppealsQuerySchema }),
  appealController.handleListProjectAppeals,
);
router.get(
  '/admin/appeals',
  authenticate,
  checkRole(USER_ROLES.ADMIN),
  validate({ query: listAppealsQuerySchema }),
  appealController.handleListAppeals,
);
router.patch(
  '/admin/appeals/:appealId/review',
  authenticate,
  checkRole(USER_ROLES.ADMIN),
  validate({ params: reviewAppealParamsSchema, body: reviewAppealBodySchema }),
  appealController.handleReviewAppeal,
);

module.exports = router;

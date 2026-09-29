const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { SYSTEM_ROLES } = require('../utils/constants');
const {
  rubricIdParamsSchema,
  criterionParamsSchema,
  createRubricBodySchema,
  updateRubricBodySchema,
  addCriterionBodySchema,
  updateCriterionBodySchema,
  getRubricsQuerySchema,
} = require('../validations/rubricValidation');
const {
  handleCreateRubric,
  handleGetRubrics,
  handleGetRubricById,
  handleGetRubricVersions,
  handleUpdateRubric,
  handleAddCriterion,
  handleUpdateCriterion,
  handleDeleteCriterion,
  handleActivateRubric,
} = require('../controllers/rubricController');

// ── ENDPOINTS ĐỌC: CHO PHÉP ADMIN VÀ MENTOR (STUDENT BỊ CHẶN) ───────────
router.get(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MENTOR),
  validate({ query: getRubricsQuerySchema }),
  handleGetRubrics
);

// ── ENDPOINTS THAO TÁC CẤU HÌNH & VERSION: CHỈ DUY NHẤT ADMIN ─────────────
router.get(
  '/:rubricId/versions',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: rubricIdParamsSchema }),
  handleGetRubricVersions
);

// Chi tiết bộ tiêu chí (Admin và Mentor)
router.get(
  '/:rubricId',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MENTOR),
  validate({ params: rubricIdParamsSchema }),
  handleGetRubricById
);

router.post(
  '/',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ body: createRubricBodySchema }),
  handleCreateRubric
);
router.put(
  '/:rubricId',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: rubricIdParamsSchema, body: updateRubricBodySchema }),
  handleUpdateRubric
);
router.patch(
  '/:rubricId/activate',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: rubricIdParamsSchema }),
  handleActivateRubric
);

// Thao tác trên tiêu chí con (Chỉ Admin)
router.post(
  '/:rubricId/criteria',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: rubricIdParamsSchema, body: addCriterionBodySchema }),
  handleAddCriterion
);
router.put(
  '/:rubricId/criteria/:criterionId',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: criterionParamsSchema, body: updateCriterionBodySchema }),
  handleUpdateCriterion
);
router.delete(
  '/:rubricId/criteria/:criterionId',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ params: criterionParamsSchema }),
  handleDeleteCriterion
);

module.exports = router;

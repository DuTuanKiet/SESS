const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  handlePromoteProject,
  handleGetProjectHierarchy,
} = require('../controllers/projectHierarchyController');
const {
  projectHierarchyParamsSchema,
  promoteProjectBodySchema,
} = require('../validations/projectHierarchyValidation');
const { USER_ROLES } = require('../utils/constants');

/**
 * Cấu trúc thi đấu đa cấp - Parent-Child Projects (Enterprise Edition).
 *
 *  POST /api/v1/projects/:projectId/promote    - Đề xuất thi vượt cấp (Admin/Hội đồng)
 *  GET  /api/v1/projects/:projectId/hierarchy  - Cây thi vượt cấp
 */

/** Đề xuất thi vượt cấp (Admin hoặc Hội đồng cấp Khoa) */
router.post(
  '/:projectId/promote',
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validate({
    params: projectHierarchyParamsSchema,
    body: promoteProjectBodySchema,
  }),
  handlePromoteProject,
);

/** Lấy cây sơ đồ thi vượt cấp */
router.get(
  '/:projectId/hierarchy',
  authenticate,
  validate({ params: projectHierarchyParamsSchema }),
  handleGetProjectHierarchy,
);

module.exports = router;

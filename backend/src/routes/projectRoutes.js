const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  getUnassignedProjectsQuerySchema,
  updateProjectStatusParamsSchema,
  updateProjectStatusBodySchema,
} = require('../validations/projectValidation');
const {
  handleGetUnassignedProjects,
  handleUpdateProjectStatus,
} = require('../controllers/projectController');
const { SYSTEM_ROLES } = require('../utils/constants');

/**
 * GET /api/v1/projects/unassigned-mentor
 * Lấy danh sách dự án đủ điều kiện cần mentor nhưng chưa có mentor cố vấn. Chỉ Admin.
 */
router.get(
  '/unassigned-mentor',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({ query: getUnassignedProjectsQuerySchema }),
  handleGetUnassignedProjects
);

/**
 * PATCH /api/v1/projects/:projectId/status
 * Cập nhật trạng thái dự án (FR03 / FR14). Chỉ Admin.
 * Khi trạng thái thành 'Completed', MentorAssignment sẽ tự động thành 'Completed'.
 */
router.patch(
  '/:projectId/status',
  authMiddleware,
  authorizeRoles(SYSTEM_ROLES.ADMIN),
  validate({
    params: updateProjectStatusParamsSchema,
    body: updateProjectStatusBodySchema,
  }),
  handleUpdateProjectStatus
);

module.exports = router;


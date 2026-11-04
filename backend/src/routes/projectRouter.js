const express = require('express');
const projectController = require('../controllers/projectController');
const projectMemberController = require('../controllers/projectMemberController');
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
  projectParamsSchema,
  listProjectsQuerySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  requestLeaveBodySchema,
} = require('../validations/projectValidation');

const router = express.Router();

// Toàn bộ API dự án yêu cầu đăng nhập
router.use(authenticate);

// FR03 - Quản lý dự án & lịch sử phiên bản
router.get('/', validate({ query: listProjectsQuerySchema }), projectController.getProjects);
router.post('/', validate({ body: createProjectBodySchema }), projectController.createProject);
router.get('/invitations', projectMemberController.getMyInvitations);
router.post('/invitations/:invitationId/respond', projectMemberController.respondInvitation);
router.get('/:id', validate({ params: projectParamsSchema }), projectController.getProject);
router.put(
  '/:id',
  validate({ params: projectParamsSchema, body: updateProjectBodySchema }),
  projectController.updateProject,
);
router.post('/:id/submit', validate({ params: projectParamsSchema }), projectController.submitProject);
router.get('/:id/revisions', validate({ params: projectParamsSchema }), projectController.getProjectRevisions);

// FR04 - Quản lý thành viên dự án
router.get('/:id/members', validate({ params: projectParamsSchema }), projectMemberController.getProjectMembers);
router.post('/:id/members/invite', projectMemberController.inviteMember);
router.delete('/:id/members/invitations/:identifier', projectMemberController.cancelInvitation);
router.post(
  '/:id/members/leave-request',
  validate({ params: projectParamsSchema, body: requestLeaveBodySchema }),
  projectMemberController.requestLeaveProject,
);
router.delete(
  '/:id/members/leave-request',
  validate({ params: projectParamsSchema }),
  projectMemberController.cancelLeaveRequest,
);
router.delete('/:id/members/:userId', projectMemberController.removeMember);
router.post('/:id/members/transfer-ownership', projectMemberController.transferOwnership);
router.post('/:id/members/leave', projectMemberController.leaveProject);

// FR05 - Member Change Request (yêu cầu thay đổi thành viên)
router.post('/:id/members/change-request', projectMemberController.requestMemberChange);
router.post(
  '/change-requests/:requestId/respond',
  authorizeRoles(USER_ROLES.ADMIN),
  projectMemberController.respondMemberChangeRequest,
);
router.get('/:id/members/change-requests', projectMemberController.getMemberChangeRequests);

// FR05 - Emergency transfer ownership (Admin ép chuyển quyền)
router.post(
  '/:id/members/emergency-transfer-ownership',
  authorizeRoles(USER_ROLES.ADMIN),
  projectMemberController.emergencyTransferOwnership,
);

module.exports = router;

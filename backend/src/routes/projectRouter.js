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
} = require('../validations/projectValidation');
const {
  projectParamsSchema: projectMemberParamsSchema,
  invitationParamsSchema,
  changeRequestParamsSchema,
  memberParamsSchema,
  invitationIdentifierParamsSchema,
  inviteMemberBodySchema,
  respondInvitationBodySchema,
  transferOwnershipBodySchema,
  requestLeaveBodySchema,
  memberChangeBodySchema,
  respondMemberChangeBodySchema,
  emergencyTransferBodySchema,
  memberChangeQuerySchema,
} = require('../validations/projectMemberValidation');

const router = express.Router();

// Toàn bộ API dự án yêu cầu đăng nhập
router.use(authenticate);

// FR03 - Quản lý dự án & lịch sử phiên bản
router.get('/', validate({ query: listProjectsQuerySchema }), projectController.getProjects);
router.post('/', validate({ body: createProjectBodySchema }), projectController.createProject);
router.get('/invitations/me', projectMemberController.getMyInvitations);
// Giữ route cũ cho các client chưa chuyển sang /invitations/me.
router.get('/invitations', projectMemberController.getMyInvitations);
router.post(
  '/invitations/:invitationId/respond',
  validate({ params: invitationParamsSchema, body: respondInvitationBodySchema }),
  projectMemberController.respondInvitation,
);
router.get('/:id', validate({ params: projectParamsSchema }), projectController.getProject);
router.put(
  '/:id',
  validate({ params: projectParamsSchema, body: updateProjectBodySchema }),
  projectController.updateProject,
);
router.post('/:id/submit', validate({ params: projectParamsSchema }), projectController.submitProject);
router.get('/:id/revisions', validate({ params: projectParamsSchema }), projectController.getProjectRevisions);

// FR04 - Quản lý thành viên dự án
router.get(
  '/:id/members',
  validate({ params: projectMemberParamsSchema }),
  projectMemberController.getProjectMembers,
);
router.post(
  '/:id/members/invite',
  validate({ params: projectMemberParamsSchema, body: inviteMemberBodySchema }),
  projectMemberController.inviteMember,
);
router.delete(
  '/:id/members/invitations/:identifier',
  validate({ params: invitationIdentifierParamsSchema }),
  projectMemberController.cancelInvitation,
);
router.post(
  '/:id/members/leave-request',
  validate({ params: projectMemberParamsSchema, body: requestLeaveBodySchema }),
  projectMemberController.requestLeaveProject,
);
router.delete(
  '/:id/members/leave-request',
  validate({ params: projectMemberParamsSchema }),
  projectMemberController.cancelLeaveRequest,
);
router.delete(
  '/:id/members/:userId',
  validate({ params: memberParamsSchema }),
  projectMemberController.removeMember,
);
router.post(
  '/:id/members/transfer-ownership',
  validate({ params: projectMemberParamsSchema, body: transferOwnershipBodySchema }),
  projectMemberController.transferOwnership,
);
router.post(
  '/:id/members/leave',
  validate({ params: projectMemberParamsSchema }),
  projectMemberController.leaveProject,
);

// FR05 - Member Change Request (yêu cầu thay đổi thành viên)
router.post(
  '/:id/members/change-request',
  validate({ params: projectMemberParamsSchema, body: memberChangeBodySchema }),
  projectMemberController.requestMemberChange,
);
router.post(
  '/change-requests/:requestId/respond',
  authorizeRoles(USER_ROLES.ADMIN),
  validate({ params: changeRequestParamsSchema, body: respondMemberChangeBodySchema }),
  projectMemberController.respondMemberChangeRequest,
);
router.get(
  '/:id/members/change-requests',
  validate({ params: projectMemberParamsSchema, query: memberChangeQuerySchema }),
  projectMemberController.getMemberChangeRequests,
);

// FR05 - Emergency transfer ownership (Admin ép chuyển quyền)
router.post(
  '/:id/members/emergency-transfer-ownership',
  authorizeRoles(USER_ROLES.ADMIN),
  validate({ params: projectMemberParamsSchema, body: emergencyTransferBodySchema }),
  projectMemberController.emergencyTransferOwnership,
);

module.exports = router;

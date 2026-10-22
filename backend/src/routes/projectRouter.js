const express = require('express');
const projectController = require('../controllers/projectController');
const projectMemberController = require('../controllers/projectMemberController');
const { authenticate } = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Toàn bộ API dự án yêu cầu đăng nhập
router.use(authenticate);

// FR03 - Quản lý dự án & lịch sử phiên bản
router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/submit', projectController.submitProject);
router.get('/:id/revisions', projectController.getProjectRevisions);

// FR04 - Quản lý thành viên dự án (khai báo route tĩnh trước route /:id để tránh xung đột)
router.post('/invitations/:invitationId/respond', projectMemberController.respondInvitation);
router.post('/:id/members/invite', projectMemberController.inviteMember);
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

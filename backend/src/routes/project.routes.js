const express = require('express');
const projectController = require('../controllers/projectController');
const projectMemberController = require('../controllers/projectMemberController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Toàn bộ API dự án yêu cầu đăng nhập
router.use(authenticate);

// FR03 - Quản lý dự án & lịch sử phiên bản
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/submit', projectController.submitProject);
router.get('/:id/revisions', projectController.getProjectRevisions);

// FR04 - Quản lý thành viên dự án (khai báo route tĩnh trước route /:id để tránh xung đột)
router.post('/invitations/:invitationId/respond', projectMemberController.respondInvitation);
router.post('/:id/members/invite', projectMemberController.inviteMember);
router.delete('/:id/members/:userId', projectMemberController.removeMember);
router.post('/:id/members/transfer-ownership', projectMemberController.transferOwnership);
router.post('/:id/members/leave', projectMemberController.leaveProject);

module.exports = router;

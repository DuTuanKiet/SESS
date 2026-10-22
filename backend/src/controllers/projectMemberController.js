const projectMemberService = require('../services/projectMemberService');
const {
  PROJECT_MEMBER_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
} = require('../utils/constants');
const { assertRequired, assertEnum } = require('../utils/validation');

/** POST /projects/:id/members/invite - OWNER mời sinh viên khác vào dự án */
const inviteMember = async (req, res) => {
  const { project, invitation, invitee } = await projectMemberService.inviteMember({
    projectId: req.params.id,
    inviter: req.user,
    email: assertRequired(req.body?.email, 'email'),
    req,
  });

  res.status(201).json({
    success: true,
    message: `Đã gửi lời mời tham gia dự án ${project.code} tới ${invitee.email}.`,
    data: { invitation },
  });
};

/** POST /projects/invitations/:invitationId/respond - sinh viên chấp nhận/từ chối lời mời */
const respondInvitation = async (req, res) => {
  const { project, invitation } = await projectMemberService.respondInvitation({
    invitationId: req.params.invitationId,
    userId: req.user.id,
    response: req.body?.response,
  });

  const isAccepted = invitation.status === PROJECT_MEMBER_STATUS.ACCEPTED;
  res.status(200).json({
    success: true,
    message: isAccepted
      ? `Bạn đã tham gia dự án ${project.code}.`
      : `Bạn đã từ chối lời mời tham gia dự án ${project.code}.`,
    data: { invitation },
  });
};

/** DELETE /projects/:id/members/:userId - OWNER xoá thành viên khỏi nhóm */
const removeMember = async (req, res) => {
  const { project } = await projectMemberService.removeMember({
    projectId: req.params.id,
    requester: req.user,
    targetUserId: req.params.userId,
    req,
  });

  res.status(200).json({
    success: true,
    message: `Đã xoá thành viên khỏi dự án ${project.code}.`,
    data: { projectId: project.id, removedUserId: req.params.userId },
  });
};

/** POST /projects/:id/members/transfer-ownership - chuyển quyền Trưởng nhóm */
const transferOwnership = async (req, res) => {
  const { project, newOwner } = await projectMemberService.transferOwnership({
    projectId: req.params.id,
    requester: req.user,
    targetUserId: assertRequired(req.body?.userId, 'userId'),
    req,
  });

  res.status(200).json({
    success: true,
    message: `Đã chuyển quyền Trưởng nhóm của dự án ${project.code} cho ${newOwner.email}.`,
    data: { project },
  });
};

/** POST /projects/:id/members/leave - thành viên tự rời dự án */
const leaveProject = async (req, res) => {
  const { project } = await projectMemberService.leaveProject({
    projectId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Bạn đã rời khỏi dự án ${project.code}.`,
    data: { projectId: project.id },
  });
};

/** POST /projects/:id/members/change-request - OWNER gửi yêu cầu thêm/bớt thành viên */
const requestMemberChange = async (req, res) => {
  const { project, changeRequest } = await projectMemberService.requestMemberChange({
    projectId: req.params.id,
    requester: req.user,
    targetUserId: assertRequired(req.body?.targetUserId, 'targetUserId'),
    type: assertEnum(req.body?.type, ['ADD', 'REMOVE'], 'type', 'INVALID_CHANGE_TYPE'),
    reason: req.body?.reason || '',
    req,
  });

  res.status(201).json({
    success: true,
    message:
      changeRequest.type === MEMBER_CHANGE_REQUEST_TYPE.ADD
        ? `Đã gửi yêu cầu thêm thành viên vào dự án ${project.code}.`
        : `Đã gửi yêu cầu xóa thành viên khỏi dự án ${project.code}.`,
    data: { changeRequest },
  });
};

/** POST /projects/change-requests/:requestId/respond - Admin phê duyệt/từ chối yêu cầu */
const respondMemberChangeRequest = async (req, res) => {
  const { project, changeRequest, executed } = await projectMemberService.respondMemberChangeRequest({
    requestId: req.params.requestId,
    responder: req.user,
    response: assertEnum(req.body?.response, ['APPROVED', 'REJECTED'], 'response', 'INVALID_RESPONSE'),
    responseReason: req.body?.responseReason || '',
    req,
  });

  const isApproved = changeRequest.status === MEMBER_CHANGE_REQUEST_STATUS.APPROVED;
  res.status(200).json({
    success: true,
    message: isApproved
      ? `Đã duyệt yêu cầu thay đổi thành viên của dự án ${project.code}.`
      : `Đã từ chối yêu cầu thay đổi thành viên của dự án ${project.code}.`,
    data: { changeRequest, executed },
  });
};

/** POST /projects/:id/members/emergency-transfer-ownership - Admin ép chuyển quyền Trưởng nhóm */
const emergencyTransferOwnership = async (req, res) => {
  const { project, previousOwner, newOwner } = await projectMemberService.emergencyTransferOwnership({
    projectId: req.params.id,
    adminId: req.user.id,
    targetUserId: assertRequired(req.body?.targetUserId, 'targetUserId'),
    reason: assertRequired(req.body?.reason, 'reason'),
    req,
  });

  res.status(200).json({
    success: true,
    message: `Đã chuyển quyền Trưởng nhóm của dự án ${project.code} (khẩn cấp).`,
    data: { project, previousOwner, newOwner },
  });
};

/** GET /projects/:id/members/change-requests - Xem danh sách yêu cầu thay đổi thành viên */
const getMemberChangeRequests = async (req, res) => {
  const { project, requests } = await projectMemberService.getMemberChangeRequests({
    projectId: req.params.id,
    userId: req.user.id,
    userRole: req.user.role,
    status: req.query.status,
    type: req.query.type,
  });

  res.status(200).json({
    success: true,
    message: `Danh sách yêu cầu thay đổi thành viên của dự án ${project.code}.`,
    data: { requests },
  });
};

module.exports = {
  inviteMember,
  respondInvitation,
  removeMember,
  transferOwnership,
  leaveProject,
  requestMemberChange,
  respondMemberChangeRequest,
  emergencyTransferOwnership,
  getMemberChangeRequests,
};

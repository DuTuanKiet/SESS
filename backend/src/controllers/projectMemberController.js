const projectMemberService = require('../services/projectMemberService');
const { PROJECT_MEMBER_STATUS } = require('../utils/constants');
const { assertRequired } = require('../utils/validation');

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

module.exports = { inviteMember, respondInvitation, removeMember, transferOwnership, leaveProject };

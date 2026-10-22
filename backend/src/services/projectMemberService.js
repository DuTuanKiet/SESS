const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectMemberChangeRequest = require('../models/ProjectMemberChangeRequest');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const whitelistService = require('./whitelistService');
const queueService = require('./queueService');
const {
  USER_STATUS,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
  EDITABLE_PROJECT_STATUSES,
  FINISHED_PROJECT_STATUSES,
  OWNER_MUST_TRANSFER_MESSAGE,
  PROJECT_LOCKED_MESSAGE,
  USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE,
  AUDIT_ACTIONS,
  AUDIT_TARGETS,
  USER_ROLES,
} = require('../utils/constants');
const { assertEnum, assertEmail, isValidObjectIdLike } = require('../utils/validation');
const { logAuditAction } = require('../utils/audit');

const { OWNER, MEMBER } = PROJECT_MEMBER_ROLES;
const { INVITED, ACCEPTED, REJECTED: MEMBER_REJECTED } = PROJECT_MEMBER_STATUS;
const { PENDING, APPROVED, REJECTED: CHANGE_REQUEST_REJECTED } = MEMBER_CHANGE_REQUEST_STATUS;
const { ADD: CHANGE_REQUEST_ADD, REMOVE: CHANGE_REQUEST_REMOVE } = MEMBER_CHANGE_REQUEST_TYPE;

/** Helper: kiểm tra chuỗi không rỗng */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Guard dùng chung cho FR03/FR04: dự án chỉ được chỉnh sửa (kể cả quản lý thành viên)
 * khi ở trạng thái DRAFT hoặc NEED_REVISION, các trạng thái khác bị "đóng băng".
 */
const assertProjectEditable = (project) => {
  if (!EDITABLE_PROJECT_STATUSES.includes(project.status)) {
    throw ApiError.badRequest(PROJECT_LOCKED_MESSAGE, 'PROJECT_LOCKED', { status: project.status });
  }
};

/**
 * Guard dùng chung: mỗi sinh viên chỉ được tham gia DUY NHẤT 1 dự án đang hoạt động
 * (dự án đang hoạt động = mọi trạng thái KHÁC COMPLETED và REJECTED).
 */
const assertNoActiveProject = async (userId) => {
  const memberships = await ProjectMember.find({ userId, status: ACCEPTED }).select('projectId').lean();
  if (!memberships.length) return;

  // Dự án con do thi vượt cấp (có parentId) là BẢN SAO của dự án gốc ở cấp cao hơn
  // -> không tính là "dự án active" để không chặn nhóm đang có dự án riêng.
  const activeProject = await Project.findOne({
    _id: { $in: memberships.map((m) => m.projectId) },
    status: { $nin: FINISHED_PROJECT_STATUSES },
    parentId: null,
  })
    .select('code title status')
    .lean();

  if (!activeProject) return;

  throw ApiError.badRequest(USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE, 'USER_ALREADY_IN_ACTIVE_PROJECT', {
    projectId: activeProject._id,
    projectCode: activeProject.code,
    projectStatus: activeProject.status,
  });
};

/** Tìm bản ghi thành viên của 1 user trong dự án (null nếu chưa tham gia) */
const findMembership = (projectId, userId) => ProjectMember.findOne({ projectId, userId });

/** Lấy dự án, fail fast nếu không tồn tại */
const getProjectOrFail = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  return project;
};

/**
 * Đảm bảo user là thành viên đã CHẤP NHẬN lời mời của dự án.
 * Dùng chung cho FR03/FR04 (trả về project + membership để xử lý tiếp).
 */
const assertProjectMember = async (projectId, userId, { allowStatuses = [ACCEPTED] } = {}) => {
  const project = await getProjectOrFail(projectId);
  const membership = await findMembership(project._id, userId);

  if (!membership) {
    throw ApiError.forbidden('Bạn không phải thành viên của dự án này', 'NOT_PROJECT_MEMBER');
  }
  if (!allowStatuses.includes(membership.status)) {
    throw ApiError.forbidden(
      'Lời mời tham gia dự án chưa được chấp nhận. Vui lòng phản hồi lời mời trước khi thao tác.',
      'MEMBERSHIP_NOT_ACCEPTED',
    );
  }

  return { project, membership };
};

/** Đảm bảo user là Trưởng nhóm (OWNER) của dự án */
const assertProjectOwner = async (projectId, userId) => {
  const { project, membership } = await assertProjectMember(projectId, userId);

  if (membership.role !== OWNER) {
    throw ApiError.forbidden('Chỉ Trưởng nhóm (OWNER) của dự án mới thực hiện được thao tác này', 'NOT_PROJECT_OWNER');
  }

  return { project, membership };
};

/**
 * Kiểm tra "Fail Fast" trước khi gửi lời mời:
 * 1) Email phải có trong danh sách sinh viên của trường (StudentWhitelist) -> nếu không: 404.
 * 2) Sinh viên phải đã kích hoạt tài khoản (đã xác thực OTP) -> nếu không: 400.
 * Chỉ khi cả 2 điều kiện đạt thì luồng mời mới được phép gửi email.
 */
const assertActivatedStudent = async (email) => {
  const whitelistStudent = await whitelistService.findStudentByEmail(email);

  if (!whitelistStudent) {
    throw ApiError.notFound('Sinh viên chưa có trong danh sách trường.', 'STUDENT_NOT_IN_WHITELIST');
  }

  const invitee = await User.findOne({ email });
  if (!invitee || !invitee.isEmailVerified) {
    throw ApiError.badRequest('Sinh viên chưa kích hoạt tài khoản trên hệ thống SESS.', 'INVITEE_NOT_ACTIVATED');
  }
  if (invitee.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Tài khoản của sinh viên này đang bị tạm khoá', 'INVITEE_SUSPENDED');
  }

  return { invitee, whitelistStudent };
};

/** Gửi email mời tham gia dự án qua BullMQ (lỗi gửi mail không làm hỏng lời mời đã tạo) */
const notifyInvitation = async ({ project, inviter, invitee }) => {
  try {
    await queueService.enqueueProjectInvitationEmail({
      to: invitee.email,
      payload: {
        projectTitle: project.title,
        projectCode: project.code,
        inviterName: inviter.fullName || inviter.email,
        inviteeName: invitee.fullName,
      },
    });
  } catch (error) {
    console.error(`[Project] Không gửi được email mời dự án tới ${invitee.email}: ${error.message}`);
  }
};

/** OWNER mời sinh viên khác (thuộc danh sách nhà trường và đã kích hoạt) vào dự án */
const inviteMember = async ({ projectId, inviter, email, req }) => {
  const { project } = await assertProjectOwner(projectId, inviter.id);
  assertProjectEditable(project);

  const inviteeEmail = assertEmail(email);

  if (inviteeEmail === inviter.email) {
    throw ApiError.badRequest('Bạn đã là Trưởng nhóm của dự án, không cần mời chính mình', 'CANNOT_INVITE_SELF');
  }

  const { invitee } = await assertActivatedStudent(inviteeEmail);

  const existingMembership = await findMembership(project._id, invitee._id);
  if (existingMembership?.status === ACCEPTED) {
    throw ApiError.conflict('Sinh viên này đã là thành viên của dự án', 'MEMBER_ALREADY_JOINED');
  }
  if (existingMembership?.status === INVITED) {
    throw ApiError.conflict('Đã có lời mời đang chờ sinh viên này phản hồi', 'INVITATION_ALREADY_SENT');
  }

  let invitation = existingMembership;
  if (invitation) {
    // Lời mời cũ đã bị từ chối -> cho phép mời lại
    invitation.set({ role: MEMBER, status: INVITED, invitedBy: inviter.id, email: inviteeEmail, joinedAt: null });
    await invitation.save();
  } else {
    invitation = await ProjectMember.create({
      projectId: project._id,
      userId: invitee._id,
      email: inviteeEmail,
      role: MEMBER,
      status: INVITED,
      invitedBy: inviter.id,
    });
  }

  await notifyInvitation({ project, inviter, invitee });

  await logAuditAction({
    actor: inviter,
    action: AUDIT_ACTIONS.INVITE_PROJECT_MEMBER,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: invitation._id,
    newValues: { projectId: project.id, projectCode: project.code, inviteeEmail, role: MEMBER, status: INVITED },
    req,
  });

  return { project, invitation, invitee };
};

/** Sinh viên được mời phản hồi lời mời: ACCEPTED hoặc REJECTED */
const respondInvitation = async ({ invitationId, userId, response }) => {
  assertEnum(response, [ACCEPTED, MEMBER_REJECTED], 'response', 'INVALID_INVITATION_RESPONSE');

  const invitation = await ProjectMember.findById(invitationId);
  if (!invitation) throw ApiError.notFound('Không tìm thấy lời mời tham gia dự án', 'INVITATION_NOT_FOUND');

  if (String(invitation.userId) !== String(userId)) {
    throw ApiError.forbidden('Lời mời này không dành cho bạn', 'NOT_INVITATION_RECEIVER');
  }
  if (invitation.status !== INVITED) {
    throw ApiError.badRequest(
      `Lời mời đã được phản hồi trước đó (${invitation.status})`,
      'INVITATION_ALREADY_RESPONDED',
    );
  }

  // Ràng buộc: chỉ được tham gia 1 dự án đang hoạt động (chỉ áp dụng khi CHẤP NHẬN)
  if (response === ACCEPTED) {
    await assertNoActiveProject(userId);
  }

  invitation.status = response;
  invitation.joinedAt = response === ACCEPTED ? new Date() : null;
  await invitation.save();

  const project = await getProjectOrFail(invitation.projectId);
  return { project, invitation };
};

/** OWNER xoá 1 thành viên khỏi dự án (không thể xoá chính OWNER) */
const removeMember = async ({ projectId, requester, targetUserId, req }) => {
  const { project } = await assertProjectOwner(projectId, requester.id);
  assertProjectEditable(project);

  const targetMembership = await findMembership(project._id, targetUserId);
  if (!targetMembership) throw ApiError.notFound('Không tìm thấy thành viên trong dự án', 'MEMBER_NOT_FOUND');
  if (targetMembership.role === OWNER) {
    throw ApiError.badRequest(
      'Không thể xoá Trưởng nhóm khỏi dự án. Vui lòng chuyển quyền Trưởng nhóm cho thành viên khác trước.',
      'CANNOT_REMOVE_OWNER',
    );
  }

  const removedSnapshot = {
    userId: targetMembership.userId,
    email: targetMembership.email,
    role: targetMembership.role,
    status: targetMembership.status,
  };

  await targetMembership.deleteOne();

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.REMOVE_PROJECT_MEMBER,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: targetMembership._id,
    oldValues: { projectId: project.id, projectCode: project.code, ...removedSnapshot },
    newValues: null,
    req,
  });

  return { project, removedUserId: targetUserId };
};

/** OWNER chuyển quyền Trưởng nhóm cho 1 thành viên đã chấp nhận lời mời */
const transferOwnership = async ({ projectId, requester, targetUserId, req }) => {
  const { project, membership: ownerMembership } = await assertProjectOwner(projectId, requester.id);
  assertProjectEditable(project);

  if (String(requester.id) === String(targetUserId)) {
    throw ApiError.badRequest('Bạn đang là Trưởng nhóm của dự án', 'ALREADY_OWNER');
  }

  const targetMembership = await findMembership(project._id, targetUserId);
  if (!targetMembership) throw ApiError.notFound('Không tìm thấy thành viên trong dự án', 'MEMBER_NOT_FOUND');
  if (targetMembership.status !== ACCEPTED) {
    throw ApiError.badRequest(
      'Chỉ có thể chuyển quyền Trưởng nhóm cho thành viên đã chấp nhận lời mời',
      'MEMBER_NOT_ACCEPTED',
    );
  }

  targetMembership.role = OWNER;
  await targetMembership.save();

  ownerMembership.role = MEMBER;
  await ownerMembership.save();

  project.ownerId = targetMembership.userId;
  await project.save();

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.CHANGE_PROJECT_ROLE,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: targetMembership._id,
    oldValues: { projectId: project.id, projectCode: project.code, ownerId: requester.id, ownerRole: MEMBER },
    newValues: { ownerId: targetMembership.userId, ownerRole: OWNER },
    req,
  });

  return { project, previousOwner: ownerMembership, newOwner: targetMembership };
};

/** Thành viên tự rời dự án - nếu là OWNER thì BẮT BUỘC chuyển quyền trước */
const leaveProject = async ({ projectId, userId }) => {
  const { project, membership } = await assertProjectMember(projectId, userId);
  assertProjectEditable(project);

  if (membership.role === OWNER) {
    throw ApiError.badRequest(OWNER_MUST_TRANSFER_MESSAGE, 'OWNER_MUST_TRANSFER');
  }

  await membership.deleteOne();
  return { project, leftUserId: userId };
};

/** Kiểm tra user có phải Admin */
const assertAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng', 'USER_NOT_FOUND');
  if (user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('Chỉ Admin mới được thực hiện thao tác này', 'INSUFFICIENT_ROLE');
  }
  return user;
};

/**
 * OWNER gửi yêu cầu thêm/bớt thành viên (Member Change Request).
 * Yêu cầu vào trạng thái PENDING, chờ Admin duyệt/từ chối.
 */
const requestMemberChange = async ({
  projectId,
  requester,
  targetUserId,
  type,
  reason,
  req,
}) => {
  const { project } = await assertProjectOwner(projectId, requester.id);
  assertProjectEditable(project);

  assertEnum(type, [CHANGE_REQUEST_ADD, CHANGE_REQUEST_REMOVE], 'type', 'INVALID_CHANGE_TYPE');

  if (!isValidObjectIdLike(targetUserId)) {
    throw ApiError.badRequest('Thiếu hoặc sai định dạng targetUserId', 'MISSING_TARGET_USER');
  }

  // Kiểm tra target user tồn tại
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw ApiError.notFound('Không tìm thấy người dùng đối tượng', 'TARGET_USER_NOT_FOUND');
  }

  if (String(targetUserId) === String(requester.id)) {
    throw ApiError.badRequest('Không thể gửi yêu cầu thay đổi cho chính mình', 'CANNOT_CHANGE_SELF');
  }

  const existingMembership = await findMembership(project._id, targetUserId);

  // Kiểm tra trùng yêu cầu PENDING đã có
  const existingRequest = await ProjectMemberChangeRequest.findOne({
    projectId: project._id,
    targetUserId,
    type,
    status: PENDING,
  });
  if (existingRequest) {
    throw ApiError.conflict(
      'Đã có yêu cầu thay đổi thành viên này đang chờ duyệt',
      'CHANGE_REQUEST_PENDING',
    );
  }

  // Logic nghiệp vụ tùy loại
  if (type === CHANGE_REQUEST_ADD) {
    if (existingMembership && existingMembership.status === ACCEPTED) {
      throw ApiError.conflict('Người dùng này đã là thành viên của dự án', 'MEMBER_ALREADY_JOINED');
    }
    if (existingMembership && existingMembership.status === INVITED) {
      throw ApiError.conflict('Đã có lời mời đang chờ người dùng này phản hồi', 'INVITATION_ALREADY_SENT');
    }
    // Kiểm tra user không đang tham gia dự án aktiv khác
    await assertNoActiveProject(targetUserId);
  } else {
    // CHANGE_REQUEST_REMOVE
    if (!existingMembership || existingMembership.status !== ACCEPTED) {
      throw ApiError.notFound('Người dùng này không phải thành viên đã chấp nhận của dự án', 'TARGET_NOT_MEMBER');
    }
    if (existingMembership.role === OWNER) {
      throw ApiError.badRequest(
        'Không thể yêu cầu xóa Trưởng nhóm. Vui lòng chuyển quyền Trưởng nhóm trước.',
        'CANNOT_REMOVE_OWNER',
      );
    }
  }

  const changeRequest = await ProjectMemberChangeRequest.create({
    projectId: project._id,
    requesterId: requester.id,
    targetUserId,
    type,
    status: PENDING,
    reason: reason || '',
  });

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.REQUEST_MEMBER_CHANGE,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: changeRequest._id,
    newValues: {
      projectId: project.id,
      projectCode: project.code,
      targetUserId,
      type,
      reason,
      status: PENDING,
    },
    req,
  });

  return { project, changeRequest };
};

/** Admin phê duyệt hoặc từ chối yêu cầu thay đổi thành viên */
const respondMemberChangeRequest = async ({
  requestId,
  responder,
  response,
  responseReason,
  req,
}) => {
  assertEnum(response, [APPROVED, CHANGE_REQUEST_REJECTED], 'response', 'INVALID_RESPONSE');

  const changeRequest = await ProjectMemberChangeRequest.findById(requestId);
  if (!changeRequest) {
    throw ApiError.notFound('Không tìm thấy yêu cầu thay đổi thành viên', 'CHANGE_REQUEST_NOT_FOUND');
  }
  if (changeRequest.status !== PENDING) {
    throw ApiError.badRequest(
      `Yêu cầu đã được xử lý trước đó (${changeRequest.status})`,
      'CHANGE_REQUEST_ALREADY_RESPONDED',
    );
  }

  const admin = await assertAdmin(responder.id);
  const project = await getProjectOrFail(changeRequest.projectId);

  changeRequest.status = response;
  changeRequest.responseReason = responseReason || '';
  changeRequest.respondedBy = admin._id;
  changeRequest.respondedAt = new Date();

  let executed = false;

  if (response === APPROVED) {
    if (changeRequest.type === CHANGE_REQUEST_ADD) {
      // Thêm thành viên vào dự án (trạng thái ACCEPTED trực tiếp, bỏ qua luồng mời)
      const existingMembership = await findMembership(project._id, changeRequest.targetUserId);
      if (existingMembership) {
        existingMembership.set({
          role: MEMBER,
          status: ACCEPTED,
          invitedBy: changeRequest.requesterId,
          joinedAt: new Date(),
        });
        await existingMembership.save();
      } else {
        await ProjectMember.create({
          projectId: project._id,
          userId: changeRequest.targetUserId,
          email: '',
          role: MEMBER,
          status: ACCEPTED,
          invitedBy: changeRequest.requesterId,
          joinedAt: new Date(),
        });
      }
    } else {
      // Xóa thành viên khỏi dự án
      const membership = await findMembership(project._id, changeRequest.targetUserId);
      if (membership) {
        await membership.deleteOne();
      }
    }
    changeRequest.executedAt = new Date();
    executed = true;
  }

  await changeRequest.save();

  await logAuditAction({
    actor: admin,
    action: AUDIT_ACTIONS.RESPOND_MEMBER_CHANGE,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: changeRequest._id,
    oldValues: { status: PENDING },
    newValues: {
      projectId: project.id,
      projectCode: project.code,
      targetUserId: changeRequest.targetUserId,
      type: changeRequest.type,
      response,
      responseReason,
      executed,
    },
    req,
  });

  return { project, changeRequest, executed };
};

/** Admin can thiệp ép chuyển quyền Owner kèm lý do bắt buộc (khẩn cấp) */
const emergencyTransferOwnership = async ({
  projectId,
  adminId,
  targetUserId,
  reason,
  req,
}) => {
  if (!isNonEmptyString(reason)) {
    throw ApiError.badRequest('Lý do chuyển quyền khẩn cấp là bắt buộc', 'MISSING_REASON');
  }

  const admin = await assertAdmin(adminId);
  const project = await getProjectOrFail(projectId);

  const targetMembership = await findMembership(project._id, targetUserId);
  if (!targetMembership) {
    throw ApiError.notFound('Không tìm thấy thành viên trong dự án', 'MEMBER_NOT_FOUND');
  }
  if (targetMembership.status !== ACCEPTED) {
    throw ApiError.badRequest(
      'Chỉ có thể chuyển quyền Trưởng nhóm cho thành viên đã chấp nhận lời mời',
      'MEMBER_NOT_ACCEPTED',
    );
  }

  const ownerMembership = await findMembership(project._id, project.ownerId);
  if (!ownerMembership) {
    throw ApiError.notFound('Không tìm thấy Trưởng nhóm hiện tại', 'OWNER_NOT_FOUND');
  }
  if (String(targetUserId) === String(ownerMembership.userId)) {
    throw ApiError.badRequest('Người nhận đã là Trưởng nhóm', 'ALREADY_OWNER');
  }

  const oldOwnerId = ownerMembership.userId;

  // Chuyển quyền
  targetMembership.role = OWNER;
  await targetMembership.save();

  ownerMembership.role = MEMBER;
  await ownerMembership.save();

  project.ownerId = targetMembership.userId;
  await project.save();

  await logAuditAction({
    actor: admin,
    action: AUDIT_ACTIONS.EMERGENCY_TRANSFER_OWNERSHIP,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: targetMembership._id,
    oldValues: {
      projectId: project.id,
      projectCode: project.code,
      oldOwnerId: oldOwnerId,
      newOwnerId: targetUserId,
      reason: 'EMERGENCY_ADMIN_TRANSFER',
    },
    newValues: {
      ownerId: targetMembership.userId,
      ownerRole: OWNER,
      previousOwnerRole: MEMBER,
      emergencyReason: reason,
      transferredByAdmin: admin._id,
    },
    req,
  });

  return {
    project,
    previousOwner: { userId: oldOwnerId, role: MEMBER },
    newOwner: targetMembership,
  };
};

/** Lấy danh sách yêu cầu thay đổi thành viên của dự án (Admin hoặc OWNER) */
const getMemberChangeRequests = async ({ projectId, userId, userRole, status, type }) => {
  const project = await getProjectOrFail(projectId);

  // Chỉ Admin hoặc OWNER của dự án được xem danh sách yêu cầu
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const membership = await findMembership(project._id, userId);
  const isOwner = Boolean(membership && membership.role === OWNER);

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('Bạn không có quyền xem danh sách yêu cầu thay đổi thành viên', 'INSUFFICIENT_ROLE');
  }

  const query = { projectId: project._id };
  if (status) query.status = status;
  if (type) query.type = type;

  const requests = await ProjectMemberChangeRequest.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return { project, requests };
};

module.exports = {
  findMembership,
  assertProjectMember,
  assertProjectOwner,
  assertProjectEditable,
  assertNoActiveProject,
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

const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ProjectMemberChangeRequest = require('../models/ProjectMemberChangeRequest');
const MentorAssignment = require('../models/MentorAssignment');
const HumanEvaluation = require('../models/HumanEvaluation');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const whitelistService = require('./whitelistService');
const mailerService = require('./mailerService');
const notificationService = require('./notificationService');
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
  PROJECT_STATUS,
  ASSIGNMENT_STATUS,
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
  if (invitee.role !== USER_ROLES.STUDENT && invitee.systemRole !== USER_ROLES.STUDENT) {
    throw ApiError.forbidden('Chỉ được mời tài khoản có vai trò Sinh viên vào nhóm dự án.', 'INVITEE_NOT_STUDENT');
  }

  return { invitee, whitelistStudent };
};

/** Gửi email mời tham gia dự án qua BullMQ (lỗi gửi mail không làm hỏng lời mời đã tạo) */
const notifyInvitation = async ({ project, inviter, invitee }) => {
  try {
    await mailerService.sendMail({
      to: invitee.email,
      subject: `[SESS] Lời mời tham gia dự án ${project.title || project.name || ''}`,
      text: `Bạn được mời tham gia dự án ${project.title || project.name || ''} bởi ${inviter.fullName || inviter.email}.`,
      html: `<p>Bạn được mời tham gia dự án <strong>${project.title || project.name || ''}</strong> bởi ${inviter.fullName || inviter.email}.</p>`,
    });
  } catch (error) {
    console.error(`[Project] Không gửi được email mời dự án tới ${invitee.email}: ${error.message}`);
  }
};

/** OWNER mời sinh viên khác (thuộc danh sách nhà trường và đã kích hoạt) vào dự án */
const inviteMember = async ({ projectId, inviter, email, req }) => {
  const { project } = await assertProjectOwner(projectId, inviter.id);
  assertProjectEditable(project);
  if (project.status !== PROJECT_STATUS.DRAFT) {
    throw ApiError.badRequest('Du an da SUBMITTED hoac vao giai doan sau: khong duoc moi/xoa thanh vien truc tiep. Vui long tao ProjectMemberChangeRequest cho Admin phe duyet.', 'MEMBER_CHANGE_REQUIRES_APPROVAL', { status: project.status });
  }

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
  if (project.status !== PROJECT_STATUS.DRAFT) {
    throw ApiError.badRequest('Du an da SUBMITTED hoac vao giai doan sau: khong duoc xoa thanh vien truc tiep. Vui long tao ProjectMemberChangeRequest cho Admin phe duyet.', 'MEMBER_CHANGE_REQUIRES_APPROVAL', { status: project.status });
  }

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
  // Sau SUBMITTED, chi duoc thay doi nhan su qua request + Admin duyet
  if ([PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED].includes(project.status)) {
    throw ApiError.badRequest(PROJECT_LOCKED_MESSAGE, 'PROJECT_LOCKED', { status: project.status });
  }

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
  userRole,
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

  const project = await getProjectOrFail(changeRequest.projectId);
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const responderMembership = await findMembership(project._id, responder.id);
  const isOwner = Boolean(responderMembership && responderMembership.role === OWNER);
  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('Chỉ Admin hoặc Chủ đề tài dự án được duyệt yêu cầu này.', 'INSUFFICIENT_ROLE');
  }

  changeRequest.status = response;
  changeRequest.responseReason = responseReason || '';
  changeRequest.respondedBy = responder.id;
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

  // Thông báo in-app cho người gửi yêu cầu và thành viên bị tác động khi được duyệt.
  if (response === APPROVED) {
    await notificationService.notifyMemberChangeApproved({ project, changeRequest });
  }

  await logAuditAction({
    actor: responder,
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

/** Lấy danh sách thành viên đã chấp nhận + lời mời đang chờ của dự án.
 *  Được xem bởi: Admin, Chủ đề tài, thành viên đã chấp nhận, Mentor phụ trách, Giám khảo được phân công. */
const getProjectMembers = async ({ projectId, userId, userRole }) => {
  const project = await getProjectOrFail(projectId);

  const membership = await findMembership(project._id, userId);
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isOwner = Boolean(membership && membership.role === OWNER);
  const isAcceptedMember = Boolean(membership && membership.status === ACCEPTED);

  let hasAccess = isAdmin || isOwner || isAcceptedMember;
  if (!hasAccess) {
    const mentorAssignment = await MentorAssignment.findOne({
      projectId, mentorId: userId, status: ASSIGNMENT_STATUS.ASSIGNED,
    }).lean();
    if (mentorAssignment) hasAccess = true;
  }
  if (!hasAccess) {
    const assigned = await HumanEvaluation.findOne({ projectId, evaluatorId: userId }).lean();
    if (assigned) hasAccess = true;
  }
  if (!hasAccess) {
    throw ApiError.forbidden('Bạn không có quyền xem danh sách thành viên dự án.', 'INSUFFICIENT_ROLE');
  }

  const members = await ProjectMember.find({ projectId: project._id, status: ACCEPTED })
    .populate('userId', 'fullName email studentId')
    .lean();

  // Lời mời đang chờ: hiển thị toàn bộ với Admin/Chủ đề tài, chỉ hiển thị của bản thân với thành viên khác
  let invitations;
  if (isAdmin || isOwner) {
    invitations = await ProjectMember.find({ projectId: project._id, status: INVITED })
      .populate('userId', 'fullName email studentId')
      .lean();
  } else {
    invitations = await ProjectMember.find({ projectId: project._id, userId, status: INVITED })
      .populate('userId', 'fullName email studentId')
      .lean();
  }

  return {
    project,
    members: members.map((pm) => ({
      _id: pm._id,
      userId: pm.userId,
      fullName: pm.userId ? pm.userId.fullName : '',
      email: pm.userId ? pm.userId.email : (pm.email || ''),
      studentId: pm.userId ? pm.userId.studentId : '',
      role: pm.role,
      status: pm.status,
    })),
    invitations: invitations.map((pm) => ({
      _id: pm._id,
      email: pm.email,
      userId: pm.userId,
      fullName: pm.userId ? pm.userId.fullName : '',
      role: pm.role,
      status: pm.status,
      invitedAt: pm.createdAt,
    })),
  };
};

/** Chủ đề tài thu hồi một lời mời đang chờ (theo _id hoặc email). */
const cancelInvitation = async ({ projectId, requester, identifier, req }) => {
  const { project } = await assertProjectOwner(projectId, requester.id);
  assertProjectEditable(project);

  const baseQuery = { projectId: project._id, status: INVITED };
  const invitation = isValidObjectIdLike(identifier)
    ? await ProjectMember.findOne({ ...baseQuery, _id: identifier })
    : await ProjectMember.findOne({ ...baseQuery, email: String(identifier).toLowerCase().trim() });

  if (!invitation) {
    throw ApiError.notFound('Không tìm thấy lời mời đang chờ.', 'INVITATION_NOT_FOUND');
  }

  await invitation.deleteOne();

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.CANCEL_PROJECT_INVITATION,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: invitation._id,
    oldValues: { projectId: project.id, projectCode: project.code, email: invitation.email, role: invitation.role, status: invitation.status },
    newValues: null,
    req,
  });

  return { project, invitation };
};

/** Thành viên (không phải Chủ đề tài) gửi yêu cầu rời nhóm, chờ Admin hoặc Chủ đề tài duyệt. */
const requestLeaveProject = async ({ projectId, requester, reason, req }) => {
  const { project, membership } = await assertProjectMember(projectId, requester.id);
  if (membership.role === OWNER) {
    throw ApiError.badRequest(OWNER_MUST_TRANSFER_MESSAGE, 'OWNER_MUST_TRANSFER');
  }
  if ([PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED].includes(project.status)) {
    throw ApiError.badRequest(PROJECT_LOCKED_MESSAGE, 'PROJECT_LOCKED', { status: project.status });
  }

  const existing = await ProjectMemberChangeRequest.findOne({
    projectId: project._id,
    targetUserId: requester.id,
    type: CHANGE_REQUEST_REMOVE,
    status: PENDING,
  });
  if (existing) {
    throw ApiError.conflict('Bạn đã có yêu cầu rời nhóm đang chờ duyệt.', 'CHANGE_REQUEST_PENDING');
  }

  const changeRequest = await ProjectMemberChangeRequest.create({
    projectId: project._id,
    requesterId: requester.id,
    targetUserId: requester.id,
    type: CHANGE_REQUEST_REMOVE,
    status: PENDING,
    reason: reason || '',
  });

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.REQUEST_MEMBER_CHANGE,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: changeRequest._id,
    newValues: {
      projectId: project.id, projectCode: project.code, targetUserId: requester.id,
      type: CHANGE_REQUEST_REMOVE, reason, status: PENDING,
    },
    req,
  });

  return { project, changeRequest };
};

/** Thành viên rút yêu cầu rời nhóm của bản thân (chỉ khi còn PENDING). */
const cancelLeaveRequest = async ({ projectId, requester, req }) => {
  const { membership } = await assertProjectMember(projectId, requester.id);
  if (membership.role === OWNER) {
    throw ApiError.badRequest(OWNER_MUST_TRANSFER_MESSAGE, 'OWNER_MUST_TRANSFER');
  }

  const changeRequest = await ProjectMemberChangeRequest.findOne({
    projectId,
    targetUserId: requester.id,
    type: CHANGE_REQUEST_REMOVE,
    status: PENDING,
  });
  if (!changeRequest) {
    throw ApiError.notFound('Không tìm thấy yêu cầu rời nhóm đang chờ.', 'CHANGE_REQUEST_NOT_FOUND');
  }

  await changeRequest.deleteOne();
  const project = await getProjectOrFail(projectId);

  await logAuditAction({
    actor: requester,
    action: AUDIT_ACTIONS.REQUEST_MEMBER_CHANGE,
    targetEntity: AUDIT_TARGETS.PROJECT_MEMBER,
    targetId: changeRequest._id,
    oldValues: { status: PENDING },
    newValues: { status: 'CANCELLED_BY_MEMBER', targetUserId: requester.id },
    req,
  });

  return { project };
};

/** Danh sách lời mời tham gia dự án gửi đến chính sinh viên hiện tại. */
const getMyInvitations = async ({ userId }) => {
  const invitations = await ProjectMember.find({ userId, status: INVITED })
    .populate('projectId', 'code title status ownerId')
    .populate('invitedBy', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();
  return { invitations };
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
  cancelInvitation,
  removeMember,
  transferOwnership,
  leaveProject,
  requestLeaveProject,
  cancelLeaveRequest,
  requestMemberChange,
  respondMemberChangeRequest,
  emergencyTransferOwnership,
  getProjectMembers,
  getMemberChangeRequests,
  getMyInvitations,
};

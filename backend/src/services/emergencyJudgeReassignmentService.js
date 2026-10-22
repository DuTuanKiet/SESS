const EmergencyJudgeReassignment = require('../models/EmergencyJudgeReassignment');
const User = require('../models/User');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, USER_ROLES } = require('../utils/constants');
const { assertRequired, assertObjectId } = require('../utils/validation');

/** Kiểm tra user có phải Admin */
const assertAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng', 'USER_NOT_FOUND');
  }
  if (user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('Chỉ Admin mới được thực hiện điều chuyển khẩn cấp BGK.', 'INSUFFICIENT_ROLE');
  }
  return user;
};

/** Kiểm tra user có phải Judge và có trong whitelist BGK */
const assertJudge = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng', 'USER_NOT_FOUND');
  }
  if (user.role !== USER_ROLES.JUDGE && user.systemRole !== USER_ROLES.JUDGE) {
    throw ApiError.forbidden('Người dùng không phải vai trò Giám khảo.', 'INVALID_JUDGE_ROLE');
  }
  return user;
};

/**
 * Tạo yêu cầu điều chuyển khẩn cấp BGK.
 * Admin chọn dự án của Giám khảo vắng mặt và gán sang Giám khảo dự phòng cùng tiểu ban.
 */
const createEmergencyReassignment = async ({
  projectId,
  originalJudgeId,
  replacementJudgeId,
  reason,
  faculty,
  reassignedBy,
  req,
}) => {
  assertObjectId(projectId, 'projectId');
  assertObjectId(originalJudgeId, 'originalJudgeId');
  assertObjectId(replacementJudgeId, 'replacementJudgeId');
  assertRequired(reason, 'reason');

  // Chỉ Admin được điều chuyển
  const admin = await assertAdmin(reassignedBy);

  // Kiểm tra dự án tồn tại
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }

  // Kiểm tra Giám khảo gốc tồn tại và là Judge
  const originalJudge = await assertJudge(originalJudgeId);

  // Kiểm tra Giám khảo dự phòng tồn tại và là Judge
  const replacementJudge = await assertJudge(replacementJudgeId);

  // Không được chọn cùng một người
  if (String(originalJudgeId) === String(replacementJudgeId)) {
    throw ApiError.badRequest(
      'Giám khảo dự phòng không được trùng với Giám khảo bị thay thế.',
      'SAME_JUDGE_REASSIGNMENT',
    );
  }

  // Kiểm tra không có reassignment PENDING đang tồn tại cho dự án này
  const existingReassignment = await EmergencyJudgeReassignment.findOne({
    projectId,
    status: 'PENDING',
  });
  if (existingReassignment) {
    throw ApiError.conflict(
      'Đã có yêu cầu điều chuyển khẩn cấp đang chờ xử lý cho dự án này.',
      'REASSIGNMENT_PENDING',
    );
  }

  const reassignment = await EmergencyJudgeReassignment.create({
    projectId,
    originalJudgeId,
    replacementJudgeId,
    faculty: faculty || '',
    reason,
    reassignedBy: admin._id,
    reassignedAt: new Date(),
    status: 'PENDING',
    draftDataPreserved: false,
  });

  await logAuditAction({
    actor: admin,
    action: AUDIT_ACTIONS.EMERGENCY_REASSIGN_JUDGE,
    targetEntity: AUDIT_ENTITIES.EMERGENCY_JUDGE_REASSIGNMENTS,
    targetId: reassignment._id,
    oldValues: {
      projectId,
      originalJudgeId: originalJudge.id,
      originalJudgeName: originalJudge.fullName || originalJudge.email,
      faculty,
    },
    newValues: {
      replacementJudgeId: replacementJudge.id,
      replacementJudgeName: replacementJudge.fullName || replacementJudge.email,
      reason,
      reassignedBy: admin.id,
      reassignedAt: new Date(),
      status: 'PENDING',
      draftDataPreserved: false,
    },
    req,
  });

  return { reassignment, project, originalJudge, replacementJudge };
};

/** Hoàn thành điều chuyển (Admin xác nhận đã thực hiện) */
const completeEmergencyReassignment = async ({ reassignmentId, completedBy, req }) => {
  const admin = await assertAdmin(completedBy);

  const reassignment = await EmergencyJudgeReassignment.findById(reassignmentId);
  if (!reassignment) {
    throw ApiError.notFound('Không tìm thấy yêu cầu điều chuyển khẩn cấp', 'REASSIGNMENT_NOT_FOUND');
  }
  if (reassignment.status !== 'PENDING') {
    throw ApiError.badRequest(
      `Yêu cầu điều chuyển đã ở trạng thái ${reassignment.status}, không thể hoàn thành.`,
      'REASSIGNMENT_NOT_PENDING',
    );
  }

  reassignment.status = 'COMPLETED';
  await reassignment.save();

  await logAuditAction({
    actor: admin,
    action: AUDIT_ACTIONS.COMPLETE_EMERGENCY_REASSIGNMENT,
    targetEntity: AUDIT_ENTITIES.EMERGENCY_JUDGE_REASSIGNMENTS,
    targetId: reassignment._id,
    oldValues: {
      reassignmentId: reassignment._id,
      status: 'PENDING',
    },
    newValues: {
      status: 'COMPLETED',
      completedBy: admin.id,
      completedAt: new Date(),
    },
    req,
  });

  return { reassignment };
};

/** Thu hồi điều chuyển khẩn cấp */
const revokeEmergencyReassignment = async ({ reassignmentId, revokedBy, revokeReason, req }) => {
  assertRequired(revokeReason, 'revokeReason');

  const admin = await assertAdmin(revokedBy);

  const reassignment = await EmergencyJudgeReassignment.findById(reassignmentId);
  if (!reassignment) {
    throw ApiError.notFound('Không tìm thấy yêu cầu điều chuyển khẩn cấp', 'REASSIGNMENT_NOT_FOUND');
  }
  if (reassignment.status !== 'PENDING') {
    throw ApiError.badRequest(
      `Yêu cầu điều chuyển đã ở trạng thái ${reassignment.status}, không thể thu hồi.`,
      'REASSIGNMENT_NOT_PENDING',
    );
  }

  reassignment.status = 'REVOKED';
  reassignment.revokedBy = admin._id;
  reassignment.revokedAt = new Date();
  reassignment.revokeReason = revokeReason;
  await reassignment.save();

  await logAuditAction({
    actor: admin,
    action: AUDIT_ACTIONS.REVOKE_EMERGENCY_REASSIGNMENT,
    targetEntity: AUDIT_ENTITIES.EMERGENCY_JUDGE_REASSIGNMENTS,
    targetId: reassignment._id,
    oldValues: {
      reassignmentId: reassignment._id,
      status: 'PENDING',
    },
    newValues: {
      status: 'REVOKED',
      revokedBy: admin.id,
      revokedAt: new Date(),
      revokeReason,
    },
    req,
  });

  return { reassignment };
};

/** Lấy danh sách điều chuyển khẩn cấp */
const getEmergencyReassignments = async ({ projectId, status, page = 1, limit = 20 }) => {
  const query = {};
  if (projectId) query.projectId = projectId;
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [reassignments, total] = await Promise.all([
    EmergencyJudgeReassignment.find(query)
      .populate('originalJudgeId', 'email fullName role')
      .populate('replacementJudgeId', 'email fullName role')
      .populate('reassignedBy', 'email fullName role')
      .populate('revokedBy', 'email fullName role')
      .sort({ reassignedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    EmergencyJudgeReassignment.countDocuments(query),
  ]);

  return {
    reassignments,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRecords: total,
    },
  };
};

module.exports = {
  createEmergencyReassignment,
  completeEmergencyReassignment,
  revokeEmergencyReassignment,
  getEmergencyReassignments,
  assertAdmin,
  assertJudge,
};

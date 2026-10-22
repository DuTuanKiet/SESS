const Project = require('../models/Project');
const User = require('../models/User');
const MentorAssignment = require('../models/MentorAssignment');
const EmergencyJudgeReassignment = require('../models/EmergencyJudgeReassignment');
const ProjectCancellationRequest = require('../models/ProjectCancellationRequest');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  PROJECT_STATUS,
  PROJECT_CANCELLATION_STATUS,
  ASSIGNMENT_STATUS,
  SYSTEM_ROLES,
} = require('../utils/constants');
const { assertObjectId, assertRequired, assertEnum } = require('../utils/validation');
const projectStateMachine = require('../utils/projectStateMachine');
const projectService = require('./projectService');
const projectMemberService = require('./projectMemberService');

/**
 * ProjectCancellationService - Quy trình hủy dự án có bằng chứng (Enterprise Edition).
 *
 * LUỒNG NGHIỆP VỤ:
 *   1. Thành viên/OWNER/giảng viên hướng dẫn gửi yêu cầu hủy (PENDING) kèm lý do >= 20 ký tự
 *      và danh sách bằng chứng (URL do Cloud Upload sinh).
 *   2. Admin duyệt (APPROVED) hoặc từ chối (REJECTED).
 *   3. Khi duyệt -> dự án chuyển sang REJECTED, mọi phân công Mentor/Giám khảo bị vô hiệu hóa.
 */

const MIN_REASON_LENGTH = 20;
const MAX_EVIDENCE_FILES = 10;

/** Lấy dự án hoặc ném 404 */
const getProjectOrFail = async (projectId) => {
  assertObjectId(projectId, 'projectId');
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }
  return project;
};

/** Chuẩn hóa danh sách bằng chứng */
const normalizeEvidenceFiles = (evidenceFiles) => {
  if (evidenceFiles === undefined || evidenceFiles === null) return [];
  if (!Array.isArray(evidenceFiles)) {
    throw ApiError.badRequest('"evidenceFiles" phải là mảng', 'INVALID_FIELD');
  }
  if (evidenceFiles.length > MAX_EVIDENCE_FILES) {
    throw ApiError.badRequest(
      `"evidenceFiles" chỉ được tối đa ${MAX_EVIDENCE_FILES} tệp bằng chứng`,
      'TOO_MANY_EVIDENCE_FILES',
    );
  }

  return evidenceFiles.map((file) => {
    const fileName = String(file?.fileName ?? '').trim();
    const fileUrl = String(file?.fileUrl ?? '').trim();
    if (!fileName || !fileUrl) {
      throw ApiError.badRequest(
        'Mỗi bằng chứng phải có "fileName" và "fileUrl"',
        'INVALID_EVIDENCE_FILE',
      );
    }
    return {
      fileName,
      fileUrl,
      uploadedAt: file?.uploadedAt ? new Date(file.uploadedAt) : new Date(),
    };
  });
};

/**
 * Kiểm tra người gửi có quyền gửi yêu cầu hủy không:
 * thành viên đã ACCEPTED, giảng viên hướng dẫn (mentor) hoặc Admin.
 */
const assertCanRequestCancellation = async ({ project, userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy tài khoản', 'USER_NOT_FOUND');
  }

  if (user.role === SYSTEM_ROLES.ADMIN || user.systemRole === SYSTEM_ROLES.ADMIN) {
    return { user, role: 'Admin' };
  }

  const membership = await projectMemberService.findMembership(project._id, userId);
  if (membership && membership.status === 'ACCEPTED') {
    return { user, role: membership.role === 'OWNER' ? 'Owner' : 'Member' };
  }

  const mentorAssignment = await MentorAssignment.findOne({
    projectId: project._id,
    mentorId: userId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).lean();
  if (mentorAssignment) {
    return { user, role: 'Mentor' };
  }

  throw ApiError.forbidden(
    'Chỉ thành viên dự án, giảng viên hướng dẫn hoặc Admin mới được gửi yêu cầu hủy dự án.',
    'CANNOT_REQUEST_CANCELLATION',
  );
};

/** Gửi yêu cầu hủy dự án kèm bằng chứng */
const requestCancellation = async ({
  projectId,
  requestedBy,
  reason,
  evidenceFiles,
  req,
}) => {
  assertObjectId(projectId, 'projectId');
  assertRequired(reason, 'reason');

  const trimmedReason = String(reason).trim();
  if (trimmedReason.length < MIN_REASON_LENGTH) {
    throw ApiError.badRequest(
      `Lý do hủy dự án phải có tối thiểu ${MIN_REASON_LENGTH} ký tự.`,
      'REASON_TOO_SHORT',
      { minLength: MIN_REASON_LENGTH, actual: trimmedReason.length },
    );
  }

  const project = await getProjectOrFail(projectId);

  // Dự án đã kết thúc (COMPLETED/REJECTED) thì không thể hủy
  if (!projectStateMachine.isCancellableStatus(project.status)) {
    throw ApiError.badRequest(
      `Dự án đang ở trạng thái "${project.status}" nên không thể gửi yêu cầu hủy.`,
      'PROJECT_NOT_CANCELLABLE',
      { currentStatus: project.status, cancellable: projectStateMachine.CANCELLABLE_STATUSES },
    );
  }

  const { user, role } = await assertCanRequestCancellation({ project, userId: requestedBy });

  // Chỉ có 1 yêu cầu đang chờ xử lý cho mỗi dự án
  const pending = await ProjectCancellationRequest.findOne({
    projectId: project._id,
    status: PROJECT_CANCELLATION_STATUS.PENDING,
  }).lean();
  if (pending) {
    throw ApiError.conflict(
      'Dự án đã có một yêu cầu hủy đang chờ xử lý.',
      'CANCELLATION_REQUEST_PENDING',
      { requestId: pending._id },
    );
  }

  const request = await ProjectCancellationRequest.create({
    projectId: project._id,
    requestedBy: user._id,
    reason: trimmedReason,
    evidenceFiles: normalizeEvidenceFiles(evidenceFiles),
    status: PROJECT_CANCELLATION_STATUS.PENDING,
  });

  await logAuditAction({
    actor: user,
    action: AUDIT_ACTIONS.REQUEST_PROJECT_CANCELLATION,
    targetEntity: AUDIT_ENTITIES.PROJECT_CANCELLATION_REQUESTS,
    targetId: request._id,
    newValues: {
      projectId: project._id,
      projectCode: project.code,
      requestedByRole: role,
      reason: trimmedReason,
      evidenceCount: request.evidenceFiles.length,
      status: request.status,
    },
    req,
  });

  return { request, project };
};

/** Danh sách yêu cầu hủy (Admin) */
const listCancellationRequests = async ({ status, projectId, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (status) {
    assertEnum(
      status,
      Object.values(PROJECT_CANCELLATION_STATUS),
      'status',
      'INVALID_CANCELLATION_STATUS',
    );
    query.status = status;
  }
  if (projectId) {
    assertObjectId(projectId, 'projectId');
    query.projectId = projectId;
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    ProjectCancellationRequest.find(query)
      .populate('projectId', 'code title status level')
      .populate('requestedBy', 'email fullName role')
      .populate('reviewedBy', 'email fullName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ProjectCancellationRequest.countDocuments(query),
  ]);

  return {
    requests,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRecords: total,
    },
  };
};

/** Vô hiệu hóa các phân công Mentor / Giám khảo đang hoạt động của dự án */
const deactivateProjectAssignments = async (projectId, reason) => {
  const now = new Date();

  const mentorAssignments = await MentorAssignment.find({
    projectId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  });
  for (const assignment of mentorAssignments) {
    assignment.status = ASSIGNMENT_STATUS.COMPLETED;
    assignment.endedAt = now;
    assignment.note = `${assignment.note ? `${assignment.note} | ` : ''}${reason}`.trim();
    await assignment.save();
  }

  const judgeReassignments = await EmergencyJudgeReassignment.find({
    projectId,
    status: 'PENDING',
  });
  for (const reassignment of judgeReassignments) {
    reassignment.status = 'REVOKED';
    reassignment.revokedAt = now;
    reassignment.revokeReason = reason;
    await reassignment.save();
  }

  return {
    mentorAssignmentsRevoked: mentorAssignments.length,
    judgeReassignmentsRevoked: judgeReassignments.length,
  };
};

/**
 * Admin xử lý yêu cầu hủy.
 * @param {string} decision 'APPROVED' | 'REJECTED'
 */
const reviewCancellationRequest = async ({
  requestId,
  decision,
  reviewNote,
  reviewedBy,
  req,
}) => {
  assertObjectId(requestId, 'requestId');
  assertEnum(
    decision,
    [PROJECT_CANCELLATION_STATUS.APPROVED, PROJECT_CANCELLATION_STATUS.REJECTED],
    'decision',
    'INVALID_REVIEW_DECISION',
  );
  assertRequired(reviewNote, 'reviewNote');

  const request = await ProjectCancellationRequest.findById(requestId);
  if (!request) {
    throw ApiError.notFound('Không tìm thấy yêu cầu hủy dự án', 'CANCELLATION_REQUEST_NOT_FOUND');
  }
  if (request.status !== PROJECT_CANCELLATION_STATUS.PENDING) {
    throw ApiError.badRequest(
      `Yêu cầu hủy đã ở trạng thái "${request.status}", không thể xử lý lại.`,
      'CANCELLATION_REQUEST_NOT_PENDING',
    );
  }

  const admin = await User.findById(reviewedBy);
  if (!admin) {
    throw ApiError.notFound('Không tìm thấy tài khoản xử lý', 'USER_NOT_FOUND');
  }

  const project = await getProjectOrFail(request.projectId);
  const previousStatus = request.status;

  request.status = decision;
  request.reviewedBy = admin._id;
  request.reviewNote = String(reviewNote).trim();
  request.reviewedAt = new Date();
  await request.save();

  let projectStatusChange = null;
  let deactivated = null;

  if (decision === PROJECT_CANCELLATION_STATUS.APPROVED) {
    // Chuyển dự án sang REJECTED (được phép từ mọi trạng thái chưa kết thúc).
    const result = await projectService.updateProjectStatus(
      project._id,
      PROJECT_STATUS.REJECTED,
      {
        adminId: admin._id,
        note: `Duyệt yêu cầu hủy dự án #${request._id}: ${request.reviewNote}`,
        extraAllowedTargets: [PROJECT_STATUS.REJECTED],
        transitionContext: 'HỦY DỰ ÁN',
      },
    );
    projectStatusChange = { from: project.status, to: result.project.status };

    deactivated = await deactivateProjectAssignments(
      project._id,
      `Dự án bị hủy theo yêu cầu #${request._id}`,
    );
  }

  await logAuditAction({
    actor: admin,
    action:
      decision === PROJECT_CANCELLATION_STATUS.APPROVED
        ? AUDIT_ACTIONS.APPROVE_PROJECT_CANCELLATION
        : AUDIT_ACTIONS.REJECT_PROJECT_CANCELLATION,
    targetEntity: AUDIT_ENTITIES.PROJECT_CANCELLATION_REQUESTS,
    targetId: request._id,
    oldValues: { status: previousStatus, projectStatus: project.status },
    newValues: {
      status: request.status,
      reviewNote: request.reviewNote,
      projectStatusChange,
      deactivated,
    },
    req,
  });

  return { request, project, projectStatusChange, deactivated };
};

module.exports = {
  requestCancellation,
  listCancellationRequests,
  reviewCancellationRequest,
  deactivateProjectAssignments,
  MIN_REASON_LENGTH,
  MAX_EVIDENCE_FILES,
};

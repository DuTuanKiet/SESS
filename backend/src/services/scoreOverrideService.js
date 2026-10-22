const ScoreOverride = require('../models/ScoreOverride');
const EvaluationRubric = require('../models/EvaluationRubric');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, USER_ROLES } = require('../utils/constants');
const { assertRequired, assertObjectId } = require('../utils/validation');

/** Các role được phép thực hiện Score Override */
const OVERRIDE_ALLOWED_ROLES = [USER_ROLES.ADMIN, USER_ROLES.JUDGE];

/** Kiểm tra user có quyền override điểm (Admin hoặc Judge) */
const assertOverridePermission = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('Không tìm thấy người dùng', 'USER_NOT_FOUND');
  }
  if (!OVERRIDE_ALLOWED_ROLES.includes(user.role)) {
    throw ApiError.forbidden(
      'Chỉ Admin hoặc Trưởng tiểu ban (Judge) mới được điều chỉnh điểm số.',
      'INSUFFICIENT_ROLE_FOR_OVERRIDE',
    );
  }
  return user;
};

/** Lấy rubric Active theo rootRubricId */
const getActiveRubric = async (rubricId) => {
  const rubric = await EvaluationRubric.findById(rubricId);
  if (!rubric) {
    throw ApiError.notFound('Không tìm thấy bộ tiêu chí đánh giá', 'RUBRIC_NOT_FOUND');
  }
  const targetRootId = rubric.rootRubricId || rubric._id;
  const activeRubric = await EvaluationRubric.findOne({
    $or: [{ rootRubricId: targetRootId }, { _id: targetRootId }],
    status: 'Active',
  });
  if (!activeRubric) {
    throw ApiError.notFound('Không tìm thấy phiên bản Active của bộ tiêu chí', 'RUBRIC_NOT_ACTIVE');
  }
  return activeRubric;
};

/** Tìm criterion trong rubric theo criterionId */
const findCriterionInRubric = (rubric, criterionId) => {
  const criterion = rubric.criteria.id(criterionId);
  if (!criterion) {
    throw ApiError.notFound('Không tìm thấy tiêu chí con trong bộ tiêu chí', 'CRITERION_NOT_FOUND');
  }
  return criterion;
};

/** Tạo Score Override (Admin / Judge điều chỉnh điểm) */
const createScoreOverride = async ({
  rubricId,
  criterionId,
  projectId,
  overriddenScore,
  originalScore: requestedOriginalScore,
  reason,
  overriddenBy,
  _req,
}) => {
  assertObjectId(rubricId, 'rubricId');
  assertObjectId(criterionId, 'criterionId');
  assertObjectId(projectId, 'projectId');
  assertRequired(overriddenScore !== undefined ? String(overriddenScore) : undefined, 'overriddenScore');
  assertRequired(reason, 'reason');

  const score = Number(overriddenScore);
  if (!Number.isFinite(score) || score < 0) {
    throw ApiError.badRequest('Điểm số override không hợp lệ', 'INVALID_OVERRIDE_SCORE');
  }

  // Kiểm tra quyền
  const actor = await assertOverridePermission(overriddenBy);

  // Kiểm tra rubric Active
  const activeRubric = await getActiveRubric(rubricId);

  // Kiểm tra criterion tồn tại trong rubric
  const criterion = findCriterionInRubric(activeRubric, criterionId);

  // Kiểm tra project tồn tại
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }

  // Điểm gốc: do người chấm báo lại (mặc định lấy maxScore của tiêu chí khi chưa có hệ thống chấm điểm)
  const originalScore =
    requestedOriginalScore === undefined || requestedOriginalScore === null
      ? criterion.maxScore
      : Number(requestedOriginalScore);

  if (!Number.isFinite(originalScore) || originalScore < 0) {
    throw ApiError.badRequest('Điểm gốc không hợp lệ', 'INVALID_ORIGINAL_SCORE');
  }

  const overridePoints = score - originalScore;
  const maxOverridePoints = 2; // Tiêu chuẩn Enterprise: cho phép điều chỉnh ±2 điểm

  // Kiểm tra biên độ cho phép: |overridePoints| <= maxOverridePoints
  if (Math.abs(overridePoints) > maxOverridePoints) {
    throw ApiError.badRequest(
      `Điều chỉnh điểm vượt quá giới hạn cho phép (±${maxOverridePoints} điểm). Chênh lệch hiện tại: ${overridePoints} điểm.`,
      'OVERRIDE_EXCEEDS_LIMIT',
    );
  }

  // Kiểm tra không có override APPLIED đang tồn tại
  const existingOverride = await ScoreOverride.findOne({
    rubricId: activeRubric._id,
    criterionId,
    projectId,
    status: 'APPLIED',
  });
  if (existingOverride) {
    throw ApiError.conflict(
      'Đã tồn tại bản override điểm cho tiêu chí này trên dự án này.',
      'OVERRIDE_ALREADY_EXISTS',
    );
  }

  const scoreOverride = await ScoreOverride.create({
    rubricId: activeRubric._id,
    criterionId,
    criterionName: criterion.name,
    projectId,
    originalScore,
    overriddenScore: score,
    overridePoints,
    maxOverridePoints,
    reason,
    overriddenBy: actor._id,
    overriddenAt: new Date(),
    status: 'APPLIED',
  });

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CREATE_SCORE_OVERRIDE,
    targetEntity: AUDIT_ENTITIES.SCORE_OVERRIDES,
    targetId: scoreOverride._id,
    oldValues: {
      projectId,
      rubricId: activeRubric.id,
      criterionId,
      criterionName: criterion.name,
      originalScore,
    },
    newValues: {
      overriddenScore,
      overridePoints,
      reason,
      overriddenBy: actor.id,
      overriddenAt: new Date(),
      status: 'APPLIED',
    },
    req: _req,
  });

  return { scoreOverride, project, rubric: activeRubric, criterion };
};

/** Lấy danh sách override của dự án (hoặc theo rubric) */
const getScoreOverrides = async ({ projectId, rubricId, status, page = 1, limit = 20 }) => {
  const query = {};
  if (projectId) query.projectId = projectId;
  if (rubricId) query.rubricId = rubricId;
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [overrides, total] = await Promise.all([
    ScoreOverride.find(query)
      .populate('overriddenBy', 'email fullName role')
      .populate('revokedBy', 'email fullName role')
      .sort({ overriddenAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ScoreOverride.countDocuments(query),
  ]);

  return {
    overrides,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRecords: total,
    },
  };
};

/** Thu hồi (revoke) một Score Override */
const revokeScoreOverride = async ({ overrideId, revokedBy, revokeReason, req }) => {
  assertRequired(revokeReason, 'revokeReason');

  const actor = await assertOverridePermission(revokedBy, req);

  const scoreOverride = await ScoreOverride.findById(overrideId);
  if (!scoreOverride) {
    throw ApiError.notFound('Không tìm thấy bản override điểm', 'OVERRIDE_NOT_FOUND');
  }
  if (scoreOverride.status !== 'APPLIED') {
    throw ApiError.badRequest(
      `Bản override đã ở trạng thái ${scoreOverride.status}, không thể thu hồi.`,
      'OVERRIDE_NOT_APPLIED',
    );
  }

  scoreOverride.status = 'REVOKED';
  scoreOverride.revokedBy = actor._id;
  scoreOverride.revokedAt = new Date();
  scoreOverride.revokeReason = revokeReason;
  await scoreOverride.save();

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.REVOKE_SCORE_OVERRIDE,
    targetEntity: AUDIT_ENTITIES.SCORE_OVERRIDES,
    targetId: scoreOverride._id,
    oldValues: {
      overrideId: scoreOverride._id,
      status: 'APPLIED',
      overriddenScore: scoreOverride.overriddenScore,
    },
    newValues: {
      status: 'REVOKED',
      revokedBy: actor.id,
      revokedAt: new Date(),
      revokeReason,
    },
    req,
  });

  return { scoreOverride };
};

module.exports = {
  createScoreOverride,
  getScoreOverrides,
  revokeScoreOverride,
  assertOverridePermission,
  OVERRIDE_ALLOWED_ROLES,
};

const Project = require('../models/Project');
const User = require('../models/User');
const EvaluationRound = require('../models/EvaluationRound');
const EvaluationRubric = require('../models/EvaluationRubric');
const HumanEvaluation = require('../models/HumanEvaluation');
const notificationService = require('./notificationService');
const ApiError = require('../utils/apiError');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, RUBRIC_STATUS } = require('../utils/constants');

function isJudgeUser(user) {
  const role = String(user?.role || user?.systemRole || '').toLowerCase();
  return role === 'judge';
}

function ensureObjectId(id, fieldName) {
  if (!id || !String(id).match(/^[0-9a-fA-F]{24}$/)) {
    throw ApiError.badRequest(`${fieldName} không hợp lệ.`, 'INVALID_ID', { field: fieldName });
  }
  return String(id);
}

async function resolveRubricVersion({ rubricVersionId, evaluationRound }) {
  if (rubricVersionId) {
    ensureObjectId(rubricVersionId, 'rubricVersionId');
    const rubric = await EvaluationRubric.findById(rubricVersionId).lean();
    if (!rubric) throw ApiError.notFound('Không tìm thấy rubricVersionId.', 'RUBRIC_NOT_FOUND');
    if (rubric.status !== RUBRIC_STATUS.ACTIVE && rubric.status !== RUBRIC_STATUS.DEPRECATED) {
      throw ApiError.badRequest('Rubric được gán cho phiếu chấm phải là phiên bản hợp lệ (ACTIVE/DEPRECATED).', 'RUBRIC_NOT_READY');
    }
    return rubric;
  }

  if (evaluationRound?.rubricId) {
    const roundRubric = await EvaluationRubric.findById(evaluationRound.rubricId).lean();
    if (roundRubric) return roundRubric;
  }

  const activeRubric = await EvaluationRubric.findOne({ status: RUBRIC_STATUS.ACTIVE }).sort({ updatedAt: -1 }).lean();
  if (!activeRubric) {
    throw ApiError.badRequest('Chưa có bộ tiêu chí ACTIVE để gán cho phiếu chấm.', 'ACTIVE_RUBRIC_NOT_FOUND');
  }
  return activeRubric;
}

function buildJudgeNotificationContent({ project, round, rubric }) {
  const projectLabel = project?.title || project?.name || project?.code || 'Dự án';
  const roundLabel = round?.roundName ? `${round.roundName}${round.roundNumber ? ` (Vòng ${round.roundNumber})` : ''}` : 'Đợt đánh giá';
  const rubricLabel = rubric?.name ? ` • Rubric: ${rubric.name}${rubric.version ? ` v${rubric.version}` : ''}` : '';
  return `Bạn được phân công chấm điểm cho ${projectLabel} trong ${roundLabel}${rubricLabel}. Vui lòng truy cập workspace để bắt đầu/tiếp tục chấm điểm.`;
}

async function createJudgeAssignmentNotification({ evaluation, project, round, rubric, force = false, deliveryId }) {
  if (!evaluation?._id || !evaluation?.evaluatorId) return null;

  const link = `/judge/evaluations/${String(evaluation._id)}`;
  const title = 'Bạn được phân công chấm điểm dự án mới';
  const content = buildJudgeNotificationContent({ project, round, rubric });

  try {
    // Merge: retry theo evaluation/người nhận không gửi lại kể cả thông báo cũ đã đọc.
    // Gửi lại chủ động cần deliveryId riêng; caller phải giữ ID đó qua mọi lần retry kỹ thuật.
    if (force && !deliveryId) throw ApiError.badRequest('Thiếu mã lần gửi lại.', 'MISSING_DELIVERY_ID');
    const eventKey = `judge-assigned:${evaluation._id}:${evaluation.evaluatorId}`
      + (force ? `:resend:${deliveryId}` : '');
    const notification = await notificationService.createJudgeNotification({
      recipientId: evaluation.evaluatorId, recipientRole: 'judge', title, message: content,
      type: 'info', actionUrl: link, eventKey,
      relatedEvaluationId: evaluation._id,
      relatedProjectId: project?._id || evaluation.projectId || null,
    }, { isResend: force });
    return notification;
  } catch (error) {
    // Assignment must succeed even if notification delivery fails.
    console.warn('[adminEvaluationService] Failed to create judge assignment notification:', error.message);
    return null;
  }
}

async function assignJudgeToProject({
  adminId,
  adminUser = null,
  evaluationRoundId,
  projectId,
  evaluatorId,
  rubricVersionId,
  req = null,
}) {
  ensureObjectId(evaluationRoundId, 'evaluationRoundId');
  ensureObjectId(projectId, 'projectId');
  ensureObjectId(evaluatorId, 'evaluatorId');

  const [round, project, evaluator] = await Promise.all([
    EvaluationRound.findById(evaluationRoundId),
    Project.findById(projectId),
    User.findById(evaluatorId),
  ]);

  if (!round) throw ApiError.notFound('Không tìm thấy đợt đánh giá.', 'EVALUATION_ROUND_NOT_FOUND');
  if (round.status !== 'OPEN') {
    throw ApiError.badRequest('Chỉ có thể phân công giám khảo khi đợt đánh giá đang OPEN.', 'EVALUATION_ROUND_CLOSED');
  }
  if (!project) throw ApiError.notFound('Không tìm thấy dự án.', 'PROJECT_NOT_FOUND');
  if (!evaluator) throw ApiError.notFound('Không tìm thấy giám khảo.', 'JUDGE_NOT_FOUND');
  if (!isJudgeUser(evaluator)) {
    throw ApiError.badRequest('Người được phân công phải có vai trò giám khảo.', 'INVALID_JUDGE_ROLE');
  }

  const rubric = await resolveRubricVersion({ rubricVersionId, evaluationRound: round });

  let evaluation = await HumanEvaluation.findOne({
    evaluationRoundId: round._id,
    projectId: project._id,
    evaluatorId: evaluator._id,
  });

  let created = false;
  if (!evaluation) {
    evaluation = await HumanEvaluation.create({
      evaluationRoundId: round._id,
      projectId: project._id,
      evaluatorId: evaluator._id,
      rubricVersionId: rubric._id,
      scores: [],
      totalScore: 0,
      generalFeedback: '',
      status: 'DRAFT',
      submittedAt: null,
    });
    created = true;
  } else if (evaluation.status !== 'SUBMITTED' && String(evaluation.rubricVersionId) !== String(rubric._id)) {
    // If not submitted, align to requested/active rubric version for consistent judging.
    evaluation.rubricVersionId = rubric._id;
    await evaluation.save();
  }

  await createAuditLog({
    userId: adminId || adminUser?._id || adminUser || null,
    action: AUDIT_ACTIONS.ASSIGN_JUDGE_EVALUATION,
    targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
    targetId: evaluation._id,
    oldValues: created ? null : { status: evaluation.status, rubricVersionId: evaluation.rubricVersionId },
    newValues: {
      evaluationRoundId: round._id,
      projectId: project._id,
      evaluatorId: evaluator._id,
      rubricVersionId: rubric._id,
      evaluationStatus: evaluation.status,
      created,
    },
    req,
  });

  const notification = await createJudgeAssignmentNotification({
    evaluation,
    project,
    round,
    rubric,
  });

  const populated = await HumanEvaluation.findById(evaluation._id)
    .populate({ path: 'projectId', select: 'title name code status level category field' })
    .populate({ path: 'evaluatorId', select: 'fullName name email role systemRole' })
    .populate({ path: 'evaluationRoundId', select: 'roundNumber roundName status rubricId' })
    .populate({ path: 'rubricVersionId', select: 'name version status totalWeight' })
    .lean();

  return { evaluation: populated, created, notificationId: notification?._id || null };
}

async function listRoundAssignments(evaluationRoundId) {
  ensureObjectId(evaluationRoundId, 'evaluationRoundId');
  const items = await HumanEvaluation.find({ evaluationRoundId })
    .populate({ path: 'projectId', select: 'title name code status level' })
    .populate({ path: 'evaluatorId', select: 'fullName name email role systemRole' })
    .populate({ path: 'rubricVersionId', select: 'name version status' })
    .sort({ updatedAt: -1 })
    .lean();
  return items;
}

module.exports = {
  assignJudgeToProject,
  listRoundAssignments,
};
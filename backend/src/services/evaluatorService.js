const mongoose = require('mongoose');
const EvaluationRubric = require('../models/EvaluationRubric');
const HumanEvaluation = require('../models/HumanEvaluation');
const Project = require('../models/Project');
const { createAuditLog } = require('../services/auditService');
const ApiError = require('../utils/apiError');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, RUBRIC_STATUS } = require('../utils/constants');

const DEVIATION_THRESHOLD = 2.5; // điểm trên thang 10 (đã quy đổi trọng số)

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function assertJudgeAccess(evaluation, userId, isAdmin) {
  if (isAdmin) return;
  if (String(evaluation.evaluatorId) !== String(userId)) {
    throw ApiError.forbidden('Bạn không có quyền truy cập phiếu chấm điểm này.', 'EVALUATION_FORBIDDEN');
  }
}

function normalizeScores(rawScores) {
  if (!Array.isArray(rawScores)) {
    throw ApiError.badRequest('Danh sách điểm không hợp lệ.', 'INVALID_SCORES');
  }
  return rawScores.map((item) => ({
    criterionId: String(item?.criterionId || ''),
    score: item?.score === '' || item?.score === undefined || item?.score === null ? null : Number(item.score),
    comment: typeof item?.comment === 'string' ? item.comment.trim() : '',
  }));
}

function computeWeightedTotal(scores, criteriaById) {
  let total = 0;
  for (const scoreItem of scores) {
    const criterion = criteriaById.get(scoreItem.criterionId);
    if (!criterion || scoreItem.score == null) continue;
    total += (scoreItem.score * Number(criterion.weight || 0)) / 100;
  }
  return round2(total);
}

async function computeDeviationWarning(evaluation, submittedTotal) {
  const peers = await HumanEvaluation.find({
    evaluationRoundId: evaluation.evaluationRoundId,
    projectId: evaluation.projectId,
    status: 'SUBMITTED',
    _id: { $ne: evaluation._id },
  })
    .select('totalScore evaluatorId')
    .lean();

  if (!peers.length) {
    return { hasDeviationWarning: false, deviationFromAverage: 0, peerAverageScore: null, peerCount: 0 };
  }

  const peerScores = peers.map((item) => Number(item.totalScore || 0));
  const peerAverageScore = round2(peerScores.reduce((sum, score) => sum + score, 0) / peerScores.length);
  const deviationFromAverage = round2(submittedTotal - peerAverageScore);

  return {
    hasDeviationWarning: Math.abs(deviationFromAverage) >= DEVIATION_THRESHOLD,
    deviationFromAverage,
    peerAverageScore,
    peerCount: peers.length,
    threshold: DEVIATION_THRESHOLD,
  };
}

async function getAssignments(userId) {
  if (!isValidObjectId(userId)) {
    throw ApiError.badRequest('ID giám khảo không hợp lệ.', 'INVALID_USER_ID');
  }

  const assignments = await HumanEvaluation.find({ evaluatorId: userId })
    .populate({
      path: 'projectId',
      select: 'title name code category field status level abstract description attachmentUrl problemStatement solution businessModel',
    })
    .populate({
      path: 'evaluationRoundId',
      select: 'roundNumber roundName status rubricId',
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return assignments.map((item) => ({
    ...item,
    isLocked: item.status === 'SUBMITTED',
  }));
}

async function getWorkspace(evaluationId, userId, isAdmin = false) {
  if (!isValidObjectId(evaluationId)) {
    throw ApiError.badRequest('ID phiếu chấm điểm không hợp lệ.', 'INVALID_EVALUATION_ID');
  }

  const evaluation = await HumanEvaluation.findById(evaluationId)
    .populate({
      path: 'projectId',
      select: 'title name code category field status level abstract description attachmentUrl problemStatement solution businessModel ownerId',
    })
    .populate({
      path: 'evaluationRoundId',
      select: 'roundNumber roundName status rubricId',
    });

  if (!evaluation) throw ApiError.notFound('Không tìm thấy phiếu chấm điểm.', 'EVALUATION_NOT_FOUND');
  assertJudgeAccess(evaluation, userId, isAdmin);

  const rubric = await EvaluationRubric.findById(evaluation.rubricVersionId).lean();
  if (!rubric) throw ApiError.notFound('Không tìm thấy bộ tiêu chí chấm điểm.', 'RUBRIC_NOT_FOUND');

  const deviation = evaluation.status === 'SUBMITTED' ? await computeDeviationWarning(evaluation, evaluation.totalScore) : null;

  return {
    evaluation: {
      ...evaluation.toObject(),
      isLocked: evaluation.status === 'SUBMITTED',
      deviation,
    },
    project: evaluation.projectId,
    rubric,
    meta: {
      rubricStatus: rubric.status,
      rubricVersion: rubric.version,
      canEdit: !(!isAdmin && evaluation.status === 'SUBMITTED'),
      requiresFullSubmission: true,
    },
  };
}

function validateScoresAgainstRubric(scores, rubric, actionType) {
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  if (!criteria.length) {
    throw ApiError.badRequest('Bộ tiêu chí không có dữ liệu chấm điểm.', 'RUBRIC_EMPTY_CRITERIA');
  }

  const criteriaById = new Map(criteria.map((criterion) => [String(criterion._id), criterion]));
  const incomingById = new Map(scores.map((item) => [item.criterionId, item]));
  const validated = [];

  for (const criterion of criteria) {
    const criterionId = String(criterion._id);
    const item = incomingById.get(criterionId);
    const minScore = Number(criterion.minScore ?? 0);
    const maxScore = Number(criterion.maxScore ?? 10);

    if (!item) {
      if (actionType === 'SUBMIT') {
        throw ApiError.badRequest(`Thiếu điểm cho tiêu chí "${criterion.name}".`, 'CRITERION_SCORE_REQUIRED', {
          criterionId,
        });
      }
      validated.push({ criterionId, score: null, comment: '' });
      continue;
    }

    if (item.score == null || item.score === '') {
      if (actionType === 'SUBMIT') {
        throw ApiError.badRequest(`Tiêu chí "${criterion.name}" chưa được chấm điểm.`, 'CRITERION_SCORE_REQUIRED', {
          criterionId,
        });
      }
      validated.push({ criterionId, score: null, comment: item.comment });
      continue;
    }

    if (!Number.isFinite(item.score)) {
      throw ApiError.badRequest(`Điểm của tiêu chí "${criterion.name}" không hợp lệ.`, 'INVALID_SCORE_VALUE', {
        criterionId,
      });
    }

    if (item.score < minScore || item.score > maxScore) {
      throw ApiError.badRequest(
        `Điểm của tiêu chí "${criterion.name}" phải nằm trong khoảng ${minScore}-${maxScore}.`,
        'SCORE_OUT_OF_RANGE',
        { criterionId, minScore, maxScore },
      );
    }

    if (item.comment.length > 2000) {
      throw ApiError.badRequest(`Nhận xét tiêu chí "${criterion.name}" vượt quá 2000 ký tự.`, 'COMMENT_TOO_LONG', {
        criterionId,
      });
    }

    validated.push({
      criterionId,
      score: round2(item.score),
      comment: item.comment,
    });
  }

  for (const item of scores) {
    if (!criteriaById.has(item.criterionId)) {
      throw ApiError.badRequest('Có tiêu chí không thuộc bộ rubric hiện tại.', 'INVALID_CRITERION', {
        criterionId: item.criterionId,
      });
    }
  }

  return { validated, criteriaById };
}

async function submitEvaluation(evaluationId, body, userId, isAdmin, req) {
  if (!isValidObjectId(evaluationId)) {
    throw ApiError.badRequest('ID phiếu chấm điểm không hợp lệ.', 'INVALID_EVALUATION_ID');
  }

  const evaluation = await HumanEvaluation.findById(evaluationId);
  if (!evaluation) throw ApiError.notFound('Không tìm thấy phiếu chấm điểm.', 'EVALUATION_NOT_FOUND');
  assertJudgeAccess(evaluation, userId, isAdmin);

  if (evaluation.status === 'SUBMITTED' && !isAdmin) {
    throw ApiError.forbidden('Phiếu chấm điểm đã được nộp chính thức và không thể chỉnh sửa.', 'EVALUATION_LOCKED');
  }

  const actionType = String(body?.actionType || 'DRAFT').toUpperCase() === 'SUBMIT' ? 'SUBMIT' : 'DRAFT';
  const generalFeedback = typeof body?.generalFeedback === 'string' ? body.generalFeedback.trim() : evaluation.generalFeedback || '';
  if (generalFeedback.length > 4000) {
    throw ApiError.badRequest('Nhận xét chung vượt quá 4000 ký tự.', 'GENERAL_FEEDBACK_TOO_LONG');
  }
  if (actionType === 'SUBMIT' && !generalFeedback) {
    throw ApiError.badRequest('Vui lòng nhập nhận xét chung trước khi nộp chính thức.', 'GENERAL_FEEDBACK_REQUIRED');
  }

  const rubric = await EvaluationRubric.findById(evaluation.rubricVersionId);
  if (!rubric) throw ApiError.notFound('Không tìm thấy bộ tiêu chí chấm điểm.', 'RUBRIC_NOT_FOUND');
  if (rubric.status !== RUBRIC_STATUS.ACTIVE && rubric.status !== RUBRIC_STATUS.DEPRECATED) {
    // Draft rubric should not be used for official scoring
    throw ApiError.badRequest('Bộ tiêu chí chưa sẵn sàng để chấm điểm.', 'RUBRIC_NOT_READY');
  }

  const normalizedScores = normalizeScores(body?.scores);
  const { validated, criteriaById } = validateScoresAgainstRubric(normalizedScores, rubric, actionType);
  const totalScore = computeWeightedTotal(validated.filter((item) => item.score != null), criteriaById);

  const oldValues = {
    status: evaluation.status,
    totalScore: evaluation.totalScore,
    submittedAt: evaluation.submittedAt,
  };

  evaluation.scores = validated.filter((item) => item.score != null || item.comment).map((item) => ({
    criterionId: item.criterionId,
    score: item.score ?? 0,
    comment: item.comment,
  }));
  // Keep explicit null-as-not-scored behavior only for draft storage by filtering unsaved nulls above;
  // for actual persisted score objects, only store scored criteria and criteria with comments.
  evaluation.totalScore = totalScore;
  evaluation.generalFeedback = generalFeedback;

  let deviation = null;
  if (actionType === 'SUBMIT') {
    evaluation.status = 'SUBMITTED';
    evaluation.submittedAt = new Date();
    deviation = await computeDeviationWarning(evaluation, totalScore);
  } else {
    evaluation.status = 'DRAFT';
    evaluation.submittedAt = null;
  }

  await evaluation.save();

  const action = actionType === 'SUBMIT' ? AUDIT_ACTIONS.SUBMIT_EVALUATION_SCORE : 'SAVE_EVALUATION_DRAFT';
  await createAuditLog({
    userId,
    action,
    targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
    targetId: evaluation._id,
    oldValues,
    newValues: {
      status: evaluation.status,
      totalScore: evaluation.totalScore,
      submittedAt: evaluation.submittedAt,
      projectId: evaluation.projectId,
      evaluationRoundId: evaluation.evaluationRoundId,
      deviationWarning: deviation?.hasDeviationWarning || false,
    },
    req,
  });

  const populated = await HumanEvaluation.findById(evaluation._id)
    .populate({
      path: 'projectId',
      select: 'title name code category field status level',
    })
    .populate({
      path: 'evaluationRoundId',
      select: 'roundNumber roundName status rubricId',
    })
    .lean();

  return {
    ...populated,
    isLocked: populated?.status === 'SUBMITTED',
    deviation,
  };
}

async function getEvaluationSummary(evaluationId, userId, isAdmin = false) {
  if (!isValidObjectId(evaluationId)) {
    throw ApiError.badRequest('ID phiếu chấm điểm không hợp lệ.', 'INVALID_EVALUATION_ID');
  }

  const evaluation = await HumanEvaluation.findById(evaluationId).lean();
  if (!evaluation) throw ApiError.notFound('Không tìm thấy phiếu chấm điểm.', 'EVALUATION_NOT_FOUND');
  if (!isAdmin && String(evaluation.evaluatorId) !== String(userId)) {
    throw ApiError.forbidden('Bạn không có quyền xem tổng hợp phiếu này.', 'EVALUATION_FORBIDDEN');
  }

  const peerEvaluations = await HumanEvaluation.find({
    evaluationRoundId: evaluation.evaluationRoundId,
    projectId: evaluation.projectId,
  })
    .select('status totalScore evaluatorId submittedAt')
    .lean();

  const submitted = peerEvaluations.filter((item) => item.status === 'SUBMITTED');
  const averageScore = submitted.length
    ? round2(submitted.reduce((sum, item) => sum + Number(item.totalScore || 0), 0) / submitted.length)
    : null;

  return {
    evaluationId: evaluation._id,
    projectId: evaluation.projectId,
    evaluationRoundId: evaluation.evaluationRoundId,
    panelCount: peerEvaluations.length,
    submittedCount: submitted.length,
    draftCount: peerEvaluations.length - submitted.length,
    averageScore,
    myStatus: evaluation.status,
    myTotalScore: evaluation.totalScore,
  };
}

// Backward-compatible export name used by existing route wiring
module.exports = {
  getAssignments,
  getWorkspace,
  submitEvaluation,
  getEvaluationSummary,
};
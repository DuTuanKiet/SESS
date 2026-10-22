const Project = require('../models/Project');
const User = require('../models/User');
const EvaluationRubric = require('../models/EvaluationRubric');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, PROJECT_STATUS, RUBRIC_STATUS } = require('../utils/constants');
const { assertObjectId, assertRequired } = require('../utils/validation');
const judgeWhitelistService = require('./judgeWhitelistService');
const projectService = require('./projectService');

/**
 * EvaluationService - Vòng chấm điểm Rubric của Ban Giám khảo (Enterprise Edition).
 *
 * Mục tiêu: đưa trạng thái EVALUATED vào luồng nghiệp vụ thực tế:
 *   UNDER_MENTORSHIP -> (100% giám khảo trong tiểu ban đã nộp phiếu) -> EVALUATED
 *   EVALUATED -> COMPLETED | REJECTED
 *
 * Mỗi cấp thi có bộ điểm độc lập: dữ liệu chấm gắn với projectId nên khi thi vượt cấp,
 * dự án con bắt đầu với bộ điểm rỗng (không kế thừa tiến độ cấp trước).
 */

/** Lấy dự án hoặc ném 404 */
const getProjectOrFail = async (projectId) => {
  assertObjectId(projectId, 'projectId');
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }
  return project;
};

/** Lấy rubric đang ACTIVE */
const getActiveRubricOrFail = async (rubricId) => {
  assertObjectId(rubricId, 'rubricId');
  const rubric = await EvaluationRubric.findById(rubricId);
  if (!rubric) {
    throw ApiError.notFound('Không tìm thấy bộ tiêu chí', 'RUBRIC_NOT_FOUND');
  }
  if (rubric.status !== RUBRIC_STATUS.ACTIVE) {
    throw ApiError.badRequest(
      'Chỉ được chấm điểm theo bộ tiêu chí đang ACTIVE.',
      'RUBRIC_NOT_ACTIVE',
      { rubricStatus: rubric.status },
    );
  }
  return rubric;
};

/**
 * Admin gán giám khảo vào tiểu ban của dự án.
 * Chỉ giám khảo có trong whitelist mới được gán.
 */
const assignJudge = async ({ projectId, judgeId, actor, req }) => {
  assertObjectId(projectId, 'projectId');
  assertObjectId(judgeId, 'judgeId');

  const project = await getProjectOrFail(projectId);

  const judge = await User.findById(judgeId);
  if (!judge) {
    throw ApiError.notFound('Không tìm thấy tài khoản giám khảo', 'USER_NOT_FOUND');
  }
  if (judge.role !== 'judge' && judge.systemRole !== 'judge') {
    throw ApiError.forbidden(
      'Chỉ tài khoản có vai trò Giám khảo mới được gán vào tiểu ban chấm điểm.',
      'INVALID_JUDGE_ROLE',
    );
  }
  await judgeWhitelistService.assertJudgeInWhitelist(judge.email);

  const panel = (project.judges ?? []).map(String);
  if (!panel.includes(String(judgeId))) {
    project.judges.push(judge._id);
    await project.save();
  }

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.ASSIGN_PROJECT_JUDGE,
    targetEntity: AUDIT_ENTITIES.PROJECTS,
    targetId: project._id,
    newValues: {
      judgeId: judge._id,
      judgeEmail: judge.email,
      panelSize: project.judges.length,
    },
    req,
  });

  return { project, judge };
};

/**
 * Giám khảo nộp phiếu chấm điểm cho 1 tiêu chí.
 * Khi 100% tiểu ban đã nộp đủ các tiêu chí -> tự động chuyển dự án sang EVALUATED.
 */
const submitScore = async ({ projectId, rubricId, criterionId, judgeId, score, comment, actor, req }) => {
  assertObjectId(projectId, 'projectId');
  assertObjectId(rubricId, 'rubricId');
  assertObjectId(criterionId, 'criterionId');
  assertObjectId(judgeId, 'judgeId');
  assertRequired(score, 'score');

  const project = await getProjectOrFail(projectId);

  // Chỉ giám khảo trong tiểu ban được chấm điểm
  const panel = (project.judges ?? []).map(String);
  if (!panel.includes(String(judgeId))) {
    throw ApiError.forbidden(
      'Bạn không thuộc tiểu ban giám khảo của dự án này.',
      'NOT_IN_JUDGE_PANEL',
    );
  }

  // Vòng chấm chỉ mở khi dự án ở trạng thái UNDER_MENTORSHIP
  if (project.status !== PROJECT_STATUS.UNDER_MENTORSHIP) {
    throw ApiError.badRequest(
      `Chỉ chấm điểm được khi dự án ở trạng thái UNDER_MENTORSHIP (hiện tại: ${project.status}).`,
      'PROJECT_NOT_IN_EVALUATION',
      { currentStatus: project.status },
    );
  }

  const rubric = await getActiveRubricOrFail(rubricId);
  const criterion = rubric.criteria.find((item) => String(item._id) === String(criterionId));
  if (!criterion) {
    throw ApiError.notFound('Không tìm thấy tiêu chí trong bộ tiêu chí', 'CRITERION_NOT_FOUND');
  }

  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < criterion.minScore || numericScore > criterion.maxScore) {
    throw ApiError.badRequest(
      `Điểm phải nằm trong khoảng [${criterion.minScore}, ${criterion.maxScore}].`,
      'SCORE_OUT_OF_RANGE',
      { minScore: criterion.minScore, maxScore: criterion.maxScore },
    );
  }

  const existing = await EvaluationSubmission.findOne({
    projectId: project._id,
    rubricId: rubric._id,
    criterionId: criterion._id,
    judgeId,
  });
  if (existing) {
    throw ApiError.conflict(
      'Bạn đã nộp phiếu chấm điểm cho tiêu chí này rồi.',
      'EVALUATION_ALREADY_SUBMITTED',
    );
  }

  const submission = await EvaluationSubmission.create({
    projectId: project._id,
    rubricId: rubric._id,
    criterionId: criterion._id,
    judgeId,
    score: numericScore,
    comment: comment ?? '',
    submittedAt: new Date(),
  });

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.SUBMIT_EVALUATION_SCORE,
    targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
    targetId: submission._id,
    newValues: {
      projectId: project._id,
      rubricId: rubric._id,
      criterionId: criterion._id,
      score: numericScore,
    },
    req,
  });

  const progress = await getEvaluationProgress({ projectId: project._id, rubricId: rubric._id });

  // 100% giám khảo đã nộp đủ -> tự động kích hoạt trạng thái EVALUATED
  let evaluated = false;
  if (progress.completed && project.status === PROJECT_STATUS.UNDER_MENTORSHIP) {
    await projectService.updateProjectStatus(project._id, PROJECT_STATUS.EVALUATED, {
      adminId: null,
      note: 'Tự động: 100% Ban Giám khảo đã hoàn tất chấm điểm.',
      transitionContext: 'ĐÁNH GIÁ',
    });
    evaluated = true;
  }

  return { submission, progress, evaluated };
};

/**
 * Tính tiến độ vòng chấm: đã nộp bao nhiêu / tổng số phiếu cần có.
 */
const getEvaluationProgress = async ({ projectId, rubricId }) => {
  const project = await getProjectOrFail(projectId);
  const panel = project.judges ?? [];

  const rubric = rubricId
    ? await EvaluationRubric.findById(rubricId).lean()
    : await EvaluationRubric.findOne({ status: RUBRIC_STATUS.ACTIVE }).lean();

  const criteria = rubric?.criteria ?? [];
  const totalRequired = panel.length * criteria.length;

  const submissions = await EvaluationSubmission.find({
    projectId: project._id,
    ...(rubricId ? { rubricId } : rubric ? { rubricId: rubric._id } : {}),
  })
    .select('criterionId judgeId score')
    .lean();

  const submittedByJudge = new Set(submissions.map((item) => String(item.judgeId)));
  const submittedCount = submissions.length;

  return {
    rubricId: rubric?._id ?? null,
    rubricName: rubric?.name ?? '',
    panelSize: panel.length,
    criteriaCount: criteria.length,
    totalRequired,
    submittedCount,
    submittedByJudgeCount: submittedByJudge.size,
    completed: panel.length > 0 && totalRequired > 0 && submittedCount >= totalRequired,
    projectStatus: project.status,
  };
};

/** Tổng hợp kết quả chấm điểm của dự án */
const getEvaluationSummary = async ({ projectId }) => {
  const project = await getProjectOrFail(projectId);
  const progress = await getEvaluationProgress({ projectId: project._id });

  const submissions = await EvaluationSubmission.find({ projectId: project._id })
    .populate('judgeId', 'email fullName role')
    .sort({ submittedAt: 1 })
    .lean();

  const averageScore = submissions.length
    ? Number((submissions.reduce((sum, item) => sum + item.score, 0) / submissions.length).toFixed(2))
    : 0;

  return {
    project: { id: project.id, code: project.code, status: project.status, level: project.level },
    judges: await User.find({ _id: { $in: project.judges ?? [] } })
      .select('email fullName role')
      .lean(),
    progress,
    averageScore,
    submissions,
  };
};

module.exports = {
  assignJudge,
  submitScore,
  getEvaluationProgress,
  getEvaluationSummary,
};

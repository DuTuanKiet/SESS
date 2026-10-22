const scoreOverrideService = require('../services/scoreOverrideService');
const { assertRequired } = require('../utils/validation');

/** POST /api/v1/score-overrides - Tạo Score Override (Admin / Judge) */
const handleCreateScoreOverride = async (req, res, next) => {
  try {
    const { rubricId, criterionId, projectId, overriddenScore, originalScore, reason } = req.body;

    assertRequired(rubricId, 'rubricId');
    assertRequired(criterionId, 'criterionId');
    assertRequired(projectId, 'projectId');

    const result = await scoreOverrideService.createScoreOverride({
      rubricId,
      criterionId,
      projectId,
      overriddenScore,
      originalScore,
      reason,
      overriddenBy: req.user.id,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'SCORE_OVERRIDE_CREATED',
      message: 'Điều chỉnh điểm số thành công.',
      data: {
        scoreOverride: result.scoreOverride,
        project: { id: result.project.id, code: result.project.code },
        rubric: { id: result.rubric.id, name: result.rubric.name },
        criterion: { id: result.criterion.id, name: result.criterion.name },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/score-overrides - Lấy danh sách Score Override */
const handleGetScoreOverrides = async (req, res, next) => {
  try {
    const { projectId, rubricId, status, page, limit } = req.query;
    const result = await scoreOverrideService.getScoreOverrides({
      projectId,
      rubricId,
      status,
      page,
      limit,
    });
    return res.status(200).json({
      success: true,
      code: 'SCORE_OVERRIDES_FETCHED',
      message: 'Lấy danh sách điều chỉnh điểm thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/score-overrides/:overrideId/revoke - Thu hồi Score Override (Admin / Judge) */
const handleRevokeScoreOverride = async (req, res, next) => {
  try {
    const { overrideId } = req.params;
    const { revokeReason } = req.body;

    assertRequired(overrideId, 'overrideId');
    assertRequired(revokeReason, 'revokeReason');

    const result = await scoreOverrideService.revokeScoreOverride({
      overrideId,
      revokedBy: req.user.id,
      revokeReason,
      req,
    });

    return res.status(200).json({
      success: true,
      code: 'SCORE_OVERRIDE_REVOKED',
      message: 'Đã thu hồi điều chỉnh điểm số.',
      data: { scoreOverride: result.scoreOverride },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCreateScoreOverride,
  handleGetScoreOverrides,
  handleRevokeScoreOverride,
};

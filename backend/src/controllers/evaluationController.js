const evaluationService = require('../services/evaluationService');

/**
 * Controller cho vòng chấm điểm Rubric (trạng thái EVALUATED).
 */

/** POST /api/v1/projects/:projectId/judges - Gán giám khảo vào tiểu ban (Admin) */
const handleAssignJudge = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { judgeId } = req.body;

    const result = await evaluationService.assignJudge({
      projectId,
      judgeId,
      actor: req.user,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'PROJECT_JUDGE_ASSIGNED',
      message: 'Đã gán giám khảo vào tiểu ban chấm điểm của dự án.',
      data: {
        project: { id: result.project.id, code: result.project.code },
        judge: { id: result.judge.id, email: result.judge.email, fullName: result.judge.fullName },
        panelSize: result.project.judges.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/projects/:projectId/evaluation/scores - Giám khảo nộp phiếu chấm điểm */
const handleSubmitScore = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rubricId, criterionId, score, comment } = req.body;

    const result = await evaluationService.submitScore({
      projectId,
      rubricId,
      criterionId,
      judgeId: req.user.id,
      score,
      comment,
      actor: req.user,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'EVALUATION_SCORE_SUBMITTED',
      message: result.evaluated
        ? 'Đã ghi nhận phiếu chấm. 100% Ban Giám khảo đã hoàn tất -> dự án chuyển sang EVALUATED.'
        : 'Đã ghi nhận phiếu chấm điểm.',
      data: {
        submission: result.submission,
        progress: result.progress,
        evaluated: result.evaluated,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/projects/:projectId/evaluation - Tổng hợp vòng chấm điểm */
const handleGetEvaluationSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const result = await evaluationService.getEvaluationSummary({ projectId });

    return res.status(200).json({
      success: true,
      code: 'EVALUATION_SUMMARY_FETCHED',
      message: 'Lấy tổng hợp vòng chấm điểm thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleAssignJudge, handleSubmitScore, handleGetEvaluationSummary };

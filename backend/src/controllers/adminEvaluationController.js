const adminEvaluationService = require('../services/adminEvaluationService');
const evaluationMigrationService = require('../services/evaluationMigrationService');

const assignJudge = async (req, res, next) => {
  try {
    const data = await adminEvaluationService.assignJudgeToProject({
      adminId: req.user?.id,
      adminUser: req.user,
      evaluationRoundId: req.body.evaluationRoundId,
      projectId: req.body.projectId,
      evaluatorId: req.body.evaluatorId,
      rubricVersionId: req.body.rubricVersionId,
      req,
    });
    return res.status(data.created ? 201 : 200).json({
      success: true,
      code: data.created ? 'JUDGE_EVALUATION_ASSIGNED' : 'JUDGE_EVALUATION_ALREADY_EXISTS',
      message: data.created
        ? 'Phân công giám khảo và tạo phiếu DRAFT thành công.'
        : 'Phiếu chấm đã tồn tại; đã đồng bộ thông tin cần thiết.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const listRoundAssignments = async (req, res, next) => {
  try {
    const data = await adminEvaluationService.listRoundAssignments(req.params.evaluationRoundId);
    return res.status(200).json({
      success: true,
      code: 'ROUND_ASSIGNMENTS_FETCHED',
      message: 'Lấy danh sách phân công giám khảo theo đợt thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const migrateLegacyEvaluations = async (req, res, next) => {
  try {
    const dryRun = req.body?.dryRun !== false; // default true (production/staging safe)
    const limit = Number.isInteger(req.body?.limit) ? req.body.limit : 0;
    const report = await evaluationMigrationService.migrateLegacyEvaluationSubmissions({
      actor: req.user,
      req,
      dryRun,
      limit,
    });

    return res.status(200).json({
      success: true,
      code: dryRun ? 'EVALUATION_MIGRATION_DRY_RUN_COMPLETED' : 'EVALUATION_MIGRATION_COMPLETED',
      message: dryRun
        ? 'Dry-run migration hoàn tất. Không có dữ liệu nào được ghi vào database.'
        : 'Migration legacy evaluations hoàn tất.',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignJudge,
  listRoundAssignments,
  migrateLegacyEvaluations,
};
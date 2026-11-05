const evaluatorService = require('../services/evaluatorService');

function isAdminUser(user) {
  const role = String(user?.systemRole || user?.role || '').toLowerCase();
  return role === 'admin';
}

const getAssignments = async (req, res, next) => {
  try {
    const data = await evaluatorService.getAssignments(req.user.id);
    return res.status(200).json({
      success: true,
      code: 'ASSIGNMENTS_FETCHED',
      message: 'Lấy danh sách phiếu chấm điểm thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspace = async (req, res, next) => {
  try {
    const data = await evaluatorService.getWorkspace(req.params.evaluationId, req.user.id, isAdminUser(req.user));
    return res.status(200).json({
      success: true,
      code: 'WORKSPACE_FETCHED',
      message: 'Lấy không gian chấm điểm thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const submit = async (req, res, next) => {
  try {
    const data = await evaluatorService.submitEvaluation(
      req.params.evaluationId,
      req.body,
      req.user.id,
      isAdminUser(req.user),
      req,
    );
    return res.status(200).json({
      success: true,
      code: 'EVALUATION_SUBMITTED',
      message: data?.status === 'SUBMITTED' ? 'Nộp phiếu chấm điểm thành công.' : 'Lưu nháp phiếu chấm điểm thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await evaluatorService.getEvaluationSummary(req.params.evaluationId, req.user.id, isAdminUser(req.user));
    return res.status(200).json({
      success: true,
      code: 'EVALUATION_SUMMARY_FETCHED',
      message: 'Lấy tổng hợp chấm điểm thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAssignments, getWorkspace, submit, getSummary };
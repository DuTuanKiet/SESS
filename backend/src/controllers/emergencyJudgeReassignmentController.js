const emergencyJudgeReassignmentService = require('../services/emergencyJudgeReassignmentService');
const { assertRequired } = require('../utils/validation');

/** POST /api/v1/emergency-judge-reassignments - Tạo điều chuyển khẩn cấp BGK (Admin) */
const handleCreateEmergencyReassignment = async (req, res, next) => {
  try {
    const { projectId, originalJudgeId, replacementJudgeId, reason, faculty } = req.body;

    assertRequired(projectId, 'projectId');
    assertRequired(originalJudgeId, 'originalJudgeId');
    assertRequired(replacementJudgeId, 'replacementJudgeId');
    assertRequired(reason, 'reason');

    const result = await emergencyJudgeReassignmentService.createEmergencyReassignment({
      projectId,
      originalJudgeId,
      replacementJudgeId,
      reason,
      faculty,
      reassignedBy: req.user.id,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'EMERGENCY_REASSIGNMENT_CREATED',
      message: 'Điều chuyển khẩn cấp Ban Giám khảo đã được tạo.',
      data: {
        reassignment: result.reassignment,
        project: { id: result.project.id, code: result.project.code },
        originalJudge: {
          id: result.originalJudge.id,
          email: result.originalJudge.email,
          fullName: result.originalJudge.fullName,
        },
        replacementJudge: {
          id: result.replacementJudge.id,
          email: result.replacementJudge.email,
          fullName: result.replacementJudge.fullName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/emergency-judge-reassignments - Lấy danh sách điều chuyển khẩn cấp */
const handleGetEmergencyReassignments = async (req, res, next) => {
  try {
    const { projectId, status, page, limit } = req.query;
    const result = await emergencyJudgeReassignmentService.getEmergencyReassignments({
      projectId,
      status,
      page,
      limit,
    });
    return res.status(200).json({
      success: true,
      code: 'EMERGENCY_REASSIGNMENTS_FETCHED',
      message: 'Lấy danh sách điều chuyển khẩn cấp thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/emergency-judge-reassignments/:reassignmentId/complete - Hoàn thành điều chuyển (Admin) */
const handleCompleteEmergencyReassignment = async (req, res, next) => {
  try {
    const { reassignmentId } = req.params;

    assertRequired(reassignmentId, 'reassignmentId');

    const result = await emergencyJudgeReassignmentService.completeEmergencyReassignment({
      reassignmentId,
      completedBy: req.user.id,
      req,
    });

    return res.status(200).json({
      success: true,
      code: 'EMERGENCY_REASSIGNMENT_COMPLETED',
      message: 'Đã hoàn thành điều chuyển khẩn cấp Ban Giám khảo.',
      data: { reassignment: result.reassignment },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/emergency-judge-reassignments/:reassignmentId/revoke - Thu hồi điều chuyển (Admin) */
const handleRevokeEmergencyReassignment = async (req, res, next) => {
  try {
    const { reassignmentId } = req.params;
    const { revokeReason } = req.body;

    assertRequired(reassignmentId, 'reassignmentId');
    assertRequired(revokeReason, 'revokeReason');

    const result = await emergencyJudgeReassignmentService.revokeEmergencyReassignment({
      reassignmentId,
      revokedBy: req.user.id,
      revokeReason,
      req,
    });

    return res.status(200).json({
      success: true,
      code: 'EMERGENCY_REASSIGNMENT_REVOKED',
      message: 'Đã thu hồi điều chuyển khẩn cấp Ban Giám khảo.',
      data: { reassignment: result.reassignment },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleCreateEmergencyReassignment,
  handleGetEmergencyReassignments,
  handleCompleteEmergencyReassignment,
  handleRevokeEmergencyReassignment,
};

const projectCancellationService = require('../services/projectCancellationService');

/**
 * Controller cho quy trình hủy dự án có bằng chứng (Enterprise Edition).
 */

/** POST /api/v1/projects/:projectId/cancellation-requests - Gửi yêu cầu hủy dự án */
const handleRequestCancellation = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { reason, evidenceFiles } = req.body;

    const result = await projectCancellationService.requestCancellation({
      projectId,
      requestedBy: req.user.id,
      reason,
      evidenceFiles,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'CANCELLATION_REQUEST_CREATED',
      message: 'Đã gửi yêu cầu hủy dự án kèm bằng chứng. Đang chờ Hội đồng xét duyệt.',
      data: {
        request: result.request,
        project: { id: result.project.id, code: result.project.code, status: result.project.status },
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/projects/cancellation-requests - Danh sách yêu cầu hủy (Admin) */
const handleListCancellationRequests = async (req, res, next) => {
  try {
    const { status, projectId, page, limit } = req.query;

    const result = await projectCancellationService.listCancellationRequests({
      status,
      projectId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      code: 'CANCELLATION_REQUESTS_FETCHED',
      message: 'Lấy danh sách yêu cầu hủy dự án thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/v1/projects/cancellation-requests/:requestId/review - Duyệt/Từ chối (Admin) */
const handleReviewCancellationRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { decision, reviewNote } = req.body;

    const result = await projectCancellationService.reviewCancellationRequest({
      requestId,
      decision,
      reviewNote,
      reviewedBy: req.user.id,
      req,
    });

    return res.status(200).json({
      success: true,
      code:
        decision === 'APPROVED'
          ? 'CANCELLATION_REQUEST_APPROVED'
          : 'CANCELLATION_REQUEST_REJECTED',
      message:
        decision === 'APPROVED'
          ? 'Đã duyệt yêu cầu hủy dự án. Dự án chuyển sang REJECTED và các phân công đã bị vô hiệu hóa.'
          : 'Đã từ chối yêu cầu hủy dự án.',
      data: {
        request: result.request,
        project: { id: result.project.id, code: result.project.code, status: result.project.status },
        projectStatusChange: result.projectStatusChange,
        deactivated: result.deactivated,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleRequestCancellation,
  handleListCancellationRequests,
  handleReviewCancellationRequest,
};

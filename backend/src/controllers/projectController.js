const projectService = require('../services/projectService');

// Lấy danh sách dự án đủ điều kiện cần mentor nhưng chưa được phân công.
// Chỉ Admin mới có quyền truy cập.
// @route GET /api/v1/projects/unassigned-mentor
async function handleGetUnassignedProjects(req, res, next) {
  try {
    const { page, limit, field, keyword } = req.query;
    const data = await projectService.getUnassignedProjects({ page, limit, field, keyword });

    return res.status(200).json({
      success: true,
      code: 'UNASSIGNED_PROJECTS_FETCHED',
      message: 'Lấy danh sách dự án chưa có mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

// Cập nhật trạng thái dự án.
// Chỉ Admin mới có quyền cập nhật trạng thái dự án.
// Khi trạng thái chuyển thành 'Completed', mentor assignment đang active (nếu có)
// sẽ tự động chuyển thành 'Completed', giải phóng quota cho mentor.
// @route PATCH /api/v1/projects/:projectId/status
async function handleUpdateProjectStatus(req, res, next) {
  try {
    const { projectId } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const data = await projectService.updateProjectStatus(projectId, status, {
      adminId,
      note,
    });

    return res.status(200).json({
      success: true,
      code: 'PROJECT_STATUS_UPDATED',
      message: 'Cập nhật trạng thái dự án thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleGetUnassignedProjects,
  handleUpdateProjectStatus,
};


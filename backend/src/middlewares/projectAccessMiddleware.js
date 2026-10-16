const projectService = require('../services/projectService');

/**
 * Middleware kiểm tra quyền truy cập dự án (Admin, Mentor phụ trách, hoặc Thành viên nhóm).
 * Ngăn chặn lỗ hổng IDOR trước khi request tới Controller (FR05/FR07).
 */
function authorizeProjectAccess() {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_PROJECT_ID',
          message: 'Thiếu projectId trong yêu cầu.',
        });
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Yêu cầu đăng nhập để truy cập.',
        });
      }

      await projectService.verifyProjectAccess(
        user.id || user._id,
        projectId,
        user.systemRole || user.role
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorizeProjectAccess;

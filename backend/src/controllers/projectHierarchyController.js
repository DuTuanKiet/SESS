const projectHierarchyService = require('../services/projectHierarchyService');

/**
 * Controller cho cấu trúc thi đấu đa cấp (Parent-Child Projects).
 */

/** POST /api/v1/projects/:projectId/promote - Đề xuất thi vượt cấp */
const handlePromoteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { targetLevel } = req.body;

    const result = await projectHierarchyService.promoteProject({
      projectId,
      targetLevel,
      actor: req.user,
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'PROJECT_PROMOTED',
      message:
        'Đã tạo dự án con ở cấp thi mới. Dự án gốc giữ nguyên trạng thái và tiến độ hiện tại.',
      data: {
        parent: {
          id: result.parent.id,
          code: result.parent.code,
          level: result.parent.level,
          status: result.parent.status,
          version: result.parent.version,
          isLinked: result.parent.isLinked,
        },
        child: {
          id: result.child.id,
          code: result.child.code,
          level: result.child.level,
          status: result.child.status,
          version: result.child.version,
          parentId: result.child.parentId,
        },
        membershipsCopied: result.membershipsCopied,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/projects/:projectId/hierarchy - Cây thi vượt cấp */
const handleGetProjectHierarchy = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const result = await projectHierarchyService.getProjectHierarchy({ projectId });

    return res.status(200).json({
      success: true,
      code: 'PROJECT_HIERARCHY_FETCHED',
      message: 'Lấy cây thi vượt cấp của dự án thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handlePromoteProject, handleGetProjectHierarchy };

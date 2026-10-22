const projectService = require('../services/projectService');
const { PROJECT_STATUS } = require('../utils/constants');
const ApiError = require('../utils/apiError');

const MAX_PAGE_LIMIT = 100;

/** Validate pagination params: page >= 1, limit 1..100 integer.
 *  Applies defaults only when value is undefined (omitted).
 *  Empty string or explicitly provided invalid values are rejected.
 */
const validatePagination = (page, limit, maxLimit = MAX_PAGE_LIMIT) => {
  // Apply defaults only for undefined (omitted), not for empty string or other values
  const pageValue = page === undefined ? 1 : page;
  const limitValue = limit === undefined ? 10 : limit;

  const pageNum = Number(pageValue);
  const limitNum = Number(limitValue);

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw ApiError.badRequest('"page" phải là số nguyên lớn hơn hoặc bằng 1', 'INVALID_PAGE');
  }
  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > maxLimit) {
    throw ApiError.badRequest(`"limit" phải là số nguyên từ 1 đến ${maxLimit}`, 'INVALID_LIMIT');
  }
  return { page: pageNum, limit: limitNum };
};

/** Validate project status against enum */
const validateProjectStatus = (status) => {
  if (status === undefined || status === null || status === '') return undefined;
  const allowed = Object.values(PROJECT_STATUS);
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`"status" không hợp lệ. Chỉ chấp nhận: ${allowed.join(', ')}`, 'INVALID_STATUS');
  }
  return status;
};

/** GET /projects - danh sách dự án của người dùng (có phân trang, lọc theo status) */
const getProjects = async (req, res) => {
  const { page, limit } = validatePagination(req.query.page, req.query.limit);
  const status = validateProjectStatus(req.query.status);

  const { projects, pagination } = await projectService.getProjects({
    userId: req.user.id,
    page,
    limit,
    status,
  });

  res.status(200).json({
    success: true,
    message: 'Lấy danh sách dự án thành công.',
    data: { projects, pagination },
  });
};

/** GET /projects/:id - chi tiết dự án */
const getProject = async (req, res) => {
  const { project, membership } = await projectService.getProject({
    projectId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: 'Lấy chi tiết dự án thành công.',
    data: { project, membership },
  });
};

// ===========================================================================
// Nhánh FR05-FR08: duyệt dự án & phân công mentor (Admin)
// ===========================================================================

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

// ===========================================================================
// Nhánh FR01-FR04: vòng đời dự án (FR03)
// ===========================================================================

/** POST /projects - tạo dự án mới (người tạo tự động là OWNER, trạng thái DRAFT) */
const createProject = async (req, res) => {
  const { project } = await projectService.createProject({ owner: req.user, payload: req.body, req });

  res.status(201).json({
    success: true,
    message: `Tạo dự án thành công với mã ${project.code} (trạng thái DRAFT).`,
    data: { project },
  });
};

/** PUT /projects/:id - chỉ sửa được khi DRAFT/NEED_REVISION */
const updateProject = async (req, res) => {
  const { project } = await projectService.updateProject({
    projectId: req.params.id,
    userId: req.user.id,
    payload: req.body,
  });

  res.status(200).json({ success: true, message: 'Cập nhật dự án thành công.', data: { project } });
};

/** POST /projects/:id/submit - nộp dự án, tạo snapshot revision và tăng version */
const submitProject = async (req, res) => {
  const { project, revision, digitalReceipt } = await projectService.submitProject({
    projectId: req.params.id,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: `Nộp dự án thành công (phiên bản v${revision.versionNumber}). Dự án đang chờ phản hồi từ Giảng viên/Mentor.`,
    data: { project, revision, digitalReceipt },
  });
};

/** GET /projects/:id/revisions - lịch sử phiên bản đã nộp */
const getProjectRevisions = async (req, res) => {
  const { project, revisions } = await projectService.getProjectRevisions({
    projectId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Dự án ${project.code} có ${revisions.length} phiên bản đã nộp.`,
    data: { project, revisions },
  });
};

module.exports = {
  // FR05-FR08
  handleGetUnassignedProjects,
  handleUpdateProjectStatus,
  // FR01-FR04
  getProjects,
  getProject,
  createProject,
  updateProject,
  submitProject,
  getProjectRevisions,
};

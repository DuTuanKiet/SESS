const projectService = require('../services/projectService');

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
  const { project, revision } = await projectService.submitProject({
    projectId: req.params.id,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: `Nộp dự án thành công (phiên bản v${revision.versionNumber}). Dự án đang chờ phản hồi từ Giảng viên/Mentor.`,
    data: { project, revision },
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

module.exports = { createProject, updateProject, submitProject, getProjectRevisions };

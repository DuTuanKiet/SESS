const milestoneService = require('../services/milestoneService');

//Tạo milestone cho dự án. Chỉ Mentor được phép.
// @route POST /api/v1/projects/:projectId/milestones
async function handleCreateMilestone(req, res, next) {
  try {
    const { projectId } = req.params;
    const mentorId = req.user.id;
    const { title, description, startDate, dueDate } = req.body;

    const data = await milestoneService.createMilestone({
      projectId,
      mentorId,
      title,
      description,
      startDate,
      dueDate,
    });

    return res.status(201).json({
      success: true,
      code: 'MILESTONE_CREATED',
      message: 'Tạo milestone thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Cập nhật milestone. Chỉ Mentor được phép khi milestone ở Pending. Ghi audit log.
// @route PUT /api/v1/projects/:projectId/milestones/:milestoneId
async function handleUpdateMilestone(req, res, next) {
  try {
    const { projectId, milestoneId } = req.params;
    const mentorId = req.user.id;
    const updates = req.body;

    const data = await milestoneService.updateMilestone({
      milestoneId,
      projectId,
      mentorId,
      updates,
    });

    return res.status(200).json({
      success: true,
      code: 'MILESTONE_UPDATED',
      message: 'Cập nhật milestone thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy danh sách milestones của dự án. Trạng thái tính toán động theo thời gian thực.
// @route GET /api/v1/projects/:projectId/milestones
async function handleGetMilestones(req, res, next) {
  try {
    const { projectId } = req.params;
    const data = await milestoneService.getMilestonesByProject(projectId);

    return res.status(200).json({
      success: true,
      code: 'MILESTONES_FETCHED',
      message: 'Lấy danh sách milestones thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy chi tiết milestone. Trạng thái tính toán động theo thời gian thực.
// @route GET /api/v1/projects/:projectId/milestones/:milestoneId
async function handleGetMilestoneById(req, res, next) {
  try {
    const { projectId, milestoneId } = req.params;
    const data = await milestoneService.getMilestoneById({ milestoneId, projectId });

    return res.status(200).json({
      success: true,
      code: 'MILESTONE_FETCHED',
      message: 'Lấy chi tiết milestone thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Project Owner nộp minh chứng cho milestone.
// @route POST /api/v1/projects/:projectId/milestones/:milestoneId/evidence
async function handleSubmitEvidence(req, res, next) {
  try {
    const { projectId, milestoneId } = req.params;
    const studentId = req.user.id;
    const { url, note } = req.body;

    const data = await milestoneService.submitEvidence({
      milestoneId,
      projectId,
      studentId,
      url,
      note,
    });

    return res.status(200).json({
      success: true,
      code: 'EVIDENCE_SUBMITTED',
      message: 'Nộp minh chứng thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Mentor góp ý cho milestone (Completed/Overdue, trong 5 ngày kể từ ngày kết thúc milestone (dueDate), dự án đang UnderMentorship). Mentor có thể góp ý nhiều lần.
// @route POST /api/v1/projects/:projectId/milestones/:milestoneId/comments
async function handleAddComment(req, res, next) {
  try {
    const { projectId, milestoneId } = req.params;
    const mentorId = req.user.id;
    const { content } = req.body;

    const data = await milestoneService.addMilestoneComment({
      milestoneId,
      projectId,
      mentorId,
      content,
    });

    return res.status(201).json({
      success: true,
      code: 'COMMENT_ADDED',
      message: 'Góp ý milestone thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy danh sách góp ý của milestone. Yêu cầu đăng nhập.
// @route GET /api/v1/projects/:projectId/milestones/:milestoneId/comments
async function handleGetComments(req, res, next) {
  try {
    const { projectId, milestoneId } = req.params;

    const data = await milestoneService.getMilestoneComments({ milestoneId, projectId });

    return res.status(200).json({
      success: true,
      code: 'COMMENTS_FETCHED',
      message: 'Lấy danh sách góp ý thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleCreateMilestone,
  handleUpdateMilestone,
  handleGetMilestones,
  handleGetMilestoneById,
  handleSubmitEvidence,
  handleAddComment,
  handleGetComments,
};

const mentorService = require('../services/mentorService');

//Lấy danh sách mentor với số dự án đang cố vấn và trạng thái tải.
// @route GET /api/v1/mentors
async function handleGetMentors(req, res, next) {
  try {
    const { page, limit, field, keyword, availability } = req.query;
    const data = await mentorService.getMentors({ page, limit, field, keyword, availability });

    return res.status(200).json({
      success: true,
      code: 'MENTORS_FETCHED',
      message: 'Lấy danh sách mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy chi tiết hồ sơ một mentor
// @route GET /api/v1/mentors/:mentorId
async function handleGetMentorById(req, res, next) {
  try {
    const { mentorId } = req.params;
    const data = await mentorService.getMentorById(mentorId);

    return res.status(200).json({
      success: true,
      code: 'MENTOR_FETCHED',
      message: 'Lấy thông tin mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}
//Phân công mentor cho dự án (Assign)
 // @route POST /api/v1/mentor-assignments
async function handleAssignMentor(req, res, next) {
  try {
    const { projectId, mentorId, note } = req.body;
    // Danh tính Admin lấy từ JWT, không tin req.body
    const adminId = req.user.id;

    const data = await mentorService.assignMentorToProject({ projectId, mentorId, adminId, note });

    return res.status(201).json({
      success: true,
      code: 'MENTOR_ASSIGNED_SUCCESSFULLY',
      message: 'Phân công mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Phân công lại mentor cho dự án (Reassign)
// @route POST /api/v1/mentor-assignments/reassign
async function handleReassignMentor(req, res, next) {
  try {
    const { projectId, newMentorId, reason } = req.body;
    // Danh tính Admin lấy từ JWT, không tin req.body
    const adminId = req.user.id;

    const data = await mentorService.reassignMentorToProject({ projectId, newMentorId, adminId, reason });

    return res.status(200).json({
      success: true,
      code: 'MENTOR_REASSIGNED_SUCCESSFULLY',
      message: 'Phân công lại mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy lịch sử phân công mentor của một dự án
// @route GET /api/v1/mentor-assignments/project/:projectId
async function handleGetProjectAssignmentHistory(req, res, next) {
  try {
    const { projectId } = req.params;
    const data = await mentorService.getAssignmentHistoryByProject(projectId);

    return res.status(200).json({
      success: true,
      code: 'ASSIGNMENT_HISTORY_FETCHED',
      message: 'Lấy lịch sử phân công thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy lịch sử Audit Log phân công mentor
// @route GET /api/v1/mentor-assignments/audit-history
async function handleGetAuditHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await mentorService.getAuditHistory({ page, limit });

    return res.status(200).json({
      success: true,
      code: 'AUDIT_HISTORY_FETCHED',
      message: 'Lấy lịch sử audit thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleGetMentors,
  handleGetMentorById,
  handleAssignMentor,
  handleReassignMentor,
  handleGetProjectAssignmentHistory,
  handleGetAuditHistory,
};

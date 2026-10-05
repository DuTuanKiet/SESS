const ProjectMilestone = require('../models/ProjectMilestone');
const MilestoneComment = require('../models/MilestoneComment');
const projectService = require('./projectService');
const auditService = require('./auditService');
const { createError } = require('../middlewares/errorHandler');
const {
  MILESTONE_STATUS,
  PROJECT_STATUS,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  LATE_SUBMISSION_DAYS,
  COMMENT_DEADLINE_DAYS,
} = require('../utils/constants');

//Tính toán trạng thái chính xác của milestone theo thời gian thực (Computed Status).
function resolveMilestoneStatus(milestone, now = new Date()) {
  if (milestone.evidence && milestone.evidence.submittedAt) {
    return milestone.status;
  }

  const start = new Date(milestone.startDate);
  const due = new Date(milestone.dueDate);

  if (now < start) {
    return MILESTONE_STATUS.PENDING;
  }

  // Quá thời hạn nộp trễ (dueDate + 3 ngày) mà chưa nộp minh chứng -> NotComplete
  const lateDeadline = new Date(due.getTime() + LATE_SUBMISSION_DAYS * 24 * 60 * 60 * 1000);
  if (now > lateDeadline) {
    return MILESTONE_STATUS.NOT_COMPLETE;
  }

  if (now > due) {
    return MILESTONE_STATUS.OVERDUE;
  }
  return MILESTONE_STATUS.IN_PROGRESS;
}

//Tìm milestone theo milestoneId và projectId. Ném 404 nếu không tìm thấy.
async function findMilestoneOrFail(milestoneId, projectId) {
  const milestone = await ProjectMilestone.findOne({ _id: milestoneId, projectId });
  if (!milestone) {
    throw createError('Không tìm thấy milestone.', 404, 'MILESTONE_NOT_FOUND');
  }
  return milestone;
}

// Tạo milestone mới cho dự án + ghi auditlog
async function createMilestone({ projectId, mentorId, title, description, startDate, dueDate }) {
  const project = await projectService.getProjectById(projectId);

  if (project.status !== PROJECT_STATUS.UNDER_MENTORSHIP) {
    throw createError(
      'Dự án chưa được phép tạo milestone.',
      400,
      'PROJECT_NOT_UNDER_MENTORSHIP'
    );
  }

  await projectService.verifyMentorOfProject(mentorId, projectId);

  const milestone = await ProjectMilestone.create({
    projectId,
    createdBy: mentorId,
    title,
    description,
    startDate: new Date(startDate),
    dueDate: new Date(dueDate),
    status: MILESTONE_STATUS.PENDING,
  });

  await auditService.createAuditLog({
    userId: mentorId,
    action: AUDIT_ACTIONS.CREATE_MILESTONE,
    targetEntity: AUDIT_ENTITIES.PROJECT_MILESTONES,
    targetId: milestone._id.toString(),
    newValues: {
      projectId,
      title,
      description,
      startDate: milestone.startDate,
      dueDate: milestone.dueDate,
      status: milestone.status,
    },
  });

  const result = milestone.toObject();
  result.status = resolveMilestoneStatus(result);
  return result;
}

//Cập nhật milestone. Chỉ cho phép cập nhật khi milestone đang ở Pending.
//Ghi vết audit log UPDATE_MILESTONE.
async function updateMilestone({ milestoneId, projectId, mentorId, updates }) {
  const milestone = await findMilestoneOrFail(milestoneId, projectId);

  const currentStatus = resolveMilestoneStatus(milestone);
  if (currentStatus !== MILESTONE_STATUS.PENDING) {
    throw createError(
      'Milestone đã bắt đầu hoặc kết thúc.', 400, 'MILESTONE_NOT_EDITABLE'
    );
  }

  await projectService.verifyMentorOfProject(mentorId, projectId);

  const newStartDate = updates.startDate ? new Date(updates.startDate) : milestone.startDate;
  const newDueDate = updates.dueDate ? new Date(updates.dueDate) : milestone.dueDate;

  if (newDueDate <= newStartDate) {
    throw createError(
      'Ngày kết thúc và ngày bắt đầu không hợp lệ.',
      400,
      'INVALID_DATE_RANGE'
    );
  }

  const oldValues = {
    title: milestone.title,
    description: milestone.description,
    startDate: milestone.startDate,
    dueDate: milestone.dueDate,
  };

  if (updates.title !== undefined) milestone.title = updates.title;
  if (updates.description !== undefined) milestone.description = updates.description;
  if (updates.startDate !== undefined) milestone.startDate = newStartDate;
  if (updates.dueDate !== undefined) milestone.dueDate = newDueDate;

  await milestone.save();

  const newValues = {
    title: milestone.title,
    description: milestone.description,
    startDate: milestone.startDate,
    dueDate: milestone.dueDate,
  };

  await auditService.createAuditLog({
    userId: mentorId,
    action: AUDIT_ACTIONS.UPDATE_MILESTONE,
    targetEntity: AUDIT_ENTITIES.PROJECT_MILESTONES,
    targetId: milestone._id.toString(),
    oldValues,
    newValues,
  });

  const result = milestone.toObject();
  result.status = resolveMilestoneStatus(result);
  return result;
}

//Lấy danh sách milestones của dự án.
async function getMilestonesByProject(projectId) {
  await projectService.getProjectById(projectId);

  const milestones = await ProjectMilestone.find({ projectId })
    .populate('createdBy', 'profile.fullName email')
    .populate('evidence.submittedBy', 'profile.fullName email')
    .sort({ startDate: 1 })
    .lean();

  return milestones.map((m) => ({
    ...m,
    status: resolveMilestoneStatus(m),
  }));
}
//Lấy thông tin chi tiết một milestone theo ID
async function getMilestoneById({ milestoneId, projectId }) {
  const milestone = await ProjectMilestone.findOne({ _id: milestoneId, projectId })
    .populate('createdBy', 'profile.fullName email')
    .populate('evidence.submittedBy', 'profile.fullName email')
    .lean();

  if (!milestone) {
    throw createError('Không tìm thấy milestone.', 404, 'MILESTONE_NOT_FOUND');
  }

  return {
    ...milestone,
    status: resolveMilestoneStatus(milestone),
  };
}
//Nộp minh chứng cho milestone 
async function submitEvidence({ milestoneId, projectId, studentId, url, note = '' }) {
  const milestone = await findMilestoneOrFail(milestoneId, projectId);

  await projectService.verifyProjectOwner(studentId, projectId);

  const currentStatus = resolveMilestoneStatus(milestone);
  if (currentStatus === MILESTONE_STATUS.PENDING) {
    throw createError(
      'Milestone chưa bắt đầu, không thể nộp minh chứng.',
      400,
      'MILESTONE_NOT_STARTED'
    );
  }

  if (currentStatus === MILESTONE_STATUS.NOT_COMPLETE) {
    throw createError(
      'Đã quá thời gian cho phép nộp trễ (3 ngày kể từ ngày kết thúc), milestone đã chuyển sang trạng thái NotComplete và không thể nộp minh chứng.',
      400,
      'LATE_SUBMISSION_DEADLINE_EXCEEDED'
    );
  }

  if (milestone.evidence && milestone.evidence.submittedAt) {
    throw createError(
      'Minh chứng cho milestone này đã được nộp.',
      409,
      'EVIDENCE_ALREADY_SUBMITTED'
    );
  }

  const submittedAt = new Date();
  const finalStatus =
    submittedAt <= new Date(milestone.dueDate)
      ? MILESTONE_STATUS.COMPLETED
      : MILESTONE_STATUS.OVERDUE;

  milestone.status = finalStatus;
  milestone.evidence = {
    submittedBy: studentId,
    url,
    note: note || '',
    submittedAt,
  };

  await milestone.save();

  await milestone.populate([
    { path: 'createdBy', select: 'profile.fullName email' },
    { path: 'evidence.submittedBy', select: 'profile.fullName email' },
  ]);

  return milestone.toObject();
}
//Mentor góp ý cho milestone
async function addMilestoneComment({ milestoneId, projectId, mentorId, content }) {
  const milestone = await findMilestoneOrFail(milestoneId, projectId);

  const currentStatus = resolveMilestoneStatus(milestone);
  if (currentStatus !== MILESTONE_STATUS.COMPLETED && currentStatus !== MILESTONE_STATUS.OVERDUE) {
    throw createError(
      'Milestone chưa đủ điều kiện để góp ý.',
      400,
      'MILESTONE_NOT_COMMENTABLE'
    );
  }

  // Giảng viên có tối đa 5 ngày kể từ ngày milestone kết thúc (dueDate) để góp ý
  const commentDeadline = new Date(
    new Date(milestone.dueDate).getTime() + COMMENT_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  );
  if (new Date() > commentDeadline) {
    throw createError(
      `Bạn đã quá hạn góp ý milestone này.`,
      400,
      'COMMENT_DEADLINE_EXCEEDED'
    );
  }

  const project = await projectService.getProjectById(projectId);
  if (project.status !== PROJECT_STATUS.UNDER_MENTORSHIP) {
    throw createError(
      'Dự án không còn trong giai đoạn cố vấn, không thể góp ý.',
      400,
      'PROJECT_NOT_UNDER_MENTORSHIP'
    );
  }

  await projectService.verifyMentorOfProject(mentorId, projectId);

  const comment = await MilestoneComment.create({
    milestoneId,
    authorId: mentorId,
    content,
  });

  await comment.populate('authorId', 'profile.fullName email');

  return comment.toObject();
}

//Lấy danh sách góp ý của một milestone, mới nhất trước
async function getMilestoneComments({ milestoneId, projectId }) {
  await findMilestoneOrFail(milestoneId, projectId);

  return MilestoneComment.find({ milestoneId })
    .populate('authorId', 'profile.fullName email')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  resolveMilestoneStatus,
  createMilestone,
  updateMilestone,
  getMilestonesByProject,
  getMilestoneById,
  submitEvidence,
  addMilestoneComment,
  getMilestoneComments,
};

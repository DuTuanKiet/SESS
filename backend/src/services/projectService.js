const mongoose = require('mongoose');
const Project = require('../models/Project');
const MentorAssignment = require('../models/MentorAssignment');
const auditService = require('./auditService');
const { createError } = require('../middlewares/errorHandler');
const {
  ASSIGNMENT_STATUS,
  PROJECT_STATUS,
  MENTORSHIP_ELIGIBLE_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
} = require('../utils/constants');

/**
 * Lấy danh sách các dự án đủ điều kiện cần mentor nhưng hiện chưa được phân công.
 * Điều kiện: status thuộc [Submitted, InReview, NeedRevision] VÀ không có assignment 'Assigned'.
 */
async function getUnassignedProjects({ page = 1, limit = 10, field, keyword } = {}) {
  // Lấy tất cả projectId đang có mentor kích hoạt
  const activeAssignments = await MentorAssignment.find(
    { status: ASSIGNMENT_STATUS.ASSIGNED },
    { projectId: 1, _id: 0 }
  ).lean();
  const assignedProjectIds = activeAssignments.map((a) => a.projectId);

  const query = {
    status: { $in: MENTORSHIP_ELIGIBLE_STATUSES },
    _id: { $nin: assignedProjectIds },
  };

  if (field) {
    query.field = { $regex: field, $options: 'i' };
  }
  if (keyword) {
    query.name = { $regex: keyword, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .select('name field status createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
  };
}

// Lấy thông tin dự án theo ID và kiểm tra sự tồn tại (Fail-fast).
async function getProjectById(projectId, projection = null) {
  const project = await Project.findById(projectId, projection).lean();
  if (!project) {
    throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  }
  return project;
}
//Cập nhật trạng thái của dự án
async function updateProjectStatus(projectId, status, { session: externalSession, adminId, note } = {}) {
  if (!Object.values(PROJECT_STATUS).includes(status)) {
    throw createError('Trạng thái dự án không hợp lệ.', 400, 'INVALID_PROJECT_STATUS');
  }

  const executeStatusUpdate = async (session) => {
    const project = await Project.findById(projectId).session(session);
    if (!project) {
      throw createError('Không tìm thấy dự án để cập nhật trạng thái.', 404, 'PROJECT_NOT_FOUND');
    }

    if (project.status === status) {
      throw createError('Dự án đã ở trạng thái này.', 400, 'PROJECT_STATUS_UNCHANGED');
    }

    const oldStatus = project.status;
    project.status = status;
    await project.save({ session });

    let completedAssignment = null;

    // Ràng buộc nghiêm ngặt: CHỈ KHI status chính xác là 'Completed' mới hoàn thành assignment
    if (status === PROJECT_STATUS.COMPLETED) {
      const activeAssignment = await MentorAssignment.findOne({
        projectId,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      }).session(session);

      if (activeAssignment) {
        const now = new Date();
        activeAssignment.status = ASSIGNMENT_STATUS.COMPLETED;
        activeAssignment.endedAt = now;
        await activeAssignment.save({ session });

        completedAssignment = {
          assignmentId: activeAssignment._id,
          mentorId: activeAssignment.mentorId,
          status: activeAssignment.status,
          endedAt: activeAssignment.endedAt,
        };
      }
    }

    // Ghi nhận AuditLog nếu thao tác do Admin thực hiện (FR14)
    if (adminId) {
      await auditService.createAuditLog({
        userId: adminId,
        action: AUDIT_ACTIONS.CHANGE_PROJECT_STATUS,
        targetEntity: AUDIT_ENTITIES.PROJECTS,
        targetId: project._id,
        oldValues: { status: oldStatus },
        newValues: {
          status,
          note: note || '',
          completedAssignment: completedAssignment
            ? {
                assignmentId: completedAssignment.assignmentId,
                mentorId: completedAssignment.mentorId,
              }
            : null,
        },
        session,
      });
    }

    return {
      project: project.toObject(),
      completedAssignment,
    };
  };

  // Nếu caller đã truyền session (vd: assignMentorToProject), sử dụng session đó
  if (externalSession) {
    return executeStatusUpdate(externalSession);
  }

  // Nếu chưa có session, tự mở Mongoose Transaction để bảo đảm ACID khi cập nhật đa collection
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await executeStatusUpdate(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

//Kiểm tra user là Owner của dự án. Ném 403 nếu không phải Owner.
async function verifyProjectOwner(studentId, projectId) {
  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  }
  const isOwner = (project.members || []).some(
    (m) => m.userId.toString() === studentId && m.projectRole === 'Owner'
  );
  if (!isOwner) {
    throw createError(
      'Chỉ Owner của dự án mới có quyền thực hiện thao tác này.',
      403,
      'NOT_PROJECT_OWNER'
    );
  }
  return project;
}

//Kiểm tra mentor có đang phụ trách dự án với trạng thái 'Assigned'. Ném lỗi 403 nếu không phải mentor active của dự án.
async function verifyMentorOfProject(mentorId, projectId) {
  const activeAssignment = await MentorAssignment.findOne({
    projectId,
    mentorId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).lean();

  if (!activeAssignment) {
    throw createError(
      'Bạn không phải là mentor đang phụ trách dự án này.',
      403,
      'NOT_PROJECT_MENTOR'
    );
  }
  return activeAssignment;
}

module.exports = {
  getUnassignedProjects,
  getProjectById,
  updateProjectStatus,
  verifyProjectOwner,
  verifyMentorOfProject,
};


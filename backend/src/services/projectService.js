const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectRevision = require('../models/ProjectRevision');
const ProjectMember = require('../models/ProjectMember');
const MentorAssignment = require('../models/MentorAssignment');
const auditService = require('./auditService');
const projectMemberService = require('./projectMemberService');
const { createError } = require('../middlewares/errorHandler');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const {
  ASSIGNMENT_STATUS,
  PROJECT_STATUS,
  MILESTONE_STATUS,
  PROJECT_CODE_PREFIX,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  MENTORSHIP_ELIGIBLE_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_TARGETS,
} = require('../utils/constants');
const {
  isNonEmptyString,
  assertRequired,
  assertOptionalString,
  assertOptionalUrl,
  assertEnum,
} = require('../utils/validation');

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


/** Trường cốt lõi bắt buộc phải có trước khi nộp dự án (fail fast) */
const REQUIRED_SUBMIT_FIELDS = ['title', 'category', 'abstract', 'solution'];

/** Các trường được ghi vào snapshot khi nộp dự án */
const SNAPSHOT_FIELDS = [
  'title',
  'code',
  'category',
  'abstract',
  'problemStatement',
  'solution',
  'businessModel',
  'attachmentUrl',
  'milestones',
];

/** Số lần thử lại khi mã dự án bị trùng (race condition) */
const MAX_CODE_RETRY = 3;

/** Validate danh sách mốc tiến độ */
const assertMilestones = (value) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw ApiError.badRequest('"milestones" phải là mảng', 'INVALID_FIELD');
  if (value.length > 20) throw ApiError.badRequest('"milestones" chỉ được tối đa 20 phần tử', 'INVALID_FIELD');

  return value.map((milestone) => ({
    name: assertRequired(milestone?.name, 'milestones[].name'),
    description: assertOptionalString(milestone?.description, 'milestones[].description', 1000) ?? '',
    dueDate: milestone?.dueDate ? new Date(milestone.dueDate) : null,
    status: milestone?.status
      ? assertEnum(milestone.status, Object.values(MILESTONE_STATUS), 'milestones[].status')
      : MILESTONE_STATUS.PLANNED,
  }));
};

const FIELD_VALIDATORS = {
  title: (value) => assertRequired(value, 'title'),
  category: (value) => assertOptionalString(value, 'category', 120) ?? '',
  abstract: (value) => assertOptionalString(value, 'abstract', 2000) ?? '',
  problemStatement: (value) => assertOptionalString(value, 'problemStatement', 4000) ?? '',
  solution: (value) => assertOptionalString(value, 'solution', 4000) ?? '',
  businessModel: (value) => assertOptionalString(value, 'businessModel', 2000) ?? '',
  attachmentUrl: (value) => assertOptionalUrl(value, 'attachmentUrl'),
  milestones: assertMilestones,
};

/** Chỉ nhận các trường được phép sửa và validate từng trường */
const buildProjectData = (payload = {}) =>
  Object.entries(FIELD_VALIDATORS).reduce((data, [field, validate]) => {
    if (payload[field] !== undefined) data[field] = validate(payload[field]);
    return data;
  }, {});

/** Sinh mã dự án dạng SESS-<năm>-<số thứ tự 3 chữ số>, VD: SESS-2026-001 */
const generateProjectCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `${PROJECT_CODE_PREFIX}-${year}-`;

  const latestProject = await Project.findOne({ code: new RegExp(`^${prefix}`) })
    .sort({ code: -1 })
    .select('code')
    .lean();

  const nextNumber = latestProject ? Number.parseInt(latestProject.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

/** Tạo dự án kèm mã tự sinh; tự thử lại nếu mã bị trùng */
const createWithGeneratedCode = async (data) => {
  for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
    const code = await generateProjectCode();

    try {
      return await Project.create({ ...data, code });
    } catch (error) {
      // Trùng mã dự án -> sinh mã khác; lỗi khác đẩy cho Error Middleware xử lý
      if (error?.code !== 11000) throw error;
    }
  }

  throw ApiError.conflict('Không thể khởi tạo mã dự án, vui lòng thử lại sau', 'PROJECT_CODE_CONFLICT');
};

/**
 * Làm sạch dữ liệu dự án trước khi gửi cho AI (chuẩn bị cho FR09/FR10).
 * CHỈ giữ: title, domain, description, currentVersion, milestones.
 * Loại bỏ tận gốc PII: fullName, email, studentId, phoneNumber, userId...
 */
const sanitizeProjectDataForAI = (project) => {
  const source = typeof project?.toObject === 'function' ? project.toObject() : (project ?? {});

  return {
    title: source.title ?? '',
    domain: source.category ?? '',
    description: source.abstract ?? '',
    currentVersion: source.version ?? 1,
    milestones: (source.milestones ?? []).map((milestone) => ({
      name: milestone.name ?? '',
      description: milestone.description ?? '',
      dueDate: milestone.dueDate ?? null,
      status: milestone.status ?? MILESTONE_STATUS.PLANNED,
    })),
  };
};

/**
 * Tạo dự án mới (FR03).
 * Người tạo tự động trở thành OWNER (status ACCEPTED), dự án bắt đầu ở trạng thái DRAFT.
 */
const createProject = async ({ owner, payload = {}, req } = {}) => {
  if (!isNonEmptyString(payload.title)) {
    throw ApiError.badRequest('Thiếu thông tin bắt buộc: "title"', 'MISSING_FIELD');
  }

  // Ràng buộc: chỉ được tham gia 1 dự án đang hoạt động
  await projectMemberService.assertNoActiveProject(owner._id);

  const project = await createWithGeneratedCode({
    ...buildProjectData(payload),
    status: PROJECT_STATUS.DRAFT,
    ownerId: owner._id,
    version: 1,
  });

  await ProjectMember.create({
    projectId: project._id,
    userId: owner._id,
    email: owner.email,
    role: PROJECT_MEMBER_ROLES.OWNER,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
    joinedAt: new Date(),
  });

  await logAuditAction({
    actor: owner,
    action: AUDIT_ACTIONS.CREATE_PROJECT,
    targetEntity: AUDIT_TARGETS.PROJECT,
    targetId: project._id,
    newValues: { code: project.code, title: project.title, status: project.status, version: project.version },
    req,
  });

  return { project };
};

/**
 * Cập nhật dự án (FR03).
 * RÀNG BUỘC: chỉ OWNER/MEMBER (đã chấp nhận lời mời) được sửa VÀ dự án phải ở
 * trạng thái DRAFT hoặc NEED_REVISION. Các trạng thái khác -> 403 Forbidden.
 */
const updateProject = async ({ projectId, userId, payload = {} }) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, userId);

  // Đóng băng dự án: chỉ sửa được khi DRAFT/NEED_REVISION
  projectMemberService.assertProjectEditable(project);

  const data = buildProjectData(payload);
  if (!Object.keys(data).length) {
    throw ApiError.badRequest('Không có thông tin nào để cập nhật', 'NOTHING_TO_UPDATE');
  }

  project.set(data);
  await project.save();
  return { project };
};

/**
 * Nộp dự án (FR03).
 * Fail fast nếu thiếu trường cốt lõi; nộp thành công -> lưu snapshot ProjectRevision
 * cho phiên bản hiện tại, chuyển trạng thái SUBMITTED và tăng version lên 1.
 */
const submitProject = async ({ projectId, actor, req } = {}) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, actor.id);

  // Đóng băng dự án: đã nộp/đang xét duyệt thì không nộp lại
  projectMemberService.assertProjectEditable(project);

  const missingFields = REQUIRED_SUBMIT_FIELDS.filter((field) => !isNonEmptyString(project[field]));
  if (missingFields.length) {
    throw ApiError.badRequest(
      `Dự án chưa đủ thông tin để nộp. Vui lòng bổ sung: ${missingFields.join(', ')}`,
      'MISSING_REQUIRED_FIELDS',
      { missingFields },
    );
  }

  const snapshotData = SNAPSHOT_FIELDS.reduce((snapshot, field) => {
    snapshot[field] = project[field];
    return snapshot;
  }, {});

  const revision = await ProjectRevision.create({
    projectId: project._id,
    versionNumber: project.version,
    snapshotData,
    submittedAt: new Date(),
    submittedBy: actor.id,
  });

  const previousStatus = project.status;
  const previousVersion = project.version;

  project.status = PROJECT_STATUS.SUBMITTED;
  project.version += 1;
  project.lastSubmittedAt = revision.submittedAt;
  await project.save();

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CHANGE_PROJECT_STATUS,
    targetEntity: AUDIT_TARGETS.PROJECT,
    targetId: project._id,
    oldValues: { status: previousStatus, version: previousVersion },
    newValues: { status: project.status, version: project.version, revisionId: revision._id },
    req,
  });

  return { project, revision };
};

/** Lịch sử các phiên bản đã nộp của dự án (mới nhất trước) */
const getProjectRevisions = async ({ projectId, userId }) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, userId);
  const revisions = await ProjectRevision.find({ projectId: project._id }).sort({ versionNumber: -1 });
  return { project, revisions };
};

module.exports = {
  createProject,
  updateProject,
  submitProject,
  getProjectRevisions,
  // Guard dùng chung được định nghĩa ở projectMemberService (tránh circular dependency)
  assertProjectEditable: projectMemberService.assertProjectEditable,
  assertNoActiveProject: projectMemberService.assertNoActiveProject,
  sanitizeProjectDataForAI,

  // --- FR05-FR08: điều kiện phân công mentor, cập nhật trạng thái, kiểm tra quyền ---
  getUnassignedProjects,
  getProjectById,
  updateProjectStatus,
  verifyProjectOwner,
  verifyMentorOfProject,
};

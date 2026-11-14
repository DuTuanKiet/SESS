const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectRevision = require('../models/ProjectRevision');
const EvaluationRound = require('../models/EvaluationRound');
const ProjectMember = require('../models/ProjectMember');
const ProjectMilestone = require('../models/ProjectMilestone');
const ProjectCancellationRequest = require('../models/ProjectCancellationRequest');
const ProjectMemberChangeRequest = require('../models/ProjectMemberChangeRequest');
const HumanEvaluation = require('../models/HumanEvaluation');
const User = require('../models/User');
const StudentWhitelist = require('../models/StudentWhitelist');
const MentorAssignment = require('../models/MentorAssignment');
const auditService = require('./auditService');
const projectMemberService = require('./projectMemberService');
const digitalReceiptService = require('./digitalReceiptService');
const queueService = require('./queueService');
const notificationService = require('./notificationService');
const { createError } = require('../middlewares/errorHandler');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const {
  ASSIGNMENT_STATUS,
  SYSTEM_ROLES,
  PROJECT_STATUS,
  MILESTONE_STATUS,
  PROJECT_CODE_PREFIX,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  EDITABLE_PROJECT_STATUSES,
  PROJECT_LOCKED_MESSAGE,
  MENTORSHIP_ELIGIBLE_STATUSES,
  FINISHED_PROJECT_STATUSES,
  MAX_ACTIVE_PROJECTS,
  PROJECT_CANCELLATION_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
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
const projectStateMachine = require('../utils/projectStateMachine');

/**
 * MongoDB standalone (bản cài local/dev) KHÔNG hỗ trợ transaction:
 * lỗi code 20 (IllegalOperation) hoặc thông báo liên quan tới retryable writes/replica set.
 */
const isTransactionUnsupportedError = (error) => {
  const message = String(error?.message ?? '');
  return (
    error?.code === 20 ||
    /does not support retryable writes/i.test(message) ||
    /transaction numbers are only allowed/i.test(message) ||
    /transactions? (are|is) not supported/i.test(message)
  );
};

/**
 * Lấy danh sách các dự án đủ điều kiện cần mentor nhưng hiện chưa được phân công.
 * Điều kiện: status thuộc [Submitted, InReview, NeedRevision] VÀ không có assignment 'Assigned'.
 */
async function getUnassignedProjects({ page = 1, limit = 10, field, keyword } = {}) {
  // Validate pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw ApiError.badRequest('"page" phải là số nguyên lớn hơn hoặc bằng 1', 'INVALID_PAGE');
  }
  if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
    throw ApiError.badRequest('"limit" phải là số nguyên từ 1 đến 100', 'INVALID_LIMIT');
  }

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

  const skip = (pageNum - 1) * limitNum;
  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .select('name field status createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    projects,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
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
async function updateProjectStatus(
  projectId,
  status,
  {
    session: externalSession,
    adminId,
    note,
    force = false,
    forceReason = '',
    extraAllowedTargets = [],
    transitionContext = '',
    needsAdminReview,
  } = {},
) {
  if (!Object.values(PROJECT_STATUS).includes(status)) {
    throw createError('Tr?ng thđi d? đn khđng h?p l?.', 400, 'INVALID_PROJECT_STATUS');
  }

  const executeStatusUpdate = async (session) => {
    const project = await Project.findById(projectId).session(session || null);
    if (!project) {
      throw createError('Khđng tđm th?y d? đn d? c?p nh?t tr?ng thđi.', 404, 'PROJECT_NOT_FOUND');
    }

    const resolvedStatuses = new Set([PROJECT_STATUS.EVALUATED, PROJECT_STATUS.APPROVED, PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED]);
    const shouldClearReview = needsAdminReview === false || resolvedStatuses.has(status);

    if (project.status === status) {
      // Allow admin to clear outlier-review flag without changing status.
      if (shouldClearReview && project.needsAdminReview) {
        const old = { needsAdminReview: project.needsAdminReview, adminReviewReason: project.adminReviewReason || '' };
        project.needsAdminReview = false;
        project.adminReviewReason = '';
        await project.save({ session: session || undefined });
        if (adminId) {
          await auditService.createAuditLog({
            userId: adminId, action: AUDIT_ACTIONS.CHANGE_PROJECT_STATUS, targetEntity: AUDIT_ENTITIES.PROJECTS, targetId: project._id,
            oldValues: old, newValues: { status, needsAdminReview: false, adminReviewReason: '', note: note || '' }, session: session || undefined,
          });
        }
        return { project: project.toObject(), completedAssignment: null, forced: false, allowedTransitions: projectStateMachine.getAllowedTransitions(project.status) };
      }
      throw createError('D? đn đ ? tr?ng thđi nđy.', 400, 'PROJECT_STATUS_UNCHANGED');
    }

    const transition = projectStateMachine.assertValidTransition({
      currentStatus: project.status, targetStatus: status, force, forceReason, extraAllowedTargets, context: transitionContext,
    });

    const oldStatus = project.status;
    const oldReview = { needsAdminReview: !!project.needsAdminReview, adminReviewReason: project.adminReviewReason || '' };
    project.status = status;
    if (shouldClearReview) {
      project.needsAdminReview = false;
      project.adminReviewReason = '';
    } else if (typeof needsAdminReview === 'boolean') {
      project.needsAdminReview = needsAdminReview;
      if (needsAdminReview === false) project.adminReviewReason = '';
    }
    await project.save({ session: session || undefined });

    let completedAssignment = null;
    if (status === PROJECT_STATUS.COMPLETED) {
      const activeAssignment = await MentorAssignment.findOne({ projectId, status: ASSIGNMENT_STATUS.ASSIGNED }).session(session || null);
      if (activeAssignment) {
        const now = new Date();
        activeAssignment.status = ASSIGNMENT_STATUS.COMPLETED;
        activeAssignment.endedAt = now;
        await activeAssignment.save({ session: session || undefined });
        completedAssignment = { assignmentId: activeAssignment._id, mentorId: activeAssignment.mentorId, status: activeAssignment.status, endedAt: activeAssignment.endedAt };
      }
    }

    if (adminId) {
      await auditService.createAuditLog({
        userId: adminId, action: AUDIT_ACTIONS.CHANGE_PROJECT_STATUS, targetEntity: AUDIT_ENTITIES.PROJECTS, targetId: project._id,
        oldValues: { status: oldStatus, ...oldReview },
        newValues: {
          status, note: note || '', forced: transition.forced, forceReason: transition.forced ? forceReason : '',
          needsAdminReview: !!project.needsAdminReview, adminReviewReason: project.adminReviewReason || '',
          completedAssignment: completedAssignment ? { assignmentId: completedAssignment.assignmentId, mentorId: completedAssignment.mentorId } : null,
        },
        session: session || undefined,
      });
    }

    return { project: project.toObject(), completedAssignment, forced: transition.forced, allowedTransitions: projectStateMachine.getAllowedTransitions(project.status) };
  };

  if (externalSession) return executeStatusUpdate(externalSession);
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => { result = await executeStatusUpdate(session); });
      return result;
    } catch (error) {
      if (!isTransactionUnsupportedError(error)) throw error;
      console.warn('[Project] MongoDB khđng h? tr? transaction (standalone) -> c?p nh?t tr?ng thđi khđng transaction.');
      return await executeStatusUpdate(null);
    }
  } finally {
    await session.endSession();
  }
}

async function verifyProjectOwner(studentId, projectId) {
  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  }

  const studentIdStr = studentId.toString();

  // 1. Chuẩn FR01-FR04: Kiểm tra trực tiếp bảng ProjectMember độc lập
  const membership = await ProjectMember.findOne({
    projectId,
    userId: studentId,
    role: PROJECT_MEMBER_ROLES.OWNER,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).lean();

  if (membership) {
    return project;
  }

  // 2. Chuẩn FR01-FR04: Kiểm tra trường ownerId trực tiếp trên Project
  if (project.ownerId && project.ownerId.toString() === studentIdStr) {
    return project;
  }

  // 3. Fallback FR05-FR08: Kiểm tra mảng nhúng members trong Project (an toàn khi mảng bị xóa)
  const isEmbeddedOwner = Boolean(
    (project.members || []).some(
      (m) =>
        m.userId &&
        m.userId.toString() === studentIdStr &&
        typeof m.projectRole === 'string' &&
        m.projectRole.toLowerCase() === 'owner'
    )
  );

  if (isEmbeddedOwner) {
    return project;
  }

  throw createError(
    'Chỉ Owner của dự án mới có quyền thực hiện thao tác này.',
    403,
    'NOT_PROJECT_OWNER'
  );
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

//Kiểm tra quyền truy cập dự án (Admin, Mentor phụ trách, Giám khảo được phân công và Thành viên nhóm).
//Ngăn chặn lỗ hổng IDOR khi đọc thông tin nhạy cảm của dự án (FR05/FR07).
async function verifyProjectAccess(userId, projectId, userRole) {
  // 1. Kiểm tra sự tồn tại của dự án (áp dụng mọi role)
  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  }

  const userRoleNorm = String(userRole || '').toLowerCase();
  const userIdStr = String(userId);

  // 2. Quản trị viên (Admin) luôn có quyền truy cập đầy đủ
  if (userRoleNorm === SYSTEM_ROLES.ADMIN) {
    return { hasAccess: true, role: 'Admin', project, scope: 'full' };
  }

  // 3. Giám khảo: chỉ xem dự án được phân công (tồn tại bản ghi HumanEvaluation)
  if (userRoleNorm === SYSTEM_ROLES.JUDGE) {
    const assigned = await HumanEvaluation.findOne({
      projectId: project._id,
      evaluatorId: userId,
    }).lean();
    if (assigned) {
      return { hasAccess: true, role: 'Judge', project, scope: 'assigned' };
    }
    throw createError('Bạn không được phân công chấm điểm dự án này.', 403, 'JUDGE_NOT_ASSIGNED');
  }

  // 4. Mentor / Teacher: phải là mentor đang phụ trách (Assignment_status = Assigned)
  if (userRoleNorm === SYSTEM_ROLES.MENTOR || userRoleNorm === SYSTEM_ROLES.TEACHER) {
    const activeAssignment = await MentorAssignment.findOne({
      projectId,
      mentorId: userId,
      status: ASSIGNMENT_STATUS.ASSIGNED,
    }).lean();

    if (activeAssignment) {
      return { hasAccess: true, role: 'Mentor', project, scope: 'assigned' };
    }
    throw createError('Bạn không phải là giảng viên hướng dẫn của dự án này.', 403, 'NOT_PROJECT_MENTOR');
  }

  // 5. Sinh viên: owner / thành viên đã chấp nhận / lời mời đang chờ (xem cơ bản)
  const isOwner = project.ownerId && String(project.ownerId) === userIdStr;
  if (isOwner) {
    return { hasAccess: true, role: PROJECT_MEMBER_ROLES.OWNER, project, scope: 'full' };
  }

  const membership = await ProjectMember.findOne({
    projectId,
    userId,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).lean();

  if (membership) {
    return { hasAccess: true, role: membership.role, project, scope: 'full' };
  }

  const pending = await ProjectMember.findOne({
    projectId,
    userId,
    status: PROJECT_MEMBER_STATUS.INVITED,
  }).lean();

  if (pending) {
    return { hasAccess: true, role: 'INVITEE', project, scope: 'basic' };
  }

  // Không thuộc bất kỳ nhóm nào trên -> Từ chối truy cập
  throw createError('Bạn không có quyền truy cập thông tin của dự án này.', 403, 'FORBIDDEN');
}

/**
 * Chuẩn hóa quyền ĐỌC dự án (dùng cho getProject / getProjectRevisions / getProjectSubmissions ...).
 * project là document đã được tải trước; user là { id/_id, role, systemRole }.
 * Trả về { hasAccess, role, scope }:
 *   - 'full': xem toàn bộ chi tiết (owner, thành viên ACCEPTED, admin, mentor/judge được phân công)
 *   - 'assigned': judge/mentor xem dự án được phân công
 *   - 'basic': sinh viên được mời (INVITED) chỉ xem thông tin cơ bản để nhận lời mời
 */
async function assertProjectReadAccess(project, user) {
  if (!project) throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  if (!user) throw createError('Yêu cầu xác thực.', 401, 'UNAUTHORIZED');

  const userId = user.id || user._id;
  const userRoleNorm = String(user.systemRole || user.role || '').toLowerCase();
  const userIdStr = String(userId);

  // 1. ADMIN: full
  if (userRoleNorm === SYSTEM_ROLES.ADMIN) {
    return { hasAccess: true, role: 'Admin', scope: 'full' };
  }

  // 2. JUDGE: chỉ nếu được phân công (tồn tại bản ghi HumanEvaluation)
  if (userRoleNorm === SYSTEM_ROLES.JUDGE) {
    const assigned = await HumanEvaluation.findOne({
      projectId: project._id,
      evaluatorId: userId,
    }).lean();
    if (assigned) {
      return { hasAccess: true, role: 'Judge', scope: 'assigned' };
    }
    throw createError('Bạn không được phân công chấm điểm dự án này.', 403, 'JUDGE_NOT_ASSIGNED');
  }

  // 3. MENTOR / TEACHER: active assignment
  if (userRoleNorm === SYSTEM_ROLES.MENTOR || userRoleNorm === SYSTEM_ROLES.TEACHER) {
    const activeAssignment = await MentorAssignment.findOne({
      projectId: project._id,
      mentorId: userId,
      status: ASSIGNMENT_STATUS.ASSIGNED,
    }).lean();
    if (activeAssignment) {
      return { hasAccess: true, role: 'Mentor', scope: 'assigned' };
    }
    throw createError('Bạn không phải là giảng viên hướng dẫn của dự án này.', 403, 'NOT_PROJECT_MENTOR');
  }

  // 4. STUDENT
  if (userRoleNorm === SYSTEM_ROLES.STUDENT) {
    const isOwner = project.ownerId && String(project.ownerId) === userIdStr;
    if (isOwner) {
      return { hasAccess: true, role: PROJECT_MEMBER_ROLES.OWNER, scope: 'full' };
    }
    const membership = await ProjectMember.findOne({
      projectId: project._id,
      userId,
      status: PROJECT_MEMBER_STATUS.ACCEPTED,
    }).lean();
    if (membership) {
      return { hasAccess: true, role: membership.role, scope: 'full' };
    }
    const pending = await ProjectMember.findOne({
      projectId: project._id,
      userId,
      status: PROJECT_MEMBER_STATUS.INVITED,
    }).lean();
    if (pending) {
      return { hasAccess: true, role: 'INVITEE', scope: 'basic' };
    }
    throw createError('Bạn không có quyền truy cập thông tin của dự án này.', 403, 'FORBIDDEN');
  }

  throw createError('Vai trò không được hỗ trợ.', 403, 'INSUFFICIENT_ROLE');
}

/**
 * Chuẩn hóa quyền GHI / CHỈNH SỬA dự án.
 * Chỉ SINH VIÊN là owner hoặc thành viên đã chấp nhận được sửa;
 * dự án phải ở trạng thái cho phép chỉnh sửa (DRAFT / NEED_REVISION).
 * ADMIN / JUDGE / MENTOR chỉ ĐỌC, KHÔNG được sửa thông tin gốc dự án sinh viên.
 */
async function assertProjectWriteAccess(project, user) {
  if (!project) throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  if (!user) throw createError('Yêu cầu xác thực.', 401, 'UNAUTHORIZED');

  const userRoleNorm = String(user.systemRole || user.role || '').toLowerCase();
  const userId = user.id || user._id;
  const userIdStr = String(userId);

  if (userRoleNorm !== SYSTEM_ROLES.STUDENT) {
    throw createError(
      'Chỉ thành viên dự án (Sinh viên) được phép chỉnh sửa thông tin dự án.',
      403,
      'WRITE_FORBIDDEN_FOR_ROLE'
    );
  }

  const isOwner = project.ownerId && String(project.ownerId) === userIdStr;
  let membershipRole = PROJECT_MEMBER_ROLES.OWNER;
  if (!isOwner) {
    const membership = await ProjectMember.findOne({
      projectId: project._id,
      userId,
      status: PROJECT_MEMBER_STATUS.ACCEPTED,
    }).lean();
    if (!membership) {
      throw createError(
        'Chỉ Trưởng nhóm hoặc thành viên đã chấp nhận được chỉnh sửa dự án.',
        403,
        'NOT_PROJECT_MEMBER'
      );
    }
    membershipRole = membership.role;
  }

  if (!EDITABLE_PROJECT_STATUSES.includes(project.status)) {
    throw createError(PROJECT_LOCKED_MESSAGE, 'PROJECT_LOCKED', { status: project.status });
  }

  return { hasAccess: true, role: membershipRole, isOwner, scope: 'full' };
}


/** Trường cốt lõi bắt buộc phải có trước khi nộp dự án (fail fast) */
const REQUIRED_SUBMIT_FIELDS = ['title', 'category', 'abstract', 'objectives'];

/** Các trường được ghi vào snapshot khi nộp dự án */
const SNAPSHOT_FIELDS = [
  'title',
  'code',
  'category',
  'faculty',
  'objectives',
  'abstract',
  'problemStatement',
  'solution',
  'businessModel',
  'attachmentUrl',
  'advisorInfo',
  'leaderInfo',
  'competitionId',
  'competitionTitle',
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

const assertAdvisorInfo = (value) => {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw ApiError.badRequest('Thông tin giảng viên hướng dẫn là bắt buộc', 'INVALID_FIELD');
  }

  const fullName = assertRequired(value.fullName, 'advisorInfo.fullName');
  const department = assertRequired(value.department ?? value.unit, 'advisorInfo.department');
  const email = assertRequired(value.email, 'advisorInfo.email').toLowerCase();

  return {
    hasAdvisor: true,
    fullName,
    email,
    phone: assertOptionalString(value.phone, 'advisorInfo.phone', 30) ?? '',
    department,
    academicRank: assertOptionalString(value.academicRank, 'advisorInfo.academicRank', 100) ?? '',
  };
};

const FIELD_VALIDATORS = {
  title: (value) => assertRequired(value, 'title'),
  category: (value) => assertOptionalString(value, 'category', 120) ?? '',
  objectives: (value) => assertOptionalString(value, 'objectives', 2000) ?? '',
  abstract: (value) => assertOptionalString(value, 'abstract', 2000) ?? '',
  problemStatement: (value) => assertOptionalString(value, 'problemStatement', 4000) ?? '',
  solution: (value) => assertOptionalString(value, 'solution', 4000) ?? '',
  businessModel: (value) => assertOptionalString(value, 'businessModel', 2000) ?? '',
  attachmentUrl: (value) => assertOptionalUrl(value, 'attachmentUrl'),
  advisorInfo: assertAdvisorInfo,
  competitionId: (value) => assertOptionalString(value, 'competitionId', 100) ?? '',
  competitionTitle: (value) => assertOptionalString(value, 'competitionTitle', 200) ?? '',
  milestones: assertMilestones,
};

/** Chỉ nhận các trường được phép sửa và validate từng trường */
const buildProjectData = (payload = {}) =>
  Object.entries(FIELD_VALIDATORS).reduce((data, [field, validate]) => {
    if (payload[field] !== undefined) data[field] = validate(payload[field]);
    return data;
  }, {});

/** Sinh mã dự án dạng SESS-<năm>-<số thứ tự 3 chữ số>, VD: SESS-2026-001 */
const generateProjectCode = async (session) => {
  const year = new Date().getFullYear();
  const prefix = `${PROJECT_CODE_PREFIX}-${year}-`;

  const latestProjectQuery = Project.findOne({ code: new RegExp(`^${prefix}`) })
    .sort({ code: -1 })
    .select('code')
    .lean();
  if (session) latestProjectQuery.session(session);
  const latestProject = await latestProjectQuery;

  const nextNumber = latestProject ? Number.parseInt(latestProject.code.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
};

/** Tạo dự án kèm mã tự sinh; tự thử lại nếu mã bị trùng */
const createWithGeneratedCode = async (data, { session } = {}) => {
  for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
    const code = await generateProjectCode(session);

    try {
      if (session) {
        const [project] = await Project.create([{ ...data, code }], { session });
        return project;
      }
      return await Project.create({ ...data, code });
    } catch (error) {
      // Trùng mã dự án -> sinh mã khác; lỗi khác đẩy cho Error Middleware xử lý
      if (error?.code !== 11000 || session) throw error;
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
const assertOptimisticVersion = (doc, payload = {}) => {
  if (!payload || typeof payload !== 'object') return;
  const expectedV = payload.expectedVersion ?? payload.__v ?? payload.version;
  if (expectedV !== undefined && expectedV !== null && expectedV !== '') {
    const currentV = Number(doc?.__v);
    const givenV = Number(expectedV);
    if (Number.isFinite(currentV) && Number.isFinite(givenV) && currentV !== givenV) {
      throw ApiError.conflict('D? li?u d? đn đ thay d?i ? phiđn khđc. Vui lđng t?i l?i tru?c khi c?p nh?t.', 'CONFLICT', { currentVersion: currentV, expectedVersion: givenV });
    }
  }
  const expectedAt = payload.lastKnownUpdatedAt ?? payload.expectedUpdatedAt;
  if (expectedAt) {
    const currentAt = doc?.updatedAt ? new Date(doc.updatedAt).getTime() : NaN;
    const givenAt = new Date(expectedAt).getTime();
    if (Number.isFinite(currentAt) && Number.isFinite(givenAt) && currentAt !== givenAt) {
      throw ApiError.conflict('D? li?u d? đn đ thay d?i ? phiđn khđc. Vui lđng t?i l?i tru?c khi c?p nh?t.', 'CONFLICT', { currentUpdatedAt: doc?.updatedAt, expectedUpdatedAt: expectedAt });
    }
  }
};

const updateProject = async ({ projectId, user, payload = {} }) => {
  const project = await getProjectById(projectId);
  await assertProjectWriteAccess(project, user);

  assertOptimisticVersion(project, payload);

  const data = buildProjectData(payload);
  if (!Object.keys(data).length) {
    throw ApiError.badRequest('Không có thông tin cần cập nhật', 'NOTHING_TO_UPDATE');
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
const submitProject = async ({ projectId, actor, req, expectedVersion, lastKnownUpdatedAt } = {}) => {
  const project = await getProjectById(projectId);
  await assertProjectWriteAccess(project, actor);

  // Đóng băng dự án: không nộp/dang xét duyệt thì không nộp lại
  projectMemberService.assertProjectEditable(project);
  assertOptimisticVersion(project, { expectedVersion, __v: expectedVersion, lastKnownUpdatedAt });
  // Deadline enforcement: if an active round defines submission window, enforce it
  const now = new Date();
  const activeRound = await EvaluationRound.findOne({
    isActive: { $ne: false },
    $or: [{ submissionOpenAt: { $ne: null } }, { submissionCloseAt: { $ne: null } }],
  }).sort({ submissionOpenAt: -1, createdAt: -1 }).lean();
  if (activeRound && (activeRound.submissionOpenAt || activeRound.submissionCloseAt)) {
    const openAt = activeRound.submissionOpenAt ? new Date(activeRound.submissionOpenAt) : null;
    const closeAt = activeRound.submissionCloseAt ? new Date(activeRound.submissionCloseAt) : null;
    if ((openAt && now < openAt) || (closeAt && now > closeAt)) {
      throw ApiError.badRequest(
        `Ngoai thoi gian nop bai cua vong thi${activeRound.roundName ? ` "${activeRound.roundName}"` : ''}. Vui long nop trong khoang thoi gian cho phep.`,
        'SUBMISSION_WINDOW_CLOSED',
        {
          roundId: activeRound._id,
          roundName: activeRound.roundName,
          stageType: activeRound.stageType,
          submissionOpenAt: activeRound.submissionOpenAt,
          submissionCloseAt: activeRound.submissionCloseAt,
          now,
        }
      );
    }
  }

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

  // Sinh biên nhận số (Digital Receipt)
  const receipt = digitalReceiptService.createDigitalReceipt({
    projectCode: project.code,
    version: project.version,
  });

  project.status = PROJECT_STATUS.SUBMITTED;
  project.version += 1;
  project.lastSubmittedAt = revision.submittedAt;
  project.digitalReceiptHash = receipt.hash;
  project.digitalReceiptTimestamp = receipt.timestamp;
  await project.save();

  // Lấy email Owner để gửi biên nhận số
  const ownerUser = project.ownerId ? await User.findById(project.ownerId).select('email').lean() : null;
  const ownerEmail = ownerUser?.email ?? '';

  // Lấy danh sách email thành viên dự án để gửi biên nhận
  const memberships = await ProjectMember.find({
    projectId: project._id,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).select('userId').lean();

  const memberEmails = [];
  for (const m of memberships) {
    const user = await User.findById(m.userId).select('email').lean();
    if (user?.email) memberEmails.push(user.email);
  }

  // Gửi email biên nhận số qua BullMQ (fallback inline khi không có Redis).
  // Tác vụ nền: không chặn request nộp bài, không làm nghẽn MongoDB.
  try {
    await queueService.enqueueDigitalReceiptEmail({
      to: ownerEmail,
      payload: {
        projectCode: project.code,
        projectTitle: project.title,
        version: receipt.version ? receipt.version : project.version - 1,
        receiptHash: receipt.hash,
        receiptTimestamp: receipt.timestamp,
        submittedAt: revision.submittedAt,
        memberEmails,
      },
    });
  } catch (emailError) {
    console.error('[DigitalReceipt] Gửi email biên nhận thất bại:', emailError.message);
  }

  // Thông báo in-app cho toàn bộ Admin: có đề tài mới được nộp.
  await notificationService.notifyProjectSubmitted({ project, revision });

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CHANGE_PROJECT_STATUS,
    targetEntity: AUDIT_TARGETS.PROJECT,
    targetId: project._id,
    oldValues: { status: previousStatus, version: previousVersion },
    newValues: {
      status: project.status,
      version: project.version,
      revisionId: revision._id,
      digitalReceiptHash: receipt.hash,
      digitalReceiptTimestamp: receipt.timestamp,
    },
    req,
  });

  return { project, revision, digitalReceipt: receipt };
};

/** Lịch sử các phiên bản đã nộp của dự án (mới nhất trước) */
const getProjectRevisions = async ({ projectId, user }) => {
  const project = await getProjectById(projectId);
  await assertProjectReadAccess(project, user);
  const revisions = await ProjectRevision.find({ projectId: project._id }).sort({ versionNumber: -1 });
  return { project, revisions };
};

/** Lấy danh sách dự án của user (phân trang, lọc status) */
const isCompletedMilestone = (status) => ['Completed', MILESTONE_STATUS.DONE, MILESTONE_STATUS.COMPLETED].includes(status);

/** Làm giàu dữ liệu dự án bằng vai trò, tiến độ và trạng thái yêu cầu phía server. */
const enrichProjectsForUser = async ({ projects = [], userId }) => {
  if (!projects.length) return [];

  const projectIds = projects.map((project) => project._id ?? project.id);
  const [memberships, actualMilestones, pendingCancellations, pendingLeaveRequests] = await Promise.all([
    ProjectMember.find({ projectId: { $in: projectIds }, userId, status: PROJECT_MEMBER_STATUS.ACCEPTED })
      .select('projectId role')
      .lean(),
    ProjectMilestone.find({ projectId: { $in: projectIds } }).select('projectId status').lean(),
    ProjectCancellationRequest.find({
      projectId: { $in: projectIds },
      status: PROJECT_CANCELLATION_STATUS.PENDING,
    }).sort({ createdAt: -1 }).lean(),
    ProjectMemberChangeRequest.find({
      projectId: { $in: projectIds },
      requesterId: userId,
      targetUserId: userId,
      type: MEMBER_CHANGE_REQUEST_TYPE.REMOVE,
      status: MEMBER_CHANGE_REQUEST_STATUS.PENDING,
    }).sort({ createdAt: -1 }).lean(),
  ]);

  const membershipByProject = new Map(memberships.map((membership) => [String(membership.projectId), membership]));
  const actualMilestonesByProject = new Map();
  for (const milestone of actualMilestones) {
    const key = String(milestone.projectId);
    if (!actualMilestonesByProject.has(key)) actualMilestonesByProject.set(key, []);
    actualMilestonesByProject.get(key).push(milestone);
  }
  const cancellationByProject = new Map();
  for (const request of pendingCancellations) {
    const key = String(request.projectId);
    if (!cancellationByProject.has(key)) cancellationByProject.set(key, request);
  }
  const leaveRequestByProject = new Map();
  for (const request of pendingLeaveRequests) {
    const key = String(request.projectId);
    if (!leaveRequestByProject.has(key)) leaveRequestByProject.set(key, request);
  }

  return projects.map((project) => {
    const key = String(project._id ?? project.id);
    const membership = membershipByProject.get(key);
    const actual = actualMilestonesByProject.get(key) ?? [];
    const milestones = actual.length
      ? actual
      : (project.milestones ?? []).map((milestone) => ({ status: milestone.status }));
    const completed = milestones.filter((milestone) => isCompletedMilestone(milestone.status)).length;
    const total = milestones.length;
    const cancellationRequest = cancellationByProject.get(key) ?? null;
    const leaveRequest = leaveRequestByProject.get(key) ?? null;

    return {
      ...project,
      userRole: membership?.role ?? (String(project.ownerId) === String(userId) ? PROJECT_MEMBER_ROLES.OWNER : PROJECT_MEMBER_ROLES.MEMBER),
      progress: {
        percent: total ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      },
      cancellationRequest: {
        hasPending: Boolean(cancellationRequest),
        requestInfo: cancellationRequest,
      },
      hasPendingLeaveRequest: Boolean(leaveRequest),
      leaveRequestInfo: leaveRequest ? { reason: leaveRequest.reason, createdAt: leaveRequest.createdAt } : null,
    };
  });
};

/** Lấy danh sách dự án của user (phân trang, lọc status và quota gốc). */
const getProjects = async ({ userId, page = 1, limit = 10, status }) => {
  const userMemberships = await ProjectMember.find({ userId, status: PROJECT_MEMBER_STATUS.ACCEPTED })
    .select('projectId role')
    .lean();
  const projectIds = userMemberships.map((m) => m.projectId);
  const quotaQuery = projectIds.length
    ? Project.countDocuments({
      _id: { $in: projectIds },
      parentId: null,
      status: { $nin: FINISHED_PROJECT_STATUSES },
    })
    : Promise.resolve(0);
  const activeProjectCount = await quotaQuery;
  const quota = {
    activeProjectCount,
    maxActiveProjects: MAX_ACTIVE_PROJECTS,
    remaining: Math.max(0, MAX_ACTIVE_PROJECTS - activeProjectCount),
  };

  if (!projectIds.length) {
    return { projects: [], pagination: { page, limit, total: 0, totalPages: 0 }, quota };
  }

  const filter = { _id: { $in: projectIds } };
  if (status === 'ACTIVE') filter.status = { $nin: FINISHED_PROJECT_STATUSES };
  else if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [rawProjects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);
  const projects = await enrichProjectsForUser({ projects: rawProjects, userId });

  return {
    projects,
    quota,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/** Lấy chi tiết dự án. Quyền đọc chuẩn: Admin, Giám khảo được phân công, Mentor phụ trách,
 *  Chủ đề tài / thành viên đã chấp nhận (full); sinh viên được mời đang chờ (basic - chỉ thông tin cơ bản). */
const getProject = async ({ projectId, user }) => {
  const project = await getProjectById(projectId);
  const access = await assertProjectReadAccess(project, user);

  // Sinh viên được mời (pending): chỉ trả thông tin cơ bản để nhận lời mời, không lộ dữ liệu nhạy cảm.
  if (access.scope === 'basic') {
    return {
      project: {
        _id: project._id,
        id: project._id,
        code: project.code,
        title: project.title ?? project.name ?? '',
        name: project.name ?? project.title ?? '',
        status: project.status,
        field: project.field ?? project.category ?? '',
        description: project.description ?? project.abstract ?? '',
      },
      membership: { role: access.role, scope: access.scope },
    };
  }

  // Đồng bộ danh sách thành viên từ bảng ProjectMember (nguồn dữ liệu chính thức FR04)
  // vào trường members của object project trả về, đảm bảo API không bao giờ trả mảng rỗng khi DB có dữ liệu.
  const projectMembers = await ProjectMember.find({ projectId: project._id, status: PROJECT_MEMBER_STATUS.ACCEPTED })
    .populate('userId', 'fullName email studentId')
    .lean();
  if (projectMembers.length) {
    project.members = projectMembers.map((pm) => ({
      _id: pm._id,
      userId: pm.userId,
      fullName: pm.userId ? pm.userId.fullName : '',
      email: pm.userId ? pm.userId.email : (pm.email || ''),
      studentId: pm.userId ? pm.userId.studentId : '',
      studentCode: pm.userId ? pm.userId.studentId : '',
      role: pm.role,
      status: pm.status,
    }));
  } else if (Array.isArray(project.members)) {
    // Giữ nguyên mảng members nhúng sẵn trong document Project khi ProjectMember trống
    project.members = project.members.map((m) => ({
      _id: m._id || m.userId,
      userId: m.userId || m._id,
      fullName: m.fullName || (m.userId && m.userId.fullName) || '',
      email: m.email || (m.userId && m.userId.email) || '',
      studentId: m.studentId || (m.userId && m.userId.studentId) || m.studentCode || '',
      studentCode: m.studentCode || m.studentId || (m.userId && m.userId.studentId) || '',
      role: m.role || '',
      status: m.status || '',
    }));
  }

  // Enrich Nhóm trưởng từ collection users hoặc student_whitelists dựa trên leaderEmail
  if (project.leaderEmail) {
    let leaderDoc = await User.findOne({ email: project.leaderEmail }).select('fullName email studentId phoneNumber role').lean();
    if (!leaderDoc) {
      leaderDoc = await StudentWhitelist.findOne({ email: project.leaderEmail }).select('fullName email studentId phone advisorEmail').lean();
    }
    if (leaderDoc) {
      project.leader = {
        _id: leaderDoc._id,
        fullName: leaderDoc.fullName || '',
        email: leaderDoc.email || '',
        studentId: leaderDoc.studentId || '',
        studentCode: leaderDoc.studentId || '',
        phone: leaderDoc.phoneNumber || leaderDoc.phone || '',
        role: leaderDoc.role || 'Thành viên',
      };
    }
  }

  const [enrichedProject] = await enrichProjectsForUser({ projects: [project], userId: user?.id ?? user?._id });
  return {
    project: enrichedProject,
    membership: {
      role: access.role,
      scope: access.scope,
      isOwner: access.isOwner,
      hasPendingLeaveRequest: enrichedProject?.hasPendingLeaveRequest ?? false,
      leaveRequestInfo: enrichedProject?.leaveRequestInfo ?? null,
    },
    cancellationRequest: enrichedProject?.cancellationRequest ?? { hasPending: false, requestInfo: null },
  };
};

module.exports = {
  createProject,
  updateProject,
  submitProject,
  getProjectRevisions,
  getProjects,
  getProject,
  enrichProjectsForUser,
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
  verifyProjectAccess,
  assertProjectReadAccess,
  assertProjectWriteAccess,
  // Dùng lại cho luồng thi vượt cấp (tạo dự án con có mã tự sinh)
  createProjectWithGeneratedCode: createWithGeneratedCode,
};

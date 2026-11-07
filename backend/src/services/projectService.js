const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectRevision = require('../models/ProjectRevision');
const ProjectMember = require('../models/ProjectMember');
const ProjectMilestone = require('../models/ProjectMilestone');
const ProjectCancellationRequest = require('../models/ProjectCancellationRequest');
const ProjectMemberChangeRequest = require('../models/ProjectMemberChangeRequest');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const whitelistService = require('./whitelistService');
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
  FINISHED_PROJECT_STATUSES,
  MAX_ACTIVE_PROJECTS,
  PROJECT_CANCELLATION_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
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
const projectStateMachine = require('../utils/projectStateMachine');

const runTransaction = async (callback) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

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
  } = {},
) {
  if (!Object.values(PROJECT_STATUS).includes(status)) {
    throw createError('Trạng thái dự án không hợp lệ.', 400, 'INVALID_PROJECT_STATUS');
  }

  const executeStatusUpdate = async (session) => {
    const project = await Project.findById(projectId).session(session || null);
    if (!project) {
      throw createError('Không tìm thấy dự án để cập nhật trạng thái.', 404, 'PROJECT_NOT_FOUND');
    }

    if (project.status === status) {
      throw createError('Dự án đã ở trạng thái này.', 400, 'PROJECT_STATUS_UNCHANGED');
    }

    // State Machine: chỉ cho phép chuyển trạng thái theo ma trận nghiêm ngặt.
    // Admin có thể cưỡng chế (FORCE_OVERRIDE) trạng thái kết thúc nếu có lý do kiểm toán.
    const transition = projectStateMachine.assertValidTransition({
      currentStatus: project.status,
      targetStatus: status,
      force,
      forceReason,
      extraAllowedTargets,
      context: transitionContext,
    });

    const oldStatus = project.status;
    project.status = status;
    await project.save({ session: session || undefined });

    let completedAssignment = null;

    // Ràng buộc nghiêm ngặt: CHỈ KHI status chính xác là 'Completed' mới hoàn thành assignment
    if (status === PROJECT_STATUS.COMPLETED) {
      const activeAssignment = await MentorAssignment.findOne({
        projectId,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      }).session(session || null);

      if (activeAssignment) {
        const now = new Date();
        activeAssignment.status = ASSIGNMENT_STATUS.COMPLETED;
        activeAssignment.endedAt = now;
        await activeAssignment.save({ session: session || undefined });

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
          forced: transition.forced,
          forceReason: transition.forced ? forceReason : '',
          completedAssignment: completedAssignment
            ? {
                assignmentId: completedAssignment.assignmentId,
                mentorId: completedAssignment.mentorId,
              }
            : null,
        },
        session: session || undefined,
      });
    }

    return {
      project: project.toObject(),
      completedAssignment,
      forced: transition.forced,
      allowedTransitions: projectStateMachine.getAllowedTransitions(project.status),
    };
  };

  // Nếu caller đã truyền session (vd: assignMentorToProject), sử dụng session đó
  if (externalSession) {
    return executeStatusUpdate(externalSession);
  }

  // Nếu chưa có session, tự mở Mongoose Transaction để bảo đảm ACID khi cập nhật đa collection.
  // MongoDB standalone (môi trường dev) KHÔNG hỗ trợ transaction -> tự động fallback
  // sang chế độ không transaction để luồng nghiệp vụ vẫn hoạt động.
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await executeStatusUpdate(session);
      });
      return result;
    } catch (error) {
      if (!isTransactionUnsupportedError(error)) throw error;
      console.warn(
        '[Project] MongoDB không hỗ trợ transaction (standalone) -> cập nhật trạng thái không transaction.',
      );
      return await executeStatusUpdate(null);
    }
  } finally {
    await session.endSession();
  }
}

/**
 * Kiểm tra user là Owner của dự án. Ném 403 nếu không phải Owner.
 * Thiết kế theo Kịch bản B:
 * - Ưu tiên 1: Chuẩn FR01-FR04 qua bảng ProjectMember độc lập
 * - Ưu tiên 2: Trường liên kết trực tiếp project.ownerId
 * - Fallback: Mảng nhúng project.members (tương thích ngược với test fixtures FR05)
 * @param {string|ObjectId} studentId - ID của sinh viên
 * @param {string|ObjectId} projectId - ID của dự án
 * @returns {Promise<Object>} project document đã tìm thấy
 */
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

//Kiểm tra quyền truy cập dự án (Dùng cho Admin, Mentor phụ trách và Thành viên nhóm).
//Ngăn chặn lỗ hổng IDOR khi đọc thông tin nhạy cảm của dự án (FR05/FR07).
async function verifyProjectAccess(userId, projectId, userRole) {
  // 1. Quản trị viên (Admin) luôn có quyền truy cập
  if (userRole === SYSTEM_ROLES.ADMIN || userRole === 'admin') {
    return { hasAccess: true, role: 'Admin' };
  }

  // 2. Kiểm tra sự tồn tại của dự án
  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw createError('Không tìm thấy dự án.', 404, 'PROJECT_NOT_FOUND');
  }

  // 3. Nếu là Mentor: Kiểm tra có được phân công phụ trách dự án đang hoạt động hay không
  if (userRole === SYSTEM_ROLES.MENTOR || userRole === 'mentor' || userRole === 'teacher') {
    const activeAssignment = await MentorAssignment.findOne({
      projectId,
      mentorId: userId,
      status: ASSIGNMENT_STATUS.ASSIGNED,
    }).lean();

    if (activeAssignment) {
      return { hasAccess: true, role: 'Mentor', project };
    }
  }

  // 4. Nếu là Sinh viên / Thành viên: Kiểm tra cả 2 nhánh (ProjectMember độc lập và project.members / ownerId)
  const isOwner = project.ownerId && project.ownerId.toString() === userId.toString();
  const isEmbeddedMember = (project.members || []).some(
    (m) => m.userId && m.userId.toString() === userId.toString()
  );

  if (isOwner || isEmbeddedMember) {
    return { hasAccess: true, role: 'Member', project };
  }

  // Kiểm tra trong bảng ProjectMember (nhánh FR04)
  const membership = await ProjectMember.findOne({
    projectId,
    userId,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).lean();

  if (membership) {
    return { hasAccess: true, role: 'Member', project };
  }

  // Không thuộc bất kỳ nhóm nào trên -> Từ chối truy cập
  throw createError('Bạn không có quyền truy cập thông tin của dự án này.', 403, 'FORBIDDEN');
}


/** Trường cốt lõi bắt buộc phải có trước khi nộp dự án (fail fast) */
const REQUIRED_SUBMIT_FIELDS = ['title', 'category', 'abstract'];

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
];

/** Số lần thử lại khi mã dự án bị trùng (race condition) */
const MAX_CODE_RETRY = 3;

const assertAdvisorInfo = (value) => {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw ApiError.badRequest('Thông tin giảng viên hướng dẫn là bắt buộc', 'INVALID_FIELD');
  }

  const fullName = assertRequired(value.fullName, 'advisorInfo.fullName', 200);
  const department = assertRequired(value.department ?? value.unit, 'advisorInfo.department', 200);
  const email = assertRequired(value.email, 'advisorInfo.email', 254).toLowerCase();

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
  competitionId: (value) => assertOptionalString(String(value), 'competitionId', 100) ?? '',
  competitionTitle: (value) => assertOptionalString(value, 'competitionTitle', 200) ?? '',
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

  const writableData = buildProjectData(payload);
  const whitelistStudent = await whitelistService.findStudentByEmail(owner.email);
  const userProfile = await UserProfile.findOne({ userId: owner._id }).lean();
  const faculty = String(whitelistStudent?.faculty ?? owner.faculty ?? '').trim();
  const leaderPhone = userProfile?.phone || owner.phoneNumber || whitelistStudent?.phone || '';
  const leaderInfo = {
    fullName: whitelistStudent?.fullName || owner.fullName || '',
    studentId: whitelistStudent?.studentId || owner.studentId || '',
    className: whitelistStudent?.className || owner.className || '',
    faculty,
    email: whitelistStudent?.email || owner.email || '',
    phone: leaderPhone,
  };

  let project;
  for (let attempt = 0; attempt < MAX_CODE_RETRY; attempt += 1) {
    try {
      project = await runTransaction(async (session) => {
        await projectMemberService.assertCanJoinActiveProject({ userId: owner._id, session });
        const createdProject = await createWithGeneratedCode(
          {
            ...writableData,
            faculty,
            leaderInfo,
            status: PROJECT_STATUS.DRAFT,
            ownerId: owner._id,
            version: 1,
          },
          { session },
        );

        await ProjectMember.create(
          [{
            projectId: createdProject._id,
            userId: owner._id,
            email: owner.email,
            role: PROJECT_MEMBER_ROLES.OWNER,
            status: PROJECT_MEMBER_STATUS.ACCEPTED,
            joinedAt: new Date(),
          }],
          { session },
        );

        const syncedProject = await projectMemberService.syncProjectEmbeddedMembers({
          projectId: createdProject._id,
          session,
        });
        await logAuditAction({
          actor: owner,
          action: AUDIT_ACTIONS.CREATE_PROJECT,
          targetEntity: AUDIT_TARGETS.PROJECT,
          targetId: createdProject._id,
          newValues: {
            code: createdProject.code,
            title: createdProject.title,
            status: createdProject.status,
            version: createdProject.version,
          },
          req,
          session,
        });
        return syncedProject;
      });
      break;
    } catch (error) {
      const duplicateProjectCode = error?.code === 11000 &&
        (error?.keyValue?.code || String(error?.message ?? '').includes('code_1'));
      if (!duplicateProjectCode || attempt === MAX_CODE_RETRY - 1) throw error;
    }
  }

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
  const executeSubmit = async (session) => {
    const { project } = await projectMemberService.assertProjectMember(projectId, actor.id, { session });
    projectMemberService.assertProjectEditable(project);

    const missingFields = REQUIRED_SUBMIT_FIELDS.filter((field) => !isNonEmptyString(project[field]));
    if (!isNonEmptyString(project.objectives)) {
      missingFields.push('objectives');
    }
    if (missingFields.length) {
      throw ApiError.badRequest(
        `Dự án chưa đủ thông tin để nộp. Vui lòng bổ sung: ${missingFields.join(', ')}`,
        'MISSING_REQUIRED_FIELDS',
        { missingFields },
      );
    }

    const source = project.toObject();
    const snapshotData = SNAPSHOT_FIELDS.reduce((snapshot, field) => {
      snapshot[field] = source[field] ?? null;
      return snapshot;
    }, {});
    const previousStatus = project.status;
    const previousVersion = project.version;
    const submittedAt = new Date();
    const receipt = digitalReceiptService.createDigitalReceipt({
      projectCode: project.code,
      version: project.version,
      snapshotData,
    });

    const revisionDoc = {
      projectId: project._id,
      versionNumber: project.version,
      snapshotData,
      submittedAt,
      submittedBy: actor.id,
      digitalReceipt: receipt,
    };
    const [revision] = session
      ? await ProjectRevision.create([revisionDoc], { session })
      : await ProjectRevision.create([revisionDoc]);

    project.status = PROJECT_STATUS.SUBMITTED;
    project.version += 1;
    project.lastSubmittedAt = revision.submittedAt;
    project.digitalReceiptHash = receipt.hash;
    project.digitalReceiptTimestamp = receipt.timestamp;
    if (session) {
      await project.save({ session });
    } else {
      await project.save();
    }

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
      session: session || undefined,
    });

    return { project, revision, receipt };
  };

  let submitted;
  try {
    submitted = await runTransaction(async (session) => executeSubmit(session));
  } catch (error) {
    if (!isTransactionUnsupportedError(error)) throw error;
    console.warn('[Project] MongoDB standalone không hỗ trợ transaction -> nộp bài không dùng transaction.');
    submitted = await executeSubmit(null);
  }

  const { project, revision, receipt } = submitted;
  await notificationService.notifyProjectSubmitted({ project, revision });
  const ownerUser = project.ownerId ? await User.findById(project.ownerId).select('email').lean() : null;
  const memberships = await ProjectMember.find({
    projectId: project._id,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).select('userId').lean();
  const memberUsers = memberships.length
    ? await User.find({ _id: { $in: memberships.map((membership) => membership.userId) } }).select('email').lean()
    : [];
  const memberEmails = memberUsers.map((user) => user.email).filter(Boolean);

  try {
    await queueService.enqueueDigitalReceiptEmail({
      to: ownerUser?.email ?? '',
      payload: {
        projectCode: project.code,
        projectTitle: project.title,
        version: revision.versionNumber,
        receiptHash: receipt.hash,
        receiptTimestamp: receipt.timestamp,
        submittedAt: revision.submittedAt,
        memberEmails,
      },
    });
  } catch (emailError) {
    console.error('[DigitalReceipt] Gửi email biên nhận thất bại:', emailError.message);
  }

  return { project, revision, digitalReceipt: receipt };
};

/** Lịch sử các phiên bản đã nộp của dự án (mới nhất trước) */
const getProjectRevisions = async ({ projectId, userId }) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, userId);
  const revisions = await ProjectRevision.find({ projectId: project._id }).sort({ versionNumber: -1 });
  return { project, revisions };
};

const isCompletedMilestone = (status) => ['Completed', MILESTONE_STATUS.DONE, MILESTONE_STATUS.COMPLETED].includes(status);

/** Làm giàu dữ liệu sinh viên bằng vai trò, tiến độ và trạng thái yêu cầu phía server. */
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

/** Lấy chi tiết dự án (chỉ thành viên đã chấp nhận) */
const getProject = async ({ projectId, userId }) => {
  const { project, membership } = await projectMemberService.assertProjectMember(projectId, userId);
  const embeddedMemberships = await ProjectMember.find({
    projectId: project._id,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).sort({ joinedAt: 1 }).lean();
  const memberUsers = embeddedMemberships.length
    ? await User.find({ _id: { $in: embeddedMemberships.map((item) => item.userId) } })
      .select('fullName email studentId className phoneNumber')
      .lean()
    : [];
  const userById = new Map(memberUsers.map((user) => [String(user._id), user]));
  const projectData = project.toObject();
  projectData.members = embeddedMemberships.map((item) => {
    const user = userById.get(String(item.userId)) ?? {};
    return {
      userId: item.userId,
      fullName: user.fullName ?? '',
      email: user.email ?? item.email ?? '',
      studentId: user.studentId ?? '',
      className: user.className ?? '',
      phone: user.phoneNumber ?? '',
      role: item.role,
      projectRole: item.role === PROJECT_MEMBER_ROLES.OWNER ? 'Owner' : 'Member',
      joinedAt: item.joinedAt,
    };
  });
  const [enrichedProject] = await enrichProjectsForUser({ projects: [projectData], userId });
  const cancellationRequest = enrichedProject.cancellationRequest;
  return {
    project: enrichedProject,
    membership: {
      ...membership.toObject(),
      role: membership.role,
      hasPendingLeaveRequest: enrichedProject.hasPendingLeaveRequest,
      leaveRequestInfo: enrichedProject.leaveRequestInfo,
    },
    cancellationRequest,
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
  // Dùng lại cho luồng thi vượt cấp (tạo dự án con có mã tự sinh)
  createProjectWithGeneratedCode: createWithGeneratedCode,
};

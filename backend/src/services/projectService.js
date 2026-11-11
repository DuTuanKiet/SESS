const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectRevision = require('../models/ProjectRevision');
const EvaluationRound = require('../models/EvaluationRound');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');
const StudentWhitelist = require('../models/StudentWhitelist');
const MentorAssignment = require('../models/MentorAssignment');
const auditService = require('./auditService');
const projectMemberService = require('./projectMemberService');
const digitalReceiptService = require('./digitalReceiptService');
const queueService = require('./queueService');
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
    throw createError('Tr?ng th�i d? �n kh�ng h?p l?.', 400, 'INVALID_PROJECT_STATUS');
  }

  const executeStatusUpdate = async (session) => {
    const project = await Project.findById(projectId).session(session || null);
    if (!project) {
      throw createError('Kh�ng t�m th?y d? �n d? c?p nh?t tr?ng th�i.', 404, 'PROJECT_NOT_FOUND');
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
      throw createError('D? �n d� ? tr?ng th�i n�y.', 400, 'PROJECT_STATUS_UNCHANGED');
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
      console.warn('[Project] MongoDB kh�ng h? tr? transaction (standalone) -> c?p nh?t tr?ng th�i kh�ng transaction.');
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
const REQUIRED_SUBMIT_FIELDS = ['title', 'category', 'abstract', 'objectives'];

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
const assertOptimisticVersion = (doc, payload = {}) => {
  if (!payload || typeof payload !== 'object') return;
  const expectedV = payload.expectedVersion ?? payload.__v ?? payload.version;
  if (expectedV !== undefined && expectedV !== null && expectedV !== '') {
    const currentV = Number(doc?.__v);
    const givenV = Number(expectedV);
    if (Number.isFinite(currentV) && Number.isFinite(givenV) && currentV !== givenV) {
      throw ApiError.conflict('D? li?u d? �n d� thay d?i ? phi�n kh�c. Vui l�ng t?i l?i tru?c khi c?p nh?t.', 'CONFLICT', { currentVersion: currentV, expectedVersion: givenV });
    }
  }
  const expectedAt = payload.lastKnownUpdatedAt ?? payload.expectedUpdatedAt;
  if (expectedAt) {
    const currentAt = doc?.updatedAt ? new Date(doc.updatedAt).getTime() : NaN;
    const givenAt = new Date(expectedAt).getTime();
    if (Number.isFinite(currentAt) && Number.isFinite(givenAt) && currentAt !== givenAt) {
      throw ApiError.conflict('D? li?u d? �n d� thay d?i ? phi�n kh�c. Vui l�ng t?i l?i tru?c khi c?p nh?t.', 'CONFLICT', { currentUpdatedAt: doc?.updatedAt, expectedUpdatedAt: expectedAt });
    }
  }
};

const updateProject = async ({ projectId, userId, payload = {} }) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, userId);

  // ��ng bang d? �n: ch? s?a du?c khi DRAFT/NEED_REVISION
  projectMemberService.assertProjectEditable(project);
  assertOptimisticVersion(project, payload);

  const data = buildProjectData(payload);
  if (!Object.keys(data).length) {
    throw ApiError.badRequest('Kh�ng c� th�ng tin n�o d? c?p nh?t', 'NOTHING_TO_UPDATE');
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
  const { project } = await projectMemberService.assertProjectMember(projectId, actor.id);

  // ��ng bang d? �n: d� n?p/dang x�t duy?t th� kh�ng n?p l?i
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
const getProjectRevisions = async ({ projectId, userId }) => {
  const { project } = await projectMemberService.assertProjectMember(projectId, userId);
  const revisions = await ProjectRevision.find({ projectId: project._id }).sort({ versionNumber: -1 });
  return { project, revisions };
};

/** Lấy danh sách dự án của user (phân trang, lọc status) */
const getProjects = async ({ userId, page = 1, limit = 10, status }) => {
  const userMemberships = await ProjectMember.find({ userId, status: PROJECT_MEMBER_STATUS.ACCEPTED }).select('projectId').lean();
  const projectIds = userMemberships.map((m) => m.projectId);

  if (!projectIds.length) {
    return { projects: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const filter = { _id: { $in: projectIds } };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);

  return {
    projects,
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
  // Đồng bộ danh sách thành viên từ bảng ProjectMember (nguồn dữ liệu chính thức FR04)
  // vào trường members của object project trả về, đảm bảo API không bao giờ trả mảng rỗng khi DB có dữ liệu.
  const projectMembers = await ProjectMember.find({ projectId: project._id, status: 'ACCEPTED' })
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

  return { project, membership };
};

module.exports = {
  createProject,
  updateProject,
  submitProject,
  getProjectRevisions,
  getProjects,
  getProject,
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

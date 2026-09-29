const Project = require('../models/Project');
const ProjectRevision = require('../models/ProjectRevision');
const ProjectMember = require('../models/ProjectMember');
const ApiError = require('../utils/apiError');
const projectMemberService = require('./projectMemberService');
const { logAuditAction } = require('../utils/audit');
const {
  PROJECT_STATUS,
  MILESTONE_STATUS,
  PROJECT_CODE_PREFIX,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  AUDIT_ACTIONS,
  AUDIT_TARGETS,
} = require('../utils/constants');
const {
  isNonEmptyString,
  assertRequired,
  assertOptionalString,
  assertOptionalUrl,
  assertEnum,
} = require('../utils/validation');

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
};

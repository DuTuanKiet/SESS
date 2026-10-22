const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  PROJECT_STATUS,
  PROJECT_LEVEL,
  PROJECT_LEVEL_ORDER,
  PROJECT_MEMBER_STATUS,
} = require('../utils/constants');
const { assertObjectId, assertEnum } = require('../utils/validation');
const projectService = require('./projectService');

/**
 * ProjectHierarchyService - Thi đấu đa cấp (Parent-Child Projects) - Enterprise Edition.
 *
 * NGHIỆP VỤ:
 *   - Dự án gốc ở cấp KHOA (FACULTY) có thể được Hội đồng cấp Khoa đề xuất lên cấp
 *     TRƯỜNG (UNIVERSITY) / KHU VỰC (REGIONAL) / TOÀN QUỐC (NATIONAL).
 *   - Khi đề xuất, hệ thống TẠO DỰ ÁN CON mới với `parentId` trỏ về dự án gốc.
 *   - DỰ ÁN GỐC GIỮ NGUYÊN: trạng thái, version, tiến độ và bộ điểm của cấp hiện tại
 *     (không làm đứt gãy tiến độ).
 *   - DỰ ÁN CON BẮT ĐẦU ĐỘC LẬP: status = DRAFT, version = 1, tiến độ reset về PLANNED,
 *     không kế thừa bộ điểm/đánh giá của cấp trước.
 */

const MAX_HIERARCHY_DEPTH = 5;

/** Lấy dự án hoặc ném 404 */
const getProjectOrFail = async (projectId) => {
  assertObjectId(projectId, 'projectId');
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }
  return project;
};

/** Lấy gốc của chuỗi dự án (đi ngược lên parentId) */
const findRootProject = async (projectId) => {
  let current = await getProjectOrFail(projectId);
  let depth = 0;

  while (current.parentId && depth < MAX_HIERARCHY_DEPTH) {
    const parent = await Project.findById(current.parentId).lean();
    if (!parent) break;
    current = parent;
    depth += 1;
  }

  return current;
};

/**
 * Đề xuất thi vượt cấp: tạo dự án con ở cấp cao hơn.
 *
 * @param {object} params
 * @param {string} params.projectId Dự án gốc
 * @param {string} params.targetLevel Cấp đích (UNIVERSITY | REGIONAL | NATIONAL)
 * @param {object} params.actor       Admin/Hội đồng thực hiện
 */
const promoteProject = async ({ projectId, targetLevel, actor, req }) => {
  assertObjectId(projectId, 'projectId');
  assertEnum(targetLevel, Object.values(PROJECT_LEVEL), 'targetLevel', 'INVALID_PROJECT_LEVEL');

  const parent = await getProjectOrFail(projectId);

  const parentLevelIndex = PROJECT_LEVEL_ORDER.indexOf(parent.level);
  const targetLevelIndex = PROJECT_LEVEL_ORDER.indexOf(targetLevel);

  // Cấp đích phải CAO HƠN cấp hiện tại
  if (targetLevelIndex <= parentLevelIndex) {
    throw ApiError.badRequest(
      `Cấp đích "${targetLevel}" phải cao hơn cấp hiện tại "${parent.level}".`,
      'INVALID_PROMOTION_LEVEL',
      { currentLevel: parent.level, targetLevel, levelOrder: PROJECT_LEVEL_ORDER },
    );
  }

  // Không tạo trùng cấp cho cùng 1 dự án gốc
  const existingChild = await Project.findOne({
    parentId: parent._id,
    level: targetLevel,
  }).lean();
  if (existingChild) {
    throw ApiError.conflict(
      `Dự án đã có một bản thi ở cấp "${targetLevel}".`,
      'PROMOTION_ALREADY_EXISTS',
      { childProjectId: existingChild._id, childProjectCode: existingChild.code },
    );
  }

  // Dự án con: bắt đầu độc lập hoàn toàn ở cấp mới
  const child = await projectService.createProjectWithGeneratedCode({
    title: parent.title,
    name: parent.name,
    category: parent.category,
    field: parent.field,
    abstract: parent.abstract,
    description: parent.description,
    problemStatement: parent.problemStatement,
    solution: parent.solution,
    businessModel: parent.businessModel,
    attachmentUrl: parent.attachmentUrl,
    // Tiến độ độc lập: copy mốc tiến độ nhưng reset trạng thái về PLANNED
    milestones: (parent.milestones || []).map((milestone) => ({
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.dueDate,
      status: 'PLANNED',
    })),
    ownerId: parent.ownerId,
    members: parent.members,
    status: PROJECT_STATUS.DRAFT,
    version: 1,
    currentVersion: 1,
    parentId: parent._id,
    level: targetLevel,
    isLinked: true,
  });

  // Copy thành viên sang dự án con (giữ vai trò, không kế thừa tiến độ chấm điểm)
  const memberships = await ProjectMember.find({ projectId: parent._id }).lean();
  if (memberships.length) {
    await ProjectMember.insertMany(
      memberships.map((membership) => ({
        projectId: child._id,
        userId: membership.userId,
        role: membership.role,
        status:
          membership.status === PROJECT_MEMBER_STATUS.ACCEPTED
            ? PROJECT_MEMBER_STATUS.ACCEPTED
            : PROJECT_MEMBER_STATUS.INVITED,
        joinedAt: membership.joinedAt,
      })),
    );
  }

  // Đánh dấu dự án gốc là đang liên kết thi vượt cấp (giữ nguyên status/version)
  if (!parent.isLinked) {
    parent.isLinked = true;
    await parent.save();
  }

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.PROMOTE_PROJECT_LEVEL,
    targetEntity: AUDIT_ENTITIES.PROJECTS,
    targetId: child._id,
    oldValues: {
      parentProjectId: parent._id,
      parentProjectCode: parent.code,
      parentLevel: parent.level,
      parentStatus: parent.status,
      parentVersion: parent.version,
    },
    newValues: {
      childProjectId: child._id,
      childProjectCode: child.code,
      childLevel: child.level,
      childStatus: child.status,
      childVersion: child.version,
      targetLevel,
    },
    req,
  });

  return { parent, child, membershipsCopied: memberships.length };
};

/** Dựng node cây cho 1 dự án */
const buildNode = (project) => ({
  id: project._id,
  code: project.code,
  title: project.title || project.name,
  level: project.level,
  status: project.status,
  isLinked: Boolean(project.isLinked),
  parentId: project.parentId ?? null,
  version: project.version,
  children: [],
});

/**
 * Lấy cây sơ đồ dự án gốc & các nhánh thi vượt cấp liên quan.
 */
const getProjectHierarchy = async ({ projectId }) => {
  const root = await findRootProject(projectId);

  const nodes = new Map();
  nodes.set(String(root._id), buildNode(root));

  // BFS theo cha -> con
  let frontier = [root._id];
  let depth = 0;

  while (frontier.length && depth < MAX_HIERARCHY_DEPTH) {
    const children = await Project.find({ parentId: { $in: frontier } }).lean();
    if (!children.length) break;

    for (const child of children) {
      nodes.set(String(child._id), buildNode(child));
    }
    frontier = children.map((child) => child._id);
    depth += 1;
  }

  // Ghép cây
  for (const node of nodes.values()) {
    if (!node.parentId) continue;
    const parentNode = nodes.get(String(node.parentId));
    if (parentNode) parentNode.children.push(node);
  }

  const tree = nodes.get(String(root._id));

  return {
    root: {
      id: root._id,
      code: root.code,
      title: root.title || root.name,
      level: root.level,
      status: root.status,
      isLinked: Boolean(root.isLinked),
    },
    tree,
    totalProjects: nodes.size,
    levels: [...new Set([...nodes.values()].map((node) => node.level))],
  };
};

module.exports = {
  promoteProject,
  getProjectHierarchy,
  findRootProject,
  PROJECT_LEVEL_ORDER,
};

const Appeal = require('../models/Appeal');
const Project = require('../models/Project');
const EvaluationRound = require('../models/EvaluationRound');
const { logAuditAction } = require('../utils/audit');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, PROJECT_STATUS } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const projectMemberService = require('./projectMemberService');

async function createAppeal({ projectId, evaluationRoundId, roundId, reason, evidenceUrls, evidenceFiles, actor, req }) {
  if (!reason || String(reason).trim().length < 10) {
    throw ApiError.badRequest('Ly do phuc khao toi thieu 10 ky tu.', 'APPEAL_REASON_TOO_SHORT');
  }
  await projectMemberService.assertProjectMember(projectId, actor.id);
  const project = await Project.findById(projectId).lean();
  if (!project) throw ApiError.notFound('Khong tim thay du an', 'PROJECT_NOT_FOUND');
  const publishedRound = await EvaluationRound.findOne({ isPublished: true }).select('_id').lean().catch(() => null);
  const allowed = [PROJECT_STATUS.EVALUATED, PROJECT_STATUS.COMPLETED, PROJECT_STATUS.APPROVED, PROJECT_STATUS.REJECTED].includes(project.status) || !!publishedRound;
  if (!allowed) {
    throw ApiError.badRequest('Chi duoc gui phuc khao khi du an da duoc danh gia hoac vong thi da cong bo ket qua.', 'APPEAL_NOT_ALLOWED');
  }

  const appeal = await Appeal.create({
    projectId,
    evaluationRoundId: evaluationRoundId || roundId || null,
    submittedBy: actor.id || actor._id,
    reason: String(reason).trim(),
    evidenceUrls: Array.isArray(evidenceFiles) ? evidenceFiles.map((f)=>typeof f==='string'?f:f?.url||f?.fileUrl).filter(Boolean).slice(0,10) : (Array.isArray(evidenceUrls) ? evidenceUrls.filter(Boolean).slice(0,10) : []),
    status: 'PENDING',
  });
  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CREATE_APPEAL,
    targetEntity: AUDIT_ENTITIES.APPEALS,
    targetId: appeal._id,
    newValues: { projectId, evaluationRoundId: evaluationRoundId || roundId || null, status: appeal.status },
    req,
  });
  return appeal;
}

async function listAppeals({ status, projectId, page = 1, limit = 20, actor, requireMember = false } = {}) {
  if (requireMember && projectId && actor) await projectMemberService.assertProjectMember(projectId, actor.id);
  const q = {};
  if (status) q.status = status;
  if (projectId) q.projectId = projectId;
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const [items, total] = await Promise.all([
    Appeal.find(q).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).populate('projectId', 'code title status').populate('submittedBy', 'fullName email role').populate('reviewedBy', 'fullName email').lean(),
    Appeal.countDocuments(q),
  ]);
  return { items, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } };
}

async function reviewAppeal({ appealId, status, adminResponse, actor, req }) {
  const allowed = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Trang thai phuc khao khong hop le.', 'INVALID_APPEAL_STATUS');
  if (!adminResponse || String(adminResponse).trim().length < 5) throw ApiError.badRequest('Phan hoi Admin la bat buoc.', 'APPEAL_RESPONSE_REQUIRED');
  const appeal = await Appeal.findById(appealId);
  if (!appeal) throw ApiError.notFound('Khong tim thay yeu cau phuc khao', 'APPEAL_NOT_FOUND');
  const old = { status: appeal.status, adminResponse: appeal.adminResponse };
  appeal.status = status;
  appeal.adminResponse = String(adminResponse).trim();
  appeal.reviewedBy = actor.id || actor._id;
  appeal.reviewedAt = new Date();
  await appeal.save();
  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.REVIEW_APPEAL,
    targetEntity: AUDIT_ENTITIES.APPEALS,
    targetId: appeal._id,
    oldValues: old,
    newValues: { status: appeal.status, adminResponse: appeal.adminResponse },
    req,
  });
  return appeal;
}

module.exports = { createAppeal, listAppeals, reviewAppeal };

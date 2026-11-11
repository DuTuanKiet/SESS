const User = require('../models/User');
const Project = require('../models/Project');
const EvaluationRound = require('../models/EvaluationRound');
const ProjectMemberChangeRequest = require('../models/ProjectMemberChangeRequest');
const ProjectCancellationRequest = require('../models/ProjectCancellationRequest');
const Appeal = require('../models/Appeal');
const HumanEvaluation = require('../models/HumanEvaluation');
const MentorAssignment = require('../models/MentorAssignment');
const { PROJECT_STATUS } = require('../utils/constants');

function paged({ page = 1, limit = 20, maxLimit = 100 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(maxLimit, Math.max(1, Number(limit) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

async function getSummary() {
  const [userCount, roundCount, pendingMemberChanges, pendingCancellations, pendingAppeals, submittedEvaluations] = await Promise.all([
    User.countDocuments({}),
    EvaluationRound.countDocuments({}),
    ProjectMemberChangeRequest.countDocuments({ status: 'PENDING' }).catch(() => 0),
    ProjectCancellationRequest.countDocuments({ status: 'PENDING' }).catch(() => 0),
    Appeal.countDocuments({ status: { $in: ['PENDING', 'SUBMITTED', 'IN_REVIEW'] } }).catch(() => 0),
    HumanEvaluation.find({ status: 'SUBMITTED' }).select('projectId evaluationRoundId totalScore').lean().catch(() => []),
  ]);

  const byStatus = {};
  await Promise.all(Object.values(PROJECT_STATUS).map(async (st) => {
    byStatus[st] = await Project.countDocuments({ status: st }).catch(() => 0);
  }));

  let deviationCases = await Project.countDocuments({ needsAdminReview: true }).catch(() => 0);
  const groups = new Map();
  for (const e of submittedEvaluations) {
    const k = `${e.projectId}:${e.evaluationRoundId}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(Number(e.totalScore || 0));
  }
  for (const scores of groups.values()) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (scores.some((s) => Math.abs(s - avg) >= 2.5)) deviationCases += 1;
  }

  return {
    totals: { users: userCount, projects: await Project.countDocuments({}), rounds: roundCount },
    projectsByStatus: byStatus,
    pending: {
      memberChangeRequests: pendingMemberChanges,
      cancellationRequests: pendingCancellations,
      appeals: pendingAppeals,
      deviationCases,
    },
  };
}

async function listUsers(query = {}) {
  const { page, limit, skip } = paged(query);
  const { role, status, search, keyword } = query;
  const q = {};
  if (role) q.role = String(role).toUpperCase();
  if (status) q.status = String(status).toUpperCase();
  const term = search || keyword;
  if (term) {
    const re = new RegExp(String(term).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ fullName: re }, { email: re }, { studentId: re }];
  }
  const [items, total] = await Promise.all([
    User.find(q).select('-password -passwordHash -refreshTokens').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(q),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function listProjects(query = {}) {
  const { page, limit, skip } = paged(query);
  const { status, needsAdminReview, search, keyword } = query;
  const q = {};
  if (status) q.status = String(status).toUpperCase();
  if (needsAdminReview === 'true' || needsAdminReview === true) q.needsAdminReview = true;
  if (needsAdminReview === 'false' || needsAdminReview === false) q.needsAdminReview = false;
  const term = search || keyword;
  if (term) {
    const re = new RegExp(String(term).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ title: re }, { name: re }, { code: re }];
  }
  const [items, total] = await Promise.all([
    Project.find(q)
      .populate('ownerId', 'fullName email studentId role')
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(q),
  ]);

  const projectIds = items.map((p) => p._id);
  const [mentorAssignments, avgRows] = await Promise.all([
    // MentorAssignment.mentorId refs User (verified in backend/src/models/MentorAssignment.js)
    MentorAssignment.find({ projectId: { $in: projectIds } })
      .populate('mentorId', 'fullName email role')
      .sort({ status: 1, updatedAt: -1, createdAt: -1 })
      .lean()
      .catch(() => []),
    HumanEvaluation.aggregate([
      { $match: { projectId: { $in: projectIds }, status: 'SUBMITTED' } },
      { $group: { _id: '$projectId', averageScore: { $avg: '$totalScore' }, submittedCount: { $sum: 1 } } },
    ]).catch(() => []),
  ]);
  const mentorByProject = new Map();
  for (const a of mentorAssignments) {
    const k = String(a.projectId);
    if (mentorByProject.has(k)) continue; // keep first (ASSIGNED-ish / latest due to sort)
    const user = a.mentorId && typeof a.mentorId === 'object' ? a.mentorId : null;
    if (user) mentorByProject.set(k, { _id: user._id, fullName: user.fullName || '', email: user.email || '', role: user.role || 'MENTOR', assignmentStatus: a.status });
  }
  const avgByProject = new Map(avgRows.map((r) => [String(r._id), { averageScore: r.averageScore == null ? null : Math.round(r.averageScore * 100) / 100, submittedCount: r.submittedCount }]));

  const mapped = items.map((p) => {
    const k = String(p._id);
    const avg = avgByProject.get(k);
    return {
      ...p,
      leader: p.ownerId && typeof p.ownerId === 'object' ? p.ownerId : null,
      currentMentor: mentorByProject.get(k) || null,
      averageScore: avg?.averageScore ?? null,
      submittedEvaluationCount: avg?.submittedCount ?? 0,
    };
  });
  return { items: mapped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function listMemberChangeRequests(query = {}) {
  const { page, limit, skip } = paged(query);
  const { status = 'PENDING', type } = query;
  const q = {};
  if (status) q.status = String(status).toUpperCase();
  if (type) q.type = String(type).toUpperCase();
  const [items, total] = await Promise.all([
    ProjectMemberChangeRequest.find(q)
      .populate('projectId', 'code title name status needsAdminReview')
      .populate('requesterId', 'fullName email role')
      .populate('targetUserId', 'fullName email role')
      .populate('respondedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectMemberChangeRequest.countDocuments(q),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { getSummary, listUsers, listProjects, listMemberChangeRequests };

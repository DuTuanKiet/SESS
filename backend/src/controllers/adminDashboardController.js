const adminDashboardService = require('../services/adminDashboardService');
const AuditLog = require('../models/AuditLog');

async function handleDashboardSummary(req, res, next) {
  try {
    const data = await adminDashboardService.getSummary();
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function handleAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 20, action, targetEntity, targetId, actorId, from, to } = req.query;
    const q = {};
    if (action) q.action = action;
    if (targetEntity) q.targetEntity = targetEntity;
    if (targetId) q.targetId = targetId;
    if (actorId) q.actorId = actorId;
    if (from || to) {
      q.timestamp = {};
      if (from) q.timestamp.$gte = new Date(from);
      if (to) q.timestamp.$lte = new Date(to);
    }
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const [items, total] = await Promise.all([
      AuditLog.find(q).sort({ timestamp: -1, createdAt: -1 }).skip((p - 1) * l).limit(l).populate('actorId', 'fullName email role').lean(),
      AuditLog.countDocuments(q),
    ]);
    res.json({ success: true, data: { items, pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) } } });
  } catch (e) { next(e); }
}

async function handleListUsers(req, res, next) {
  try {
    const data = await adminDashboardService.listUsers(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function handleListProjects(req, res, next) {
  try {
    const data = await adminDashboardService.listProjects(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function handleListMemberChangeRequests(req, res, next) {
  try {
    const data = await adminDashboardService.listMemberChangeRequests(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  handleDashboardSummary,
  handleAuditLogs,
  handleListUsers,
  handleListProjects,
  handleListMemberChangeRequests,
};

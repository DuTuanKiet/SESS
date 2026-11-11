const appealService = require('../services/appealService');

async function handleCreateAppeal(req, res, next) {
  try {
    const appeal = await appealService.createAppeal({
      projectId: req.params.projectId,
      evaluationRoundId: req.body.evaluationRoundId || req.body.roundId,
      reason: req.body.reason,
      evidenceUrls: req.body.evidenceUrls,
      evidenceFiles: req.body.evidenceFiles,
      actor: req.user,
      req,
    });
    res.status(201).json({ success: true, message: 'Gui yeu cau phuc khao thanh cong.', data: appeal });
  } catch (e) { next(e); }
}

async function handleListAppeals(req, res, next) {
  try {
    const data = await appealService.listAppeals(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

async function handleReviewAppeal(req, res, next) {
  try {
    const appeal = await appealService.reviewAppeal({
      appealId: req.params.appealId,
      status: req.body.status,
      adminResponse: req.body.adminResponse || req.body.response,
      actor: req.user,
      req,
    });
    res.json({ success: true, message: 'Cap nhat phuc khao thanh cong.', data: appeal });
  } catch (e) { next(e); }
}

module.exports = { handleCreateAppeal, handleListAppeals, handleListProjectAppeals, handleReviewAppeal };

async function handleListProjectAppeals(req, res, next) {
  try {
    const data = await appealService.listAppeals({ ...req.query, projectId: req.params.projectId, actor: req.user, requireMember: true });
    res.json({ success: true, data });
  } catch (e) { next(e); }
}

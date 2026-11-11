const roundService = require('../services/evaluationRoundService');

async function handleCreateRound(req, res, next) {
  try { const data = await roundService.createRound(req.body, req.user, req); res.status(201).json({ success:true, data }); } catch(e){ next(e); }
}
async function handleUpdateRound(req, res, next) {
  try { const data = await roundService.updateRound(req.params.evaluationRoundId, req.body, req.user, req); res.json({ success:true, data }); } catch(e){ next(e); }
}
async function handleListRounds(req, res, next) {
  try { const data = await roundService.listRounds(req.query); res.json({ success:true, data }); } catch(e){ next(e); }
}
module.exports = { handleCreateRound, handleUpdateRound, handleListRounds };

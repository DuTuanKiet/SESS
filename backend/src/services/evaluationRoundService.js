const EvaluationRound = require('../models/EvaluationRound');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require('../utils/constants');
const ApiError = require('../utils/apiError');

function toDateOrNull(v) { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }

async function createRound(payload, actor, req) {
  const round = await EvaluationRound.create({
    roundNumber: payload.roundNumber,
    roundName: payload.roundName,
    rubricId: payload.rubricId,
    status: payload.status || 'OPEN',
    stageType: payload.stageType || 'OTHER',
    description: payload.description || '',
    submissionOpenAt: toDateOrNull(payload.submissionOpenAt),
    submissionCloseAt: toDateOrNull(payload.submissionCloseAt),
    scoringOpenAt: toDateOrNull(payload.scoringOpenAt),
    scoringCloseAt: toDateOrNull(payload.scoringCloseAt),
    isActive: payload.isActive !== false,
    isPublished: payload.isPublished === true,
    publishedAt: payload.isPublished === true ? new Date() : null,
    createdBy: actor?.id || actor?._id || null,
    updatedBy: actor?.id || actor?._id || null,
  });
  await createAuditLog({
    userId: actor?.id || actor?._id,
    action: AUDIT_ACTIONS.STAGE_WINDOW_CHANGED,
    targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
    targetId: round._id,
    oldValues: null,
    newValues: round.toObject(),
    req,
  });
  return round;
}

async function updateRound(roundId, payload, actor, req) {
  const round = await EvaluationRound.findById(roundId);
  if (!round) throw ApiError.notFound('Khong tim thay vong thi/dot danh gia', 'EVALUATION_ROUND_NOT_FOUND');
  const old = round.toObject();
  const fields = ['roundName','rubricId','status','stageType','description','isActive','isPublished'];
  for (const f of fields) if (payload[f] !== undefined) round[f] = payload[f];
  if (payload.isPublished === true && !round.publishedAt) round.publishedAt = new Date();
  if (payload.isPublished === false) round.publishedAt = null;
  for (const f of ['submissionOpenAt','submissionCloseAt','scoringOpenAt','scoringCloseAt']) {
    if (payload[f] !== undefined) round[f] = toDateOrNull(payload[f]);
  }
  if (payload.roundNumber !== undefined) round.roundNumber = payload.roundNumber;
  round.updatedBy = actor?.id || actor?._id || null;
  await round.save();
  await createAuditLog({
    userId: actor?.id || actor?._id,
    action: AUDIT_ACTIONS.STAGE_WINDOW_CHANGED,
    targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
    targetId: round._id,
    oldValues: { status: old.status, submissionOpenAt: old.submissionOpenAt, submissionCloseAt: old.submissionCloseAt, scoringOpenAt: old.scoringOpenAt, scoringCloseAt: old.scoringCloseAt, stageType: old.stageType },
    newValues: { status: round.status, submissionOpenAt: round.submissionOpenAt, submissionCloseAt: round.submissionCloseAt, scoringOpenAt: round.scoringOpenAt, scoringCloseAt: round.scoringCloseAt, stageType: round.stageType },
    req,
  });
  return round;
}

async function listRounds(query = {}) {
  const q = {};
  if (query.status) q.status = query.status;
  if (query.stageType) q.stageType = query.stageType;
  if (query.isActive !== undefined) q.isActive = String(query.isActive) === 'true';
  return EvaluationRound.find(q).sort({ roundNumber: -1, createdAt: -1 }).lean();
}

module.exports = { createRound, updateRound, listRounds };

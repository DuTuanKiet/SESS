const mongoose = require('mongoose');
const EvaluationSubmission = require('../models/EvaluationSubmission');
const EvaluationRound = require('../models/EvaluationRound');
const EvaluationRubric = require('../models/EvaluationRubric');
const HumanEvaluation = require('../models/HumanEvaluation');
const Project = require('../models/Project');
const { createAuditLog } = require('./auditService');
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require('../utils/constants');

const MAX_GROUP_DETAILS = 50;

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function scoreKey(projectId, rubricId, judgeId) {
  return `${String(projectId)}::${String(rubricId)}::${String(judgeId)}`;
}

function pushCapped(list, item, max = MAX_GROUP_DETAILS) {
  if (list.length < max) list.push(item);
}

async function resolveRoundForMigration({ rubricId, dryRun }) {
  if (!mongoose.Types.ObjectId.isValid(rubricId)) {
    return { round: null, wouldCreateFallbackRound: false, fallbackRoundName: null };
  }

  let round = await EvaluationRound.findOne({ rubricId, status: 'OPEN' })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  if (round) return { round, wouldCreateFallbackRound: false, fallbackRoundName: null };

  round = await EvaluationRound.findOne({ rubricId }).sort({ updatedAt: -1, createdAt: -1 }).lean();
  if (round) return { round, wouldCreateFallbackRound: false, fallbackRoundName: null };

  const fallbackName = `LEGACY-RUBRIC-${String(rubricId).slice(-6)}`;
  round = await EvaluationRound.findOne({ roundName: fallbackName, rubricId }).lean();
  if (round) return { round, wouldCreateFallbackRound: false, fallbackRoundName: null };

  if (dryRun) {
    return {
      round: null,
      wouldCreateFallbackRound: true,
      fallbackRoundName: fallbackName,
      simulatedRound: { _id: null, roundName: fallbackName, rubricId, status: 'CLOSED', simulated: true },
    };
  }

  const created = await EvaluationRound.create({
    roundNumber: 0,
    roundName: fallbackName,
    rubricId,
    status: 'CLOSED',
  });
  return { round: created.toObject ? created.toObject() : created, wouldCreateFallbackRound: false, fallbackRoundName: fallbackName };
}

function buildScores(submissions, criteriaById) {
  const scores = [];
  const unmappedCriterionIds = [];
  for (const item of submissions) {
    const criterionId = String(item.criterionId);
    const criterion = criteriaById.get(criterionId);
    if (!criterion) {
      if (!unmappedCriterionIds.includes(criterionId)) unmappedCriterionIds.push(criterionId);
      continue;
    }
    scores.push({
      criterionId,
      score: Number(item.score),
      comment: typeof item.comment === 'string' ? item.comment : '',
    });
  }
  return { scores, unmappedCriterionIds };
}

function computeTotal(scores, criteriaById) {
  let total = 0;
  for (const item of scores) {
    const criterion = criteriaById.get(String(item.criterionId));
    if (!criterion) continue;
    total += (Number(item.score) * Number(criterion.weight || 0)) / 100;
  }
  return round2(total);
}

/**
 * Migrate legacy EvaluationSubmission (criterion-level rows) -> HumanEvaluation (unified pipeline).
 * Safe by default for API usage: caller should pass dryRun=true for production/staging checks.
 *
 * dryRun=true:
 * - Scans and simulates mappings
 * - DOES NOT create/update HumanEvaluation
 * - DOES NOT update EvaluationSubmission migration flags
 * - DOES NOT create EvaluationRound fallbacks
 * - DOES NOT write AuditLog
 */
async function migrateLegacyEvaluationSubmissions({ actor = null, req = null, dryRun = false, limit = 0 } = {}) {
  const safeDryRun = Boolean(dryRun);
  const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 0;

  console.info('[evaluationMigrationService] start', {
    dryRun: safeDryRun,
    limit: safeLimit,
    actorId: actor?.id || actor?._id || null,
  });

  const query = { migratedToHumanEval: { $ne: true } };
  const legacySubmissions = await EvaluationSubmission.find(query)
    .sort({ projectId: 1, rubricId: 1, judgeId: 1, submittedAt: 1, createdAt: 1 })
    .limit(safeLimit)
    .lean();

  const report = {
    mode: safeDryRun ? 'dry-run' : 'execute',
    dryRun: safeDryRun,
    scannedLegacyRows: legacySubmissions.length,
    groupedEvaluations: 0,
    migratedLegacyRows: 0,
    skippedLegacyRows: 0,
    humanEvaluationsToCreate: 0,
    humanEvaluationsToUpdate: 0,
    humanEvaluationsCreated: 0,
    humanEvaluationsUpdated: 0,
    fallbackRoundsToCreate: 0,
    errors: [],
    groups: [],
    startedAt: new Date().toISOString(),
  };

  if (!legacySubmissions.length) {
    report.finishedAt = new Date().toISOString();
    report.message = 'No unmigrated legacy EvaluationSubmission rows found.';
    return report;
  }

  const grouped = new Map();
  for (const submission of legacySubmissions) {
    const key = scoreKey(submission.projectId, submission.rubricId, submission.judgeId);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(submission);
  }
  report.groupedEvaluations = grouped.size;

  const rubricCache = new Map();
  const roundCache = new Map();

  for (const [key, rows] of grouped.entries()) {
    try {
      const sample = rows[0];
      const { projectId, rubricId, judgeId } = sample;
      const groupDetail = {
        key,
        projectId: String(projectId),
        rubricId: String(rubricId),
        evaluatorId: String(judgeId),
        legacyRowCount: rows.length,
        action: 'pending',
        warnings: [],
      };

      const project = await Project.findById(projectId).select('_id title name code').lean();
      if (!project) {
        report.skippedLegacyRows += rows.length;
        groupDetail.action = 'skipped';
        groupDetail.reason = 'PROJECT_NOT_FOUND';
        pushCapped(report.errors, { key, type: 'PROJECT_NOT_FOUND', projectId: String(projectId), rows: rows.length });
        pushCapped(report.groups, groupDetail);
        continue;
      }

      if (!rubricCache.has(String(rubricId))) {
        rubricCache.set(String(rubricId), await EvaluationRubric.findById(rubricId).lean());
      }
      const rubric = rubricCache.get(String(rubricId));
      if (!rubric || !Array.isArray(rubric.criteria) || rubric.criteria.length === 0) {
        report.skippedLegacyRows += rows.length;
        groupDetail.action = 'skipped';
        groupDetail.reason = 'RUBRIC_NOT_FOUND_OR_EMPTY';
        pushCapped(report.errors, { key, type: 'RUBRIC_NOT_FOUND_OR_EMPTY', rubricId: String(rubricId), rows: rows.length });
        pushCapped(report.groups, groupDetail);
        continue;
      }

      const roundCacheKey = String(rubricId);
      if (!roundCache.has(roundCacheKey)) {
        roundCache.set(roundCacheKey, await resolveRoundForMigration({ rubricId, dryRun: safeDryRun }));
      }
      const roundResolution = roundCache.get(roundCacheKey);
      if (roundResolution.wouldCreateFallbackRound) {
        report.fallbackRoundsToCreate += 1;
        groupDetail.warnings.push(`Would create fallback EvaluationRound ${roundResolution.fallbackRoundName}`);
      }
      const round = roundResolution.round || roundResolution.simulatedRound;
      if (!round) {
        report.skippedLegacyRows += rows.length;
        groupDetail.action = 'skipped';
        groupDetail.reason = 'EVALUATION_ROUND_UNRESOLVED';
        pushCapped(report.errors, { key, type: 'EVALUATION_ROUND_UNRESOLVED', rubricId: String(rubricId), rows: rows.length });
        pushCapped(report.groups, groupDetail);
        continue;
      }

      const criteriaById = new Map(rubric.criteria.map((criterion) => [String(criterion._id), criterion]));
      const { scores, unmappedCriterionIds } = buildScores(rows, criteriaById);
      if (unmappedCriterionIds.length) {
        groupDetail.warnings.push(`Unmapped criterionIds: ${unmappedCriterionIds.join(', ')}`);
      }
      if (!scores.length) {
        report.skippedLegacyRows += rows.length;
        groupDetail.action = 'skipped';
        groupDetail.reason = 'NO_MAPPABLE_SCORES';
        pushCapped(report.errors, { key, type: 'NO_MAPPABLE_SCORES', rows: rows.length });
        pushCapped(report.groups, groupDetail);
        continue;
      }

      const totalScore = computeTotal(scores, criteriaById);
      const submittedRows = rows.filter((row) => row.submittedAt || row.createdAt);
      const hasAllCriteria = scores.length >= rubric.criteria.length;
      const status = hasAllCriteria && submittedRows.length > 0 ? 'SUBMITTED' : 'DRAFT';
      const submittedAt =
        status === 'SUBMITTED'
          ? new Date(Math.max(...submittedRows.map((row) => new Date(row.submittedAt || row.createdAt).getTime()))).toISOString()
          : null;
      const generalFeedback = rows.map((row) => row.comment?.trim()).filter(Boolean).slice(0, 3).join('\n---\n');

      const existing = round._id
        ? await HumanEvaluation.findOne({
            evaluationRoundId: round._id,
            projectId,
            evaluatorId: judgeId,
          })
            .select('_id status totalScore rubricVersionId')
            .lean()
        : null;

      groupDetail.mapping = {
        targetModel: 'HumanEvaluation',
        evaluationRoundId: round._id ? String(round._id) : null,
        evaluationRoundName: round.roundName || null,
        evaluationRoundSimulated: Boolean(round.simulated),
        projectId: String(projectId),
        evaluatorId: String(judgeId),
        rubricVersionId: String(rubric._id),
        scoresCount: scores.length,
        criteriaCount: rubric.criteria.length,
        totalScore,
        status,
        submittedAt,
        existingHumanEvaluationId: existing?._id ? String(existing._id) : null,
        generalFeedbackPreview: generalFeedback ? generalFeedback.slice(0, 200) : '',
      };

      if (safeDryRun) {
        report.migratedLegacyRows += rows.length; // simulated success
        if (existing) {
          report.humanEvaluationsToUpdate += 1;
          groupDetail.action = 'would_update_human_evaluation';
        } else {
          report.humanEvaluationsToCreate += 1;
          groupDetail.action = 'would_create_human_evaluation';
        }
        pushCapped(report.groups, groupDetail);
        continue;
      }

      if (!round._id) {
        throw new Error('Cannot execute migration without a persisted EvaluationRound');
      }

      let humanEvaluation;
      if (existing?._id) {
        humanEvaluation = await HumanEvaluation.findById(existing._id);
        if (!humanEvaluation) throw new Error('Existing HumanEvaluation disappeared during migration');
        humanEvaluation.rubricVersionId = rubric._id;
        humanEvaluation.scores = scores.map((item) => ({
          criterionId: item.criterionId,
          score: item.score,
          comment: item.comment,
        }));
        humanEvaluation.totalScore = totalScore;
        if (!humanEvaluation.generalFeedback && generalFeedback) humanEvaluation.generalFeedback = generalFeedback;
        if (status === 'SUBMITTED') {
          humanEvaluation.status = 'SUBMITTED';
          humanEvaluation.submittedAt = submittedAt ? new Date(submittedAt) : humanEvaluation.submittedAt || new Date();
        }
        await humanEvaluation.save();
        report.humanEvaluationsUpdated += 1;
        groupDetail.action = 'updated_human_evaluation';
      } else {
        humanEvaluation = await HumanEvaluation.create({
          evaluationRoundId: round._id,
          projectId,
          evaluatorId: judgeId,
          rubricVersionId: rubric._id,
          scores: scores.map((item) => ({
            criterionId: item.criterionId,
            score: item.score,
            comment: item.comment,
          })),
          totalScore,
          generalFeedback,
          status,
          submittedAt: submittedAt ? new Date(submittedAt) : null,
        });
        report.humanEvaluationsCreated += 1;
        groupDetail.action = 'created_human_evaluation';
      }

      await EvaluationSubmission.updateMany(
        { _id: { $in: rows.map((row) => row._id) } },
        {
          $set: {
            migratedToHumanEval: true,
            migratedAt: new Date(),
            migratedHumanEvaluationId: humanEvaluation._id,
          },
        },
      );

      await createAuditLog({
        userId: actor?._id || actor?.id || actor || null,
        action: AUDIT_ACTIONS.MIGRATE_EVALUATION_SUBMISSION,
        targetEntity: AUDIT_ENTITIES.EVALUATION_SUBMISSIONS,
        targetId: humanEvaluation._id,
        oldValues: { legacySubmissionCount: rows.length, legacyKey: key },
        newValues: {
          humanEvaluationId: humanEvaluation._id,
          evaluationRoundId: round._id,
          projectId,
          evaluatorId: judgeId,
          rubricVersionId: rubric._id,
          totalScore,
          status,
        },
        req,
      });

      report.migratedLegacyRows += rows.length;
      groupDetail.humanEvaluationId = String(humanEvaluation._id);
      pushCapped(report.groups, groupDetail);
    } catch (error) {
      report.skippedLegacyRows += rows.length;
      const errItem = { key, type: 'GROUP_MIGRATION_ERROR', message: error.message, rows: rows.length };
      pushCapped(report.errors, errItem);
      console.error('[evaluationMigrationService] group error', errItem);
    }
  }

  report.finishedAt = new Date().toISOString();
  report.success = report.errors.length === 0;
  report.note = safeDryRun
    ? 'Dry-run completed. No database writes were performed (no HumanEvaluation upserts, no EvaluationSubmission flag updates, no fallback EvaluationRound creation, no migration audit logs).'
    : 'Migration execution completed. Review errors/skipped groups before deprecating legacy endpoints.';
  console.info('[evaluationMigrationService] finished', {
    dryRun: safeDryRun,
    scanned: report.scannedLegacyRows,
    migrated: report.migratedLegacyRows,
    skipped: report.skippedLegacyRows,
    errors: report.errors.length,
  });

  return report;
}

module.exports = {
  migrateLegacyEvaluationSubmissions,
};
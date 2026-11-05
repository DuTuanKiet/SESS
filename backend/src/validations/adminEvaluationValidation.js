const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ');

const assignJudgeBodySchema = z.object({
  evaluationRoundId: objectIdSchema,
  projectId: objectIdSchema,
  evaluatorId: objectIdSchema,
  rubricVersionId: objectIdSchema.optional(),
});

const roundParamsSchema = z.object({
  evaluationRoundId: objectIdSchema,
});

const migrateLegacyEvaluationsBodySchema = z.object({
  dryRun: z.boolean().optional().default(true),
  limit: z.number().int().min(0).max(5000).optional().default(0),
});

module.exports = {
  assignJudgeBodySchema,
  roundParamsSchema,
  migrateLegacyEvaluationsBodySchema,
};
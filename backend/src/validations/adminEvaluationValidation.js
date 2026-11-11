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

const createRoundBodySchema = z.object({
  roundNumber: z.number().int().min(1),
  roundName: z.string().min(1),
  rubricId: objectIdSchema,
  status: z.enum(['OPEN','CLOSED']).optional(),
  stageType: z.enum(['PRELIM','SEMI','FINAL','OTHER']).optional(),
  description: z.string().optional(),
  submissionOpenAt: z.string().datetime().nullable().optional().or(z.string().optional()),
  submissionCloseAt: z.string().datetime().nullable().optional().or(z.string().optional()),
  scoringOpenAt: z.string().datetime().nullable().optional().or(z.string().optional()),
  scoringCloseAt: z.string().datetime().nullable().optional().or(z.string().optional()),
  isActive: z.boolean().optional(),
});

const updateRoundBodySchema = createRoundBodySchema.partial().refine((v)=>Object.keys(v).length>0,{message:'Khong co du lieu cap nhat'});

module.exports = {
  assignJudgeBodySchema,
  roundParamsSchema,
  migrateLegacyEvaluationsBodySchema,
  createRoundBodySchema,
  updateRoundBodySchema,
};
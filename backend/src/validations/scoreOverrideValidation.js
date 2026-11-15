const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const createScoreOverrideBodySchema = z.object({
  rubricId: objectIdSchema,
  criterionId: objectIdSchema,
  projectId: objectIdSchema,
  overriddenScore: z.coerce.number().finite(),
  originalScore: z.coerce.number().finite().optional(),
  reason: z.string().trim().min(5, 'Lý do điều chỉnh điểm là bắt buộc.').max(1000),
}).passthrough();

const scoreOverrideQuerySchema = z.object({
  projectId: objectIdSchema.optional(),
  rubricId: objectIdSchema.optional(),
  status: z.string().trim().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).passthrough();

const revokeScoreOverrideParamsSchema = z.object({ overrideId: objectIdSchema });

const revokeScoreOverrideBodySchema = z.object({
  revokeReason: z.string().trim().min(5, 'Lý do thu hồi là bắt buộc.').max(1000),
}).passthrough();

module.exports = {
  createScoreOverrideBodySchema,
  scoreOverrideQuerySchema,
  revokeScoreOverrideParamsSchema,
  revokeScoreOverrideBodySchema,
};

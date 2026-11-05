const { z } = require('zod');

const objectIdSchema = z
  .string({ required_error: 'ID là bắt buộc.' })
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId.' });

const evaluationIdParamsSchema = z.object({
  evaluationId: objectIdSchema,
});

const scoreItemSchema = z.object({
  criterionId: objectIdSchema,
  score: z.union([z.number(), z.null()]).optional(),
  comment: z.string().trim().max(2000, 'Nhận xét tiêu chí không được vượt quá 2000 ký tự.').optional().default(''),
});

const submitEvaluationBodySchema = z.object({
  scores: z.array(scoreItemSchema).default([]),
  generalFeedback: z.string().trim().max(4000, 'Nhận xét chung không được vượt quá 4000 ký tự.').optional().default(''),
  actionType: z.enum(['DRAFT', 'SUBMIT']).optional().default('DRAFT'),
});

module.exports = {
  evaluationIdParamsSchema,
  submitEvaluationBodySchema,
};
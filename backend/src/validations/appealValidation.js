const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const projectAppealParamsSchema = z.object({ projectId: objectIdSchema });
const reviewAppealParamsSchema = z.object({ appealId: objectIdSchema });

const createAppealBodySchema = z.object({
  evaluationRoundId: objectIdSchema.optional(),
  roundId: objectIdSchema.optional(),
  reason: z.string().trim().min(10, 'Lý do phúc khảo phải có ít nhất 10 ký tự.').max(2000),
  evidenceUrls: z.array(z.string().url('URL bằng chứng không hợp lệ.')).max(20).optional(),
  evidenceFiles: z.array(z.string().trim().min(1)).max(20).optional(),
}).strict().refine((d) => d.evaluationRoundId || d.roundId, {
  message: 'Thiếu evaluationRoundId/roundId.',
  path: ['evaluationRoundId'],
});

const listAppealsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().trim().optional(),
  projectId: objectIdSchema.optional(),
}).passthrough();

const reviewAppealBodySchema = z.object({
  status: z.string().trim().min(1, 'Trạng thái phúc khảo là bắt buộc.'),
  adminResponse: z.string().trim().max(2000).optional(),
  response: z.string().trim().max(2000).optional(),
}).strict().refine((d) => d.adminResponse || d.response, {
  message: 'Thiếu nội dung phản hồi (adminResponse/response).',
  path: ['adminResponse'],
});

module.exports = {
  projectAppealParamsSchema,
  reviewAppealParamsSchema,
  createAppealBodySchema,
  listAppealsQuerySchema,
  reviewAppealBodySchema,
};

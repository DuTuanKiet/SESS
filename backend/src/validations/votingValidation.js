const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const voteProjectParamsSchema = z.object({ projectId: objectIdSchema });

const castVoteBodySchema = z.object({
  projectId: objectIdSchema,
  option: z.string().trim().min(1, 'Lựa chọn bình chọn là bắt buộc.').max(100),
  comment: z.string().trim().max(1000).optional(),
}).passthrough();

module.exports = { voteProjectParamsSchema, castVoteBodySchema };

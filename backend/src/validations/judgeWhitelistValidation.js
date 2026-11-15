const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const judgeWhitelistIdParamsSchema = z.object({ id: objectIdSchema });

const getJudgeWhitelistQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).refine((v) => v >= 1, 'page >= 1.'),
  limit: z.string().optional().default('20').transform(Number).refine((v) => v >= 1 && v <= 100, 'limit 1-100.'),
  keyword: z.string().optional(),
  faculty: z.string().optional(),
}).passthrough();

module.exports = { judgeWhitelistIdParamsSchema, getJudgeWhitelistQuerySchema };

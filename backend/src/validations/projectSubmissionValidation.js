const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID dự án không đúng định dạng ObjectId.');

const projectSubmissionParamsSchema = z.object({ id: objectIdSchema });

const submissionUrlSchema = z.string().trim()
  .url('URL nộp bài không hợp lệ.')
  .refine((value) => /^https?:\/\//i.test(value), 'URL nộp bài phải dùng HTTP hoặc HTTPS.');

const submissionItemSchema = z.object({
  url: submissionUrlSchema.or(z.literal('')).optional(),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  mimeType: z.string().trim().max(150).optional(),
  objectKey: z.string().trim().max(1024).optional(),
}).nullable();

const updateProjectSubmissionsBodySchema = z.object({
  roundId: z.string().trim().min(1).max(100),
  items: z.object({
    pitchDeck: submissionItemSchema.optional(),
    demoVideo: submissionItemSchema.optional(),
    sourceCode: submissionItemSchema.optional(),
    businessModel: submissionItemSchema.optional(),
  }).strict().refine((items) => Object.keys(items).length > 0, {
    message: 'Cần cập nhật ít nhất một hạng mục.',
  }),
}).strict();

module.exports = {
  projectSubmissionParamsSchema,
  updateProjectSubmissionsBodySchema,
};

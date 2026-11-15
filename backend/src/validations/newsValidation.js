const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const newsIdParamsSchema = z.object({ id: objectIdSchema });
const newsIdOrSlugParamsSchema = z.object({ idOrSlug: z.string().trim().min(1, 'Thiếu id/slug.').max(200) });

const newsListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().trim().max(120).optional(),
}).passthrough();

const createNewsBodySchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề tin tức là bắt buộc.').max(300),
  slug: z.string().trim().max(300).optional(),
  summary: z.string().trim().max(2000).optional(),
  content: z.string().trim().max(50000).optional(),
  thumbnailUrl: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(120).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

const updateNewsBodySchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  slug: z.string().trim().max(300).optional(),
  summary: z.string().trim().max(2000).optional(),
  content: z.string().trim().max(50000).optional(),
  thumbnailUrl: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(120).optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.union([z.string(), z.date(), z.null()]).optional(),
}).passthrough().refine((d) => Object.keys(d).length > 0, {
  message: 'Cần có ít nhất một trường cần cập nhật.',
});

module.exports = {
  newsIdParamsSchema,
  newsIdOrSlugParamsSchema,
  newsListQuerySchema,
  createNewsBodySchema,
  updateNewsBodySchema,
};

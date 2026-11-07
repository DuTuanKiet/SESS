const { z } = require('zod');
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ.');
const notificationQuerySchema = z.object({
  // Không default status trước khi service xử lý, để unreadOnly của dev còn hiệu lực.
  status: z.enum(['all', 'unread']).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('20').transform(Number).pipe(z.number().int().min(1).max(100)),
});
const notificationIdParamsSchema = z.object({ id: objectIdSchema });
const internalLink = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith('/') && !decoded.startsWith('//') && !/[\\\r\n]/.test(decoded);
  } catch { return false; }
}, 'Đường dẫn thông báo phải nằm trong hệ thống.');
const notificationBodySchema = z.object({
  recipientId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  recipientRole: z.enum(['judge', 'admin', 'mentor', 'teacher', 'student']).optional(),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(1000).optional(),
  content: z.string().trim().min(1).max(1000).optional(),
  type: z.string().trim().min(1).max(40).optional().default('info'),
  actionUrl: internalLink.optional(),
  link: internalLink.optional(),
  relatedEvaluationId: objectIdSchema.nullable().optional(),
  relatedProjectId: objectIdSchema.nullable().optional(),
}).refine((body) => Boolean(body.recipientId || body.userId), 'Thiếu người nhận.')
  .refine((body) => Boolean(body.message || body.content), 'Thiếu nội dung.')
  .refine((body) => !body.recipientId || !body.userId || body.recipientId === body.userId,
    'Người nhận không nhất quán.');
module.exports = { notificationQuerySchema, notificationIdParamsSchema, notificationBodySchema };

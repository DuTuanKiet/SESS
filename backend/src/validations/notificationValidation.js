const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID thông báo không hợp lệ.' });

const notificationQuerySchema = z.object({
  status: z.enum(['all', 'unread']).optional().default('all'),
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(50)),
});

const notificationIdParamsSchema = z.object({ id: objectIdSchema });

module.exports = { notificationQuerySchema, notificationIdParamsSchema };

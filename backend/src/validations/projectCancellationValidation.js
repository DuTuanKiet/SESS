const { z } = require('zod');
const { PROJECT_CANCELLATION_STATUS } = require('../utils/constants');

/**
 * Zod validation schemas cho quy trình hủy dự án có bằng chứng.
 */

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const paginationSchema = {
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v >= 1, { message: 'page phải là số nguyên >= 1.' }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 100, {
      message: 'limit phải là số nguyên trong khoảng 1-100.',
    }),
};

/** Params: /projects/:projectId/cancellation-requests */
const projectCancellationParamsSchema = z.object({
  projectId: objectIdSchema,
});

/** Params: /projects/cancellation-requests/:requestId/review */
const cancellationReviewParamsSchema = z.object({
  requestId: objectIdSchema,
});

/** Body: tạo yêu cầu hủy dự án */
const createCancellationRequestBodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(20, { message: 'Lý do hủy dự án phải có tối thiểu 20 ký tự.' })
    .max(2000, { message: 'Lý do hủy dự án không được vượt quá 2000 ký tự.' }),
  evidenceFiles: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(200),
        fileUrl: z.string().trim().url({ message: 'fileUrl phải là URL hợp lệ.' }).max(1000),
        uploadedAt: z.coerce.date().optional(),
      }),
    )
    .max(10, { message: 'Chỉ được tải lên tối đa 10 tệp bằng chứng.' })
    .optional()
    .default([]),
});

/** Query: danh sách yêu cầu hủy (Admin) */
const listCancellationRequestsQuerySchema = z.object({
  status: z.nativeEnum(PROJECT_CANCELLATION_STATUS).optional(),
  projectId: objectIdSchema.optional(),
  ...paginationSchema,
});

/** Body: Admin duyệt / từ chối yêu cầu hủy */
const reviewCancellationRequestBodySchema = z.object({
  decision: z.enum([PROJECT_CANCELLATION_STATUS.APPROVED, PROJECT_CANCELLATION_STATUS.REJECTED], {
    errorMap: () => ({ message: 'decision phải là APPROVED hoặc REJECTED.' }),
  }),
  reviewNote: z
    .string()
    .trim()
    .min(5, { message: 'Ghi chú xử lý phải có tối thiểu 5 ký tự.' })
    .max(1000, { message: 'Ghi chú xử lý không được vượt quá 1000 ký tự.' }),
});

module.exports = {
  projectCancellationParamsSchema,
  cancellationReviewParamsSchema,
  createCancellationRequestBodySchema,
  listCancellationRequestsQuerySchema,
  reviewCancellationRequestBodySchema,
};

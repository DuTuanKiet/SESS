const { z } = require('zod');
const { PROJECT_STATUS } = require('../utils/constants');

/**
 * Zod validation schemas cho phân hệ Dự án (Project).
 */

// Schema validate ObjectId MongoDB (24 ký tự hex)
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

// Schema query lọc danh sách dự án chưa được phân công mentor
const getUnassignedProjectsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((v) => v >= 1, { message: 'page phải >= 1.' }),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .refine((v) => v >= 1 && v <= 100, { message: 'limit phải trong khoảng 1-100.' }),
  field: z.string().optional(),
  keyword: z.string().optional(),
});

// Schema params cập nhật trạng thái dự án
const updateProjectStatusParamsSchema = z.object({
  projectId: objectIdSchema,
});

// Schema body cập nhật trạng thái dự án
const updateProjectStatusBodySchema = z.object({
  status: z.nativeEnum(PROJECT_STATUS, {
    errorMap: () => ({
      message: `Trạng thái không hợp lệ. Cho phép: ${Object.values(PROJECT_STATUS).join(', ')}`,
    }),
  }),
  note: z.string().trim().max(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' }).optional(),
});

module.exports = {
  getUnassignedProjectsQuerySchema,
  updateProjectStatusParamsSchema,
  updateProjectStatusBodySchema,
};


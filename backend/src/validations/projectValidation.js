const { z } = require('zod');
const { PROJECT_STATUS } = require('../utils/constants');

/**
 * Zod validation schemas cho phân hệ Dự án (Project).
 */

// Schema validate ObjectId MongoDB (24 ký tự hex)
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'ID không đúng định dạng ObjectId (24 ký tự hex).' });

const projectParamsSchema = z.object({ id: objectIdSchema });

const listProjectsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
  status: z.enum([...Object.values(PROJECT_STATUS), 'ACTIVE']).optional(),
});

const advisorInfoSchema = z.object({
  hasAdvisor: z.boolean().optional().default(true),
  fullName: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val ?? ''),
    z.string().min(1, 'Họ và tên giảng viên hướng dẫn là bắt buộc.').max(200)
  ),
  email: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val ?? ''),
    z.string().email('Email giảng viên không đúng định dạng.').max(254)
  ),
  phone: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val ?? ''), z.string().max(30).optional()),
  department: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val ?? ''), z.string().min(1, 'Đơn vị công tác của giảng viên là bắt buộc.').max(200).optional()),
  unit: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val ?? ''), z.string().max(200).optional()),
  academicRank: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val ?? ''), z.string().max(100).optional()),
}).strict();

const leaderInfoSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  studentId: z.string().trim().max(50).optional(),
  className: z.string().trim().max(100).optional(),
  faculty: z.string().trim().max(200).optional(),
  email: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val ?? ''),
    z.union([z.string().email('Email trưởng nhóm không đúng định dạng.').max(254), z.literal('')]).optional()
  ),
  phone: z.string().trim().max(30).optional(),
  courseYear: z.string().trim().max(100).optional(),
}).strict();

const projectBodySchema = z.object({
  title: z.string().trim().min(1, 'Tên sản phẩm / ý tưởng dự án không được để trống.').max(200).optional(),
  category: z.string().trim().max(120).optional(),
  faculty: z.string().trim().max(200).optional(),
  objectives: z.string().trim().max(2000).optional(),
  abstract: z.string().trim().max(2000).optional(),
  problemStatement: z.string().trim().max(4000).optional(),
  solution: z.string().trim().max(4000).optional(),
  businessModel: z.string().trim().max(2000).optional(),
  attachmentUrl: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val ?? ''),
    z.union([z.string().url('URL tài liệu không hợp lệ.'), z.literal('')]).optional()
  ),
  advisorInfo: advisorInfoSchema.optional(),
  leaderInfo: leaderInfoSchema.optional(),
  competitionId: z.union([z.string().max(100), z.number()]).optional(),
  competitionTitle: z.string().trim().max(200).optional(),
  currentRound: z.number().int().min(1).optional(),
}).strict();

const createProjectBodySchema = projectBodySchema.extend({
  title: z.string().trim().min(1, 'Tên sản phẩm / ý tưởng dự án là bắt buộc.').max(200, 'Tên đề tài tối đa 200 ký tự.'),
  category: z.string().trim().min(1, 'Vui lòng chọn lĩnh vực dự thi.').max(120, 'Lĩnh vực tối đa 120 ký tự.'),
  objectives: z.string().trim().min(1, 'Mục tiêu ý tưởng / dự án là bắt buộc.').max(2000, 'Mục tiêu tối đa 2000 ký tự.'),
  abstract: z.string().trim().min(1, 'Mô tả ngắn gọn sản phẩm / dịch vụ là bắt buộc.').max(2000, 'Mô tả tối đa 2000 ký tự.'),
  advisorInfo: advisorInfoSchema,
});

const updateProjectBodySchema = projectBodySchema.refine((data) => Object.keys(data).length > 0, {
  message: 'Cần có ít nhất một trường cần cập nhật.',
});

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
const updateProjectStatusBodySchema = z
  .object({
    status: z.nativeEnum(PROJECT_STATUS, {
      errorMap: () => ({
        message: `Trạng thái không hợp lệ. Cho phép: ${Object.values(PROJECT_STATUS).join(', ')}`,
      }),
    }),
    note: z.string().trim().max(500, { message: 'Ghi chú không được vượt quá 500 ký tự.' }).optional(),
    // Admin có thể cưỡng chế (FORCE_OVERRIDE) trạng thái kết thúc, bắt buộc có lý do kiểm toán
    force: z.boolean().optional().default(false),
    forceReason: z.string().trim().max(500, { message: 'Lý do không được vượt quá 500 ký tự.' }).optional(),
  })
  .refine((data) => !data.force || (data.forceReason ?? '').length >= 10, {
    message: 'Khi force = true, "forceReason" bắt buộc có ít nhất 10 ký tự.',
    path: ['forceReason'],
  });

module.exports = {
  projectParamsSchema,
  listProjectsQuerySchema,
  createProjectBodySchema,
  updateProjectBodySchema,
  getUnassignedProjectsQuerySchema,
  updateProjectStatusParamsSchema,
  updateProjectStatusBodySchema,
};


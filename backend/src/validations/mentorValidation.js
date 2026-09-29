const { z } = require('zod');
/**
 * Zod validation schemas cho chức năng Quản lý Mentor.
 * Tất cả ObjectId phải là chuỗi hex 24 ký tự hợp lệ.
 */
const objectIdSchema = z
  .string({ required_error: 'ID không được để trống.' })
  .regex(/^[a-f\d]{24}$/i, { message: 'ID không đúng định dạng ObjectId.' });
// Schema query lấy danh sách mentor
const getMentorsQuerySchema = z.object({
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
  availability: z.enum(['all', 'available', 'full']).optional().default('all'),
});

// Schema params lấy chi tiết mentor
const getMentorByIdParamsSchema = z.object({
  mentorId: objectIdSchema,
});

// Schema params lấy lịch sử phân công theo dự án
const getAssignmentsByProjectParamsSchema = z.object({
  projectId: objectIdSchema,
});

// Schema query lấy dự án chưa có mentor và audit history
const paginationQuerySchema = z.object({
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

// Schema body phân công mentor (Assign)
const assignMentorBodySchema = z.object({
  projectId: objectIdSchema,
  mentorId: objectIdSchema,
  note: z.string().optional().default(''),
});

// Schema body phân công lại mentor (Reassign)
// reason là bắt buộc và không được rỗng
const reassignMentorBodySchema = z.object({
  projectId: objectIdSchema,
  newMentorId: objectIdSchema,
  reason: z
    .string({ required_error: 'Lý do thay đổi mentor là bắt buộc.' })
    .min(1, { message: 'Lý do thay đổi mentor là bắt buộc.' })
    .trim(),
});

module.exports = {
  getMentorsQuerySchema,
  getMentorByIdParamsSchema,
  getAssignmentsByProjectParamsSchema,
  paginationQuerySchema,
  assignMentorBodySchema,
  reassignMentorBodySchema,
};

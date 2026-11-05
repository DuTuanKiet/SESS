const { z } = require('zod');
const { PROJECT_STATUS, MILESTONE_STATUS } = require('../utils/constants');

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
  hasAdvisor: z.boolean().optional(),
  fullName: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(254).or(z.literal('')).optional(),
  phone: z.string().trim().max(30).optional(),
  department: z.string().trim().max(200).optional(),
  unit: z.string().trim().max(200).optional(),
  academicRank: z.string().trim().max(100).optional(),
}).strict();

const leaderInfoSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  studentId: z.string().trim().max(50).optional(),
  className: z.string().trim().max(100).optional(),
  faculty: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(254).or(z.literal('')).optional(),
  phone: z.string().trim().max(30).optional(),
  courseYear: z.string().trim().max(100).optional(),
}).strict();

const milestoneSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.union([z.string(), z.date()]).nullable().optional(),
  status: z.enum(Object.values(MILESTONE_STATUS)).optional(),
}).strict();

const submissionRoundSchema = z.object({
  roundNumber: z.coerce.number().int().min(1).optional(),
  title: z.string().trim().max(200).optional(),
  status: z.string().trim().max(50).optional(),
  submittedAt: z.union([z.string(), z.date()]).nullable().optional(),
  feedback: z.string().max(4000).optional(),
}).strict();

const projectBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().max(120).optional(),
  faculty: z.string().trim().max(200).optional(),
  objectives: z.string().max(2000).optional(),
  abstract: z.string().max(2000).optional(),
  problemStatement: z.string().max(4000).optional(),
  solution: z.string().max(4000).optional(),
  businessModel: z.string().max(2000).optional(),
  attachmentUrl: z.string().trim().url().or(z.literal('')).optional(),
  milestones: z.array(milestoneSchema).max(20).optional(),
  advisorInfo: advisorInfoSchema.optional(),
  leaderInfo: leaderInfoSchema.optional(),
  competitionId: z.union([z.string().max(100), z.number()]).optional(),
  competitionTitle: z.string().trim().max(200).optional(),
  currentRound: z.coerce.number().int().min(1).optional(),
  submissionRounds: z.array(submissionRoundSchema).max(20).optional(),
}).strict();

const createProjectBodySchema = projectBodySchema.extend({
  title: z.string().trim().min(1).max(200),
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


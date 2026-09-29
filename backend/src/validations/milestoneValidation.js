const { z } = require('zod');

/**
 * Zod validation schemas cho chức năng Quản lý Milestone.
 * Tất cả ObjectId phải là chuỗi hex 24 ký tự hợp lệ.
 */
const objectIdSchema = z
  .string({ required_error: 'ID không được để trống.' })
  .regex(/^[a-f\d]{24}$/i, { message: 'ID không đúng định dạng ObjectId.' });

// Schema params chứa projectId
const projectIdParamsSchema = z.object({
  projectId: objectIdSchema,
});

// Schema params chứa projectId và milestoneId
const milestoneIdParamsSchema = z.object({
  projectId: objectIdSchema,
  milestoneId: objectIdSchema,
});

//Lấy ngày hôm nay theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7)
function getTodayVietnam() {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(todayStr);
}

// Schema body tạo milestone (Mentor)
const createMilestoneBodySchema = z
  .object({
    title: z
      .string({ required_error: 'Tiêu đề milestone là bắt buộc.' })
      .min(1, { message: 'Tiêu đề milestone không được để trống.' })
      .max(200, { message: 'Tiêu đề milestone tối đa 200 ký tự.' })
      .trim(),
    description: z
      .string({ required_error: 'Mô tả milestone là bắt buộc.' })
      .min(1, { message: 'Mô tả milestone không được để trống.' })
      .max(2000, { message: 'Mô tả milestone tối đa 2000 ký tự.' })
      .trim(),
    startDate: z
      .string({ required_error: 'Ngày bắt đầu là bắt buộc.' })
      .datetime({ message: 'Ngày bắt đầu không đúng định dạng ISO 8601.' }),
    dueDate: z
      .string({ required_error: 'Ngày kết thúc là bắt buộc.' })
      .datetime({ message: 'Ngày kết thúc không đúng định dạng ISO 8601.' }),
  })
  .refine(
    (data) => new Date(data.startDate) >= getTodayVietnam(),
    { message: 'Ngày bắt đầu không được nằm trong quá khứ.', path: ['startDate'] }
  )
  .refine(
    (data) => new Date(data.dueDate) > new Date(data.startDate),
    { message: 'Ngày kết thúc phải sau ngày bắt đầu.', path: ['dueDate'] }
  );

// Schema body cập nhật milestone (Mentor) — tất cả optional, ít nhất 1 trường
const updateMilestoneBodySchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Tiêu đề milestone không được để trống.' })
      .max(200, { message: 'Tiêu đề milestone tối đa 200 ký tự.' })
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, { message: 'Mô tả milestone không được để trống.' })
      .max(2000, { message: 'Mô tả milestone tối đa 2000 ký tự.' })
      .trim()
      .optional(),
    startDate: z
      .string()
      .datetime({ message: 'Ngày bắt đầu không đúng định dạng ISO 8601.' })
      .optional(),
    dueDate: z
      .string()
      .datetime({ message: 'Ngày kết thúc không đúng định dạng ISO 8601.' })
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'Cần cung cấp ít nhất một trường để cập nhật.' }
  )
  .refine(
    (data) => {
      if (data.startDate && new Date(data.startDate) < getTodayVietnam()) return false;
      return true;
    },
    { message: 'Ngày bắt đầu không được nằm trong quá khứ.', path: ['startDate'] }
  )
  .refine(
    (data) => {
      if (data.dueDate && new Date(data.dueDate) < getTodayVietnam()) return false;
      return true;
    },
    { message: 'Ngày kết thúc không được nằm trong quá khứ.', path: ['dueDate'] }
  )
  .refine(
    (data) => {
      // Khi gửi cả 2 ngày → check ngay tại middleware
      // Khi chỉ gửi 1 ngày → cross-field check tại service kết hợp giá trị cũ trong DB
      if (data.startDate && data.dueDate) {
        return new Date(data.dueDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: 'Ngày kết thúc phải sau ngày bắt đầu.', path: ['dueDate'] }
  );

// Schema body nộp minh chứng (Student)
const submitEvidenceBodySchema = z.object({
  url: z
    .string({ required_error: 'URL minh chứng là bắt buộc.' })
    .url({ message: 'URL minh chứng không đúng định dạng.' })
    .trim(),
  note: z
    .string()
    .max(1000, { message: 'Ghi chú tối đa 1000 ký tự.' })
    .trim()
    .optional()
    .default(''),
});

// Schema body góp ý milestone (Mentor) — FR07
const addCommentBodySchema = z.object({
  content: z
    .string({ required_error: 'Nội dung góp ý là bắt buộc.' })
    .min(1, { message: 'Nội dung góp ý không được để trống.' })
    .max(3000, { message: 'Nội dung góp ý tối đa 3000 ký tự.' })
    .trim(),
});

module.exports = {
  getTodayVietnam,
  projectIdParamsSchema,
  milestoneIdParamsSchema,
  createMilestoneBodySchema,
  updateMilestoneBodySchema,
  submitEvidenceBodySchema,
  addCommentBodySchema,
};

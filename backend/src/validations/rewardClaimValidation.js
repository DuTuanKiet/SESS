const { z } = require('zod');

const projectRewardClaimParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID dự án không đúng định dạng ObjectId.'),
});

const saveRewardClaimBodySchema = z.object({
  bankName: z.string().trim().min(1, 'Ngân hàng nhận thưởng là bắt buộc.').max(160),
  accountNumber: z.string().trim().min(4, 'Số tài khoản tối thiểu 4 ký tự.').max(64),
  accountHolder: z.string().trim().min(1, 'Tên chủ tài khoản là bắt buộc.').max(160),
  taxCode: z.string().trim().max(32).optional().default(''),
  idCardNumber: z.string().trim().max(32).optional().default(''),
  note: z.string().trim().max(2000).optional().default(''),
  acknowledged: z.literal(true, { errorMap: () => ({ message: 'Cần xác nhận tính chính xác của thông tin.' }) }),
}).strict();

module.exports = {
  projectRewardClaimParamsSchema,
  saveRewardClaimBodySchema,
};

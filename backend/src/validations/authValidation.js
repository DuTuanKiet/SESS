const { z } = require('zod');

const portalTypeSchema = z.enum(['user', 'admin']).optional();

const loginBodySchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email hoặc mã số sinh viên.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
  portalType: portalTypeSchema,
  recaptchaToken: z.string().optional(),
}).strict();

const verifyOtpBodySchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.'),
  otp: z.string().trim().regex(/^\d+$/, 'Mã OTP chỉ được chứa chữ số.'),
  portalType: portalTypeSchema,
}).strict();

const googleLoginBodySchema = z.object({
  idToken: z.string().trim().min(1, 'Thiếu mã định danh Google.'),
  portalType: portalTypeSchema,
  recaptchaToken: z.string().optional(),
}).strict();

const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.').optional(),
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có tối thiểu 8 ký tự.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
      'Mật khẩu mới cần có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
    ),
}).strict().refine(data => data.currentPassword || data.newPassword, {
  message: 'Vui lòng nhập mật khẩu hiện tại hoặc mật khẩu mới.',
  path: ['currentPassword'],
});

const requestPasswordResetBodySchema = z.object({
  email: z.string().trim().email('Email không hợp lệ.'),
}).strict();

const resetPasswordBodySchema = z.object({
  token: z.string().min(1, 'Thiếu token đặt lại mật khẩu.'),
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có tối thiểu 8 ký tự.')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
      'Mật khẩu mới cần có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
    ),
}).strict();

module.exports = {
  loginBodySchema,
  verifyOtpBodySchema,
  googleLoginBodySchema,
  changePasswordBodySchema,
  requestPasswordResetBodySchema,
  resetPasswordBodySchema,
};

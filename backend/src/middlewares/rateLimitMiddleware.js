const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');

/**
 * Rate limiting chống brute-force / spam API.
 * Lưu ý: store mặc định là memory (đủ cho 1 instance); khi scale nhiều instance
 * chỉ cần truyền store Redis vào đây, không phải sửa chỗ khác.
 */
const buildLimiter = ({ max, message }) =>
  rateLimit({
    windowMs: env.rateLimit.windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Giữ đúng format response lỗi của toàn hệ thống
    message: { success: false, message, code: 'TOO_MANY_REQUESTS' },
  });

/** Giới hạn chung cho toàn bộ API v1 */
const apiLimiter = buildLimiter({
  max: env.rateLimit.apiMax,
  message: 'Hệ thống nhận quá nhiều yêu cầu từ thiết bị của bạn. Vui lòng thử lại sau ít phút.',
});

/** Giới hạn chặt hơn cho nhóm API xác thực (login / OTP / refresh token) */
const authLimiter = buildLimiter({
  max: env.rateLimit.authMax,
  message:
    'Bạn đã thực hiện quá nhiều lần đăng nhập/xác thực. Vui lòng chờ vài phút rồi thử lại hoặc liên hệ Giảng viên cố vấn học tập (CVHT).',
});

module.exports = { apiLimiter, authLimiter };

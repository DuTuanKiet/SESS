const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Middleware Google reCAPTCHA v3 (Enterprise Edition).
 *
 * reCAPTCHA v3 KHÔNG trả về câu hỏi như reCAPTCHA v2 - Google trả về điểm số
 * (score) từ 0.0 (chắc chắn là bot) đến 1.0 (chắc chắn là người).
 *
 * Hợp đồng:
 * - Nếu `RECAPTCHA_ENABLED=false` -> bỏ qua kiểm tra.
 * - Nếu chưa cấu hình `RECAPTCHA_SECRET_KEY`:
 *   + Development -> bỏ qua kiểm tra (in cảnh báo 1 lần) để không chặn dev local.
 *   + Production  -> trả 503 (không được bỏ qua im lặng trong production).
 * - Token thiếu/rõ sai/score thấp -> 400/403 với code rõ ràng.
 */

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

let hasWarnedMissingSecret = false;

/** Kiểm tra reCAPTCHA có được cấu hình đầy đủ không */
const isRecaptchaConfigured = () => Boolean(env.recaptcha.secret && env.recaptcha.enabled);

/**
 * Gọi API siteverify của Google để xác thực token reCAPTCHA v3.
 * @returns {Promise<{success: boolean, score: number, action: string, errors: string[]}>}
 */
const verifyRecaptchaToken = async (token, remoteIp) => {
  const body = new URLSearchParams({
    secret: env.recaptcha.secret,
    response: String(token ?? ''),
  });
  if (remoteIp) body.append('remoteip', String(remoteIp));

  try {
    const { data } = await axios.post(VERIFY_URL, body.toString(), {
      timeout: env.recaptcha.verifyTimeoutMs,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      success: Boolean(data?.success),
      score: Number(data?.score ?? 0),
      action: data?.action ?? '',
      errors: data?.['error-codes'] ?? [],
    };
  } catch (error) {
    console.error(`[reCAPTCHA] Lỗi gọi Google siteverify: ${error.message}`);
    return { success: false, score: 0, action: '', errors: ['VERIFICATION_REQUEST_FAILED'] };
  }
};

/**
 * Tạo middleware bắt buộc reCAPTCHA.
 * @param {object} [options]
 * @param {string} [options.expectedAction]  Tên action client gửi lên (VD: 'voting', 'login')
 * @param {number} [options.minScore]         Điểm tối thiểu chấp nhận (mặc định lấy từ env)
 * @param {string} [options.tokenField]       Tên field chứa token trong body (mặc định 'recaptchaToken')
 */
const requireRecaptcha = ({
  expectedAction = '',
  minScore,
  tokenField = 'recaptchaToken',
} = {}) => {
  const scoreThreshold = minScore ?? env.recaptcha.scoreThreshold;

  return async (req, _res, next) => {
    // Tắt hoàn toàn -> bỏ qua
    if (!env.recaptcha.enabled) {
      return next();
    }

    // Chưa cấu hình secret
    if (!env.recaptcha.secret) {
      if (env.recaptcha.skipWhenUnconfigured) {
        if (!hasWarnedMissingSecret) {
          hasWarnedMissingSecret = true;
          console.warn(
            '[reCAPTCHA] Chưa cấu hình RECAPTCHA_SECRET_KEY -> bỏ qua kiểm tra (development).',
          );
        }
        return next();
      }
      return next(
        ApiError.serviceUnavailable(
          'Dịch vụ xác thực bot tạm thời không khả dụng. Vui lòng thử lại sau.',
          'RECAPTCHA_NOT_CONFIGURED',
        ),
      );
    }

    const token = req.body?.[tokenField] || req.headers['x-recaptcha-token'];

    if (!token) {
      return next(
        ApiError.badRequest(
          'Thiếu mã xác thực reCAPTCHA. Vui lòng tải lại trang và thử lại.',
          'RECAPTCHA_TOKEN_MISSING',
        ),
      );
    }

    const result = await verifyRecaptchaToken(token, req.ip);

    if (!result.success) {
      return next(
        ApiError.badRequest(
          'Mã xác thực reCAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng tải lại trang và thử lại.',
          'RECAPTCHA_VERIFICATION_FAILED',
        ),
      );
    }

    if (result.score < scoreThreshold) {
      return next(
        ApiError.forbidden(
          'Yêu cầu bị từ chối do có dấu hiệu tự động. Vui lòng thử lại.',
          'RECAPTCHA_SCORE_TOO_LOW',
        ),
      );
    }

    if (expectedAction && result.action && result.action !== expectedAction) {
      return next(
        ApiError.badRequest(
          'Hành động reCAPTCHA không khớp với thao tác đang thực hiện.',
          'RECAPTCHA_ACTION_MISMATCH',
        ),
      );
    }

    // Ghi kết quả để controller có thể dùng (VD: audit log)
    req.recaptcha = { score: result.score, action: result.action };

    return next();
  };
};

module.exports = {
  requireRecaptcha,
  verifyRecaptchaToken,
  isRecaptchaConfigured,
  VERIFY_URL,
};

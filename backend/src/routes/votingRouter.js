const express = require('express');
const votingController = require('../controllers/votingController');
const { requireRecaptcha } = require('../middlewares/recaptchaMiddleware');
const { createPublicEndpointLimiter } = require('../middlewares/redisRateLimitMiddleware');

const router = express.Router();

/**
 * Límiter riêng cho endpoint bình chọn công khai:
 * 10 lượt / 60 giây / 1 IP. Đủ để người dùng thật gửi nhiều lượt,
 * nhưng chặn được tool auto-click/bot.
 */
const votingLimiter = createPublicEndpointLimiter({
  max: 10,
  windowSeconds: 60,
  scope: 'public-vote',
  message:
    'Bạn đã gửi quá nhiều lượt bình chọn trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
  code: 'VOTE_RATE_LIMIT_EXCEEDED',
});

/**
 * POST /api/v1/public/votes
 * Bình chọn công khai (không cần đăng nhập).
 * Bảo vệ 3 lớp: rate limit Redis -> reCAPTCHA v3 -> ghi DB.
 */
router.post(
  '/',
  votingLimiter,
  requireRecaptcha({ expectedAction: 'voting' }),
  votingController.handleCastVote,
);

/**
 * GET /api/v1/public/votes/:projectId/summary
 * Xem tổng hợp kết quả bình chọn (công khai).
 */
router.get('/:projectId/summary', votingLimiter, votingController.handleGetVoteSummary);

module.exports = router;

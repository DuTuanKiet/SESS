const express = require('express');
const votingController = require('../controllers/votingController');
const { requireRecaptcha } = require('../middlewares/recaptchaMiddleware');
const { createPublicEndpointLimiter } = require('../middlewares/redisRateLimitMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { voteProjectParamsSchema, castVoteBodySchema } = require('../validations/votingValidation');

const router = express.Router();

const votingLimiter = createPublicEndpointLimiter({
  max: 10,
  windowSeconds: 60,
  scope: 'public-vote',
  message:
    'Bạn đã gửi quá nhiều lượt bình chọn trong thời gian ngắn. Vui lòng thử lại sau ít phút.',
  code: 'VOTE_RATE_LIMIT_EXCEEDED',
});

/** POST /api/v1/public/votes */
router.post(
  '/',
  votingLimiter,
  requireRecaptcha({ expectedAction: 'voting' }),
  validate({ body: castVoteBodySchema }),
  votingController.handleCastVote,
);

/** GET /api/v1/public/votes/:projectId/summary */
router.get(
  '/:projectId/summary',
  votingLimiter,
  validate({ params: voteProjectParamsSchema }),
  votingController.handleGetVoteSummary,
);

module.exports = router;

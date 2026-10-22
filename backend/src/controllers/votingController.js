const votingService = require('../services/votingService');
const { assertRequired, assertObjectId } = require('../utils/validation');

/**
 * Controller cho Bình chọn công khai (Public Voting).
 * Tất cả endpoint ở đây là CÔNG KHAI (không bắt buộc đăng nhập),
 * được bảo vệ bởi reCAPTCHA v3 + Redis rate limit ở tầng route.
 */

/** POST /api/v1/public/votes - Gửi lượt bình chọn */
const handleCastVote = async (req, res, next) => {
  try {
    const { projectId, option, comment } = req.body;

    assertRequired(projectId, 'projectId');
    assertRequired(option, 'option');
    assertObjectId(projectId, 'projectId');

    const voterKey = votingService.resolveVoterKey(req);

    const result = await votingService.castVote({
      projectId,
      voterKey,
      option,
      comment,
      recaptchaScore: req.recaptcha?.score ?? 0,
      recaptchaAction: req.recaptcha?.action ?? '',
      ipHash: votingService.resolveIpHash(req),
      req,
    });

    return res.status(201).json({
      success: true,
      code: 'VOTE_CASTED',
      message: 'Cảm ơn bạn đã gửi lượt bình chọn.',
      data: {
        voteId: result.vote._id,
        projectId: result.project.id,
        option: result.vote.option,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/public/votes/:projectId/summary - Tổng hợp kết quả bình chọn */
const handleGetVoteSummary = async (req, res, next) => {
  try {
    assertObjectId(req.params.projectId, 'projectId');
    const result = await votingService.getVoteSummary({ projectId: req.params.projectId });
    return res.status(200).json({
      success: true,
      code: 'VOTE_SUMMARY_FETCHED',
      message: 'Lấy tổng hợp kết quả bình chọn thành công.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleCastVote, handleGetVoteSummary };

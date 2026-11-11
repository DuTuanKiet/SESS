const rewardClaimService = require('../services/rewardClaimService');

async function getRewardClaim(req, res) {
  const data = await rewardClaimService.getRewardClaim({
    projectId: req.params.id,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: 'Lấy thông tin kê khai nhận thưởng thành công.',
    data,
  });
}

async function saveRewardClaim(req, res) {
  const { rewardClaim } = await rewardClaimService.saveRewardClaim({
    projectId: req.params.id,
    userId: req.user.id,
    payload: req.body,
  });

  res.status(200).json({
    success: true,
    message: 'Lưu thông tin kê khai nhận thưởng thành công.',
    data: { rewardClaim },
  });
}

module.exports = {
  getRewardClaim,
  saveRewardClaim,
};

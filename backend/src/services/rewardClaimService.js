const RewardClaim = require('../models/RewardClaim');
const projectService = require('./projectService');
const ApiError = require('../utils/apiError');

function assertEligibleForRewardClaim(project) {
  if (project.status !== 'COMPLETED') {
    throw ApiError.forbidden('Chỉ dự án đã hoàn thành mới được kê khai nhận thưởng.', 'PROJECT_NOT_COMPLETED');
  }
  if (!project.award?.rank || !project.award?.prizeName) {
    throw ApiError.forbidden('Dự án chưa có thông tin giải thưởng hợp lệ.', 'PROJECT_HAS_NO_VALID_AWARD');
  }
}

async function getRewardClaim({ projectId, userId }) {
  const project = await projectService.verifyProjectOwner(userId, projectId);
  assertEligibleForRewardClaim(project);
  const rewardClaim = await RewardClaim.findOne({ projectId, submittedBy: userId }).lean();
  return { rewardClaim };
}

async function saveRewardClaim({ projectId, userId, payload }) {
  const project = await projectService.verifyProjectOwner(userId, projectId);
  assertEligibleForRewardClaim(project);

  const submittedAt = new Date();
  const rewardClaim = await RewardClaim.findOneAndUpdate(
    { projectId, submittedBy: userId },
    {
      $set: {
        status: 'PENDING',
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        accountHolder: payload.accountHolder,
        taxCode: payload.taxCode || '',
        idCardNumber: payload.idCardNumber || '',
        note: payload.note || '',
        submittedAt,
      },
      $setOnInsert: { projectId, submittedBy: userId },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return { rewardClaim };
}

module.exports = {
  getRewardClaim,
  saveRewardClaim,
};

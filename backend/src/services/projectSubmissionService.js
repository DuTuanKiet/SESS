const crypto = require('node:crypto');
const Project = require('../models/Project');
const projectMemberService = require('./projectMemberService');
const { PROJECT_MEMBER_ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');

const SUBMISSION_CATEGORIES = ['pitchDeck', 'demoVideo', 'sourceCode', 'businessModel'];

const isRoundOpen = (round, now = new Date()) => {
  if (String(round.status || '').toUpperCase() !== 'OPEN') return false;
  const opensAt = round.opensAt ? new Date(round.opensAt) : null;
  const closesAt = round.closesAt ? new Date(round.closesAt) : null;
  return Boolean(opensAt && closesAt && opensAt <= now && now <= closesAt);
};

const getRoundId = (round) => round.roundId || `legacy-${round.roundNumber || ''}`;

const toRoundResponse = (round, now = new Date()) => ({
  roundId: getRoundId(round),
  roundNumber: round.roundNumber ?? null,
  title: round.title || '',
  opensAt: round.opensAt || null,
  closesAt: round.closesAt || null,
  status: String(round.status || '').toUpperCase(),
  isOpen: isRoundOpen(round, now),
  items: Object.fromEntries(SUBMISSION_CATEGORIES.map((category) => {
    const item = round.items?.[category];
    return [category, item?.url ? {
      url: item.url,
      fileName: item.fileName || '',
      fileSize: item.fileSize ?? null,
      mimeType: item.mimeType || '',
      objectKey: item.objectKey || '',
      updatedBy: item.updatedBy || null,
      updatedAt: item.updatedAt || null,
    } : null];
  })),
  receipt: round.receipt?.hash ? {
    hash: round.receipt.hash,
    submittedAt: round.receipt.submittedAt,
    submittedBy: round.receipt.submittedBy || null,
  } : null,
  submittedAt: round.submittedAt || null,
  feedback: round.feedback || '',
});

async function loadProjectForMember(projectId, userId) {
  const { membership } = await projectMemberService.assertProjectMember(projectId, userId);
  const project = await Project.findById(projectId)
    .populate('submissionRounds.items.pitchDeck.updatedBy', 'fullName email profile.fullName')
    .populate('submissionRounds.items.demoVideo.updatedBy', 'fullName email profile.fullName')
    .populate('submissionRounds.items.sourceCode.updatedBy', 'fullName email profile.fullName')
    .populate('submissionRounds.items.businessModel.updatedBy', 'fullName email profile.fullName');
  if (!project) throw ApiError.notFound('Không tìm thấy dự án.', 'PROJECT_NOT_FOUND');
  return { project, membership };
}

async function getProjectSubmissions({ projectId, userId }) {
  const { project, membership } = await loadProjectForMember(projectId, userId);
  const now = new Date();
  const rounds = project.submissionRounds.map((round) => toRoundResponse(round, now));
  const openRound = rounds.find((round) => round.isOpen) || null;
  const currentRoundView = openRound || rounds[rounds.length - 1] || null;
  const canEdit = membership.role === PROJECT_MEMBER_ROLES.OWNER && Boolean(openRound);

  return {
    rounds,
    currentRound: project.currentRound,
    openRound,
    items: currentRoundView?.items || Object.fromEntries(SUBMISSION_CATEGORIES.map((key) => [key, null])),
    receipt: currentRoundView?.receipt || null,
    canEdit,
    hasOpenRound: Boolean(openRound),
  };
}

async function updateProjectSubmissions({ projectId, userId, roundId, items }) {
  const { project, membership } = await loadProjectForMember(projectId, userId);
  if (membership.role !== PROJECT_MEMBER_ROLES.OWNER) {
    throw ApiError.forbidden('Chỉ Owner của dự án mới được cập nhật hồ sơ dự thi.', 'NOT_PROJECT_OWNER');
  }

  const now = new Date();
  const round = project.submissionRounds.find((item) => getRoundId(item) === roundId);
  if (!round || !isRoundOpen(round, now)) {
    throw ApiError.badRequest('Không có vòng thi đang mở hợp lệ để cập nhật hồ sơ.', 'NO_OPEN_SUBMISSION_ROUND');
  }
  if (!round.roundId) round.roundId = roundId;

  const changedItems = {};
  for (const category of SUBMISSION_CATEGORIES) {
    if (!Object.prototype.hasOwnProperty.call(items, category)) continue;
    const submittedItem = items[category];
    if (submittedItem === null || !submittedItem.url) {
      round.items[category] = {
        url: '',
        fileName: '',
        fileSize: null,
        mimeType: '',
        objectKey: '',
        updatedBy: null,
        updatedAt: null,
      };
      changedItems[category] = null;
      continue;
    }

    if (!/^https?:\/\//i.test(submittedItem.url)) {
      throw ApiError.badRequest('URL nộp bài phải là liên kết HTTP hoặc HTTPS.', 'INVALID_SUBMISSION_URL');
    }

    const normalized = {
      url: submittedItem.url,
      fileName: submittedItem.fileName || '',
      fileSize: submittedItem.fileSize ?? null,
      mimeType: submittedItem.mimeType || '',
      objectKey: submittedItem.objectKey || '',
      updatedBy: userId,
      updatedAt: now,
    };
    round.items[category] = normalized;
    changedItems[category] = normalized;
  }

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ projectId: String(projectId), roundId, changedItems, userId: String(userId), now: now.toISOString() }))
    .digest('hex');
  round.receipt = { hash, submittedAt: now, submittedBy: userId };
  round.submittedAt = now;
  await project.save();
  await project.populate(SUBMISSION_CATEGORIES.map((category) => ({
    path: `submissionRounds.items.${category}.updatedBy`,
    select: 'fullName email profile.fullName',
  })));

  const updatedRound = project.submissionRounds.find((item) => getRoundId(item) === roundId);
  return {
    round: toRoundResponse(updatedRound, now),
    receipt: toRoundResponse(updatedRound, now).receipt,
  };
}

module.exports = {
  SUBMISSION_CATEGORIES,
  isRoundOpen,
  getProjectSubmissions,
  updateProjectSubmissions,
};

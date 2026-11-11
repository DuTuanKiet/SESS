const crypto = require('node:crypto');
const Project = require('../models/Project');
const projectMemberService = require('./projectMemberService');
const { PROJECT_MEMBER_ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');

const SUBMISSION_CATEGORIES = ['reportFile', 'pitchDeck', 'poster', 'demoVideo', 'sourceCode', 'businessModel'];

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
      updatedBy: item.updatedBy || item.uploadedBy || null,
      uploadedBy: item.uploadedBy || item.updatedBy || null,
      updatedAt: item.updatedAt || null,
    } : null];
  })),
  productImages: Array.isArray(round.items?.productImages)
    ? round.items.productImages.map((img) => ({
        url: img.url,
        fileName: img.fileName || '',
        fileSize: img.fileSize ?? null,
        mimeType: img.mimeType || '',
        objectKey: img.objectKey || '',
        previewUrl: img.url,
      }))
    : [],
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
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Không tìm thấy dự án.', 'PROJECT_NOT_FOUND');

  // Khởi tạo vòng nộp mặc định nếu dự án chưa có vòng nào
  if (!project.submissionRounds || project.submissionRounds.length === 0) {
    const roundNumber = project.currentRound || 1;
    project.submissionRounds.push({
      roundId: `round-${roundNumber}`,
      roundNumber,
      title: `Vòng ${roundNumber} - Vòng sơ loại`,
      status: 'OPEN',
      opensAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      closesAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await project.save();
  }

  try {
    await project.populate(SUBMISSION_CATEGORIES.map((category) => ({
      path: `submissionRounds.items.${category}.updatedBy`,
      select: 'fullName email profile.fullName',
    })));
  } catch {
    // Không để lỗi populate làm hỏng luồng tải dự án
  }

  return { project, membership };
}

async function getProjectSubmissions({ projectId, userId }) {
  const { project, membership } = await loadProjectForMember(projectId, userId);
  const now = new Date();
  const rounds = project.submissionRounds.map((round) => toRoundResponse(round, now));
  const openRound = rounds.find((round) => round.isOpen) || null;
  const currentRoundView = openRound || rounds[rounds.length - 1] || null;
  const canEdit = (membership.role === PROJECT_MEMBER_ROLES.OWNER || !membership.role) && Boolean(openRound);

  return {
    rounds,
    currentRound: project.currentRound,
    openRound,
    items: currentRoundView?.items || Object.fromEntries(SUBMISSION_CATEGORIES.map((key) => [key, null])),
    productImages: currentRoundView?.productImages || [],
    receipt: currentRoundView?.receipt || null,
    canEdit,
    hasOpenRound: Boolean(openRound),
  };
}

async function updateProjectSubmissions({ projectId, userId, roundId, items }) {
  const { project, membership } = await loadProjectForMember(projectId, userId);
  if (membership.role && membership.role !== PROJECT_MEMBER_ROLES.OWNER) {
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
        uploadedBy: null,
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
      uploadedBy: userId,
      updatedBy: userId,
      updatedAt: now,
    };
    round.items[category] = normalized;
    changedItems[category] = normalized;
  }

  // Hỗ trợ productImages dạng mảng
  if (Array.isArray(items.productImages)) {
    round.items.productImages = items.productImages.map((img) => ({
      url: img.url || img.previewUrl || '',
      fileName: img.fileName || img.name || '',
      fileSize: img.fileSize ?? img.sizeBytes ?? null,
      mimeType: img.mimeType || '',
      objectKey: img.objectKey || '',
      uploadedBy: userId,
      updatedBy: userId,
      updatedAt: now,
    }));
    changedItems.productImages = round.items.productImages;
  }

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify({ projectId: String(projectId), roundId, changedItems, userId: String(userId), now: now.toISOString() }))
    .digest('hex');
  round.receipt = { hash, submittedAt: now, submittedBy: userId };
  round.submittedAt = now;
  await project.save();

  try {
    await project.populate(SUBMISSION_CATEGORIES.map((category) => ({
      path: `submissionRounds.items.${category}.updatedBy`,
      select: 'fullName email profile.fullName',
    })));
  } catch {
    // Không để lỗi populate làm sập phản hồi lưu hồ sơ
  }

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

const crypto = require('node:crypto');
const env = require('../config/env');
const ProjectVote = require('../models/ProjectVote');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require('../utils/constants');
const { assertRequired, assertOptionalString } = require('../utils/validation');

/** Salt dùng để hash voterKey (tránh rainbow table) */
const VOTER_KEY_SALT = env.voteHashSalt;

/** Hash chuỗi nhận diện người bình chọn (IP + User-Agent) */
const hashVoterKey = (raw) =>
  crypto.createHash('sha256').update(`${VOTER_KEY_SALT}|${raw}`).digest('hex');

/** Lấy IP thực tế của client (ưu tiên X-Forwarded-For khi chạy sau reverse proxy) */
const resolveClientIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  return (
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req?.ip || 'unknown'
  );
};

/** IP đã băm (pseudonymous) - dùng để truy vết lạm dụng mà không lưu IP thô */
const resolveIpHash = (req) => hashVoterKey(`ip|${resolveClientIp(req)}`);

/** Lấy định danh người bình chọn: userId nếu đã đăng nhập, nếu không thì hash(IP + UA) */
const resolveVoterKey = (req) => {
  if (req?.user?.id) return `user:${req.user.id}`;

  const userAgent = req?.headers?.['user-agent'] || 'unknown';

  return `anon:${hashVoterKey(`${resolveClientIp(req)}|${userAgent}`)}`;
};

/**
 * Ghi nhận 1 lượt bình chọn công khai.
 * Đã được bảo vệ bởi: reCAPTCHA v3 (middleware) + rate limit Redis (middleware).
 */
const castVote = async ({ projectId, voterKey, option, comment, recaptchaScore, recaptchaAction, ipHash, req }) => {
  assertRequired(option, 'option');

  // Kiểm tra dự án tồn tại và đang mở bình chọn (DRAFT/NEED_REVISION/APPROVED)
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }

  const normalizedOption = String(option).trim();
  const normalizedComment = assertOptionalString(comment, 'comment', 1000) ?? '';

  // Chống vote trùng: unique index (projectId + voterKey)
  const existingVote = await ProjectVote.findOne({ projectId, voterKey }).lean();
  if (existingVote) {
    throw ApiError.conflict(
      'Bạn đã bình chọn cho dự án này rồi. Mỗi người chỉ được bình chọn 1 lần.',
      'ALREADY_VOTED',
    );
  }

  let vote;
  try {
    vote = await ProjectVote.create({
      projectId,
      voterKey,
      option: normalizedOption,
      comment: normalizedComment,
      recaptchaScore: recaptchaScore ?? 0,
      recaptchaAction: recaptchaAction ?? '',
      ipHash: ipHash ?? (req ? resolveIpHash(req) : ''),
    });
  } catch (error) {
    // Unique index (projectId + voterKey) là lớp bảo vệ cuối cùng khi có nhiều
    // request song song cùng lúc (bot gửi nhanh) -> trả 409 thay vì 500.
    if (error?.code === 11000) {
      throw ApiError.conflict(
        'Bạn đã bình chọn cho dự án này rồi. Mỗi người chỉ được bình chọn 1 lần.',
        'ALREADY_VOTED',
      );
    }
    throw error;
  }

  await logAuditAction({
    actor: req?.user,
    action: AUDIT_ACTIONS.CAST_PUBLIC_VOTE,
    targetEntity: AUDIT_ENTITIES.PROJECT_VOTES,
    targetId: vote._id,
    newValues: {
      voteId: vote._id,
      projectCode: project.code,
      option: normalizedOption,
      recaptchaScore: recaptchaScore ?? 0,
      recaptchaAction: recaptchaAction ?? '',
    },
    req,
  });

  return { vote, project };
};

/** Tổng hợp kết quả bình chọn của 1 dự án (nhóm theo lựa chọn) */
const getVoteSummary = async ({ projectId }) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }

  const votes = await ProjectVote.find({ projectId }).select('option').lean();
  const tally = votes.reduce((acc, vote) => {
    acc[vote.option] = (acc[vote.option] ?? 0) + 1;
    return acc;
  }, {});

  const total = votes.length;

  const results = Object.entries(tally)
    .map(([option, count]) => ({
      option,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    project: { id: project.id, code: project.code, title: project.title },
    total,
    results,
  };
};

/** Lấy chi tiết các lượt bình chọn (dành cho Admin/Ban tổ chức) */
const listVotes = async ({ projectId, page = 1, limit = 50 }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [votes, total] = await Promise.all([
    ProjectVote.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ProjectVote.countDocuments({ projectId }),
  ]);

  return {
    votes,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRecords: total,
    },
  };
};

module.exports = {
  castVote,
  getVoteSummary,
  listVotes,
  resolveVoterKey,
  resolveIpHash,
  hashVoterKey,
};

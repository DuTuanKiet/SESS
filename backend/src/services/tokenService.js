const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { sha256 } = require('../utils/security');
const { TOKEN_TYPES, USER_STATUS } = require('../utils/constants');

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, type: TOKEN_TYPES.ACCESS }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, type: TOKEN_TYPES.REFRESH, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

/** Lỗi JWT (sai chữ ký / hết hạn) được Error Middleware xử lý tập trung */
const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, env.jwt.accessSecret);
  if (payload.type !== TOKEN_TYPES.ACCESS) {
    throw ApiError.unauthorized('Token không hợp lệ để truy cập tài nguyên', 'INVALID_ACCESS_TOKEN');
  }
  return payload;
};

const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, env.jwt.refreshSecret);
  if (payload.type !== TOKEN_TYPES.REFRESH) {
    throw ApiError.unauthorized('Token không hợp lệ để làm mới phiên đăng nhập', 'INVALID_REFRESH_TOKEN');
  }
  return payload;
};

const toTokenResponse = (accessToken, refreshToken) => ({
  tokenType: 'Bearer',
  accessToken,
  refreshToken,
  accessTokenExpiresIn: env.jwt.accessExpiresIn,
  refreshTokenExpiresIn: env.jwt.refreshExpiresIn,
});

/** Ghi hash refresh token vào user, chỉ giữ tối đa N phiên gần nhất */
const storeRefreshToken = (userId, refreshToken, sessionMeta = {}) =>
  User.updateOne(
    { _id: userId },
    {
      $push: {
        refreshTokens: {
          $each: [
            {
              tokenHash: sha256(refreshToken),
              userAgent: sessionMeta.userAgent ?? '',
              ip: sessionMeta.ip ?? '',
              createdAt: new Date(),
            },
          ],
          $slice: -env.sessions.maxActive,
        },
      },
    },
  );

/** Cấp cặp access/refresh token mới và lưu phiên đăng nhập */
const issueTokens = async (user, sessionMeta = {}) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user._id, refreshToken, sessionMeta);
  return toTokenResponse(accessToken, refreshToken);
};

/**
 * Refresh token rotation: token cũ bị thu hồi ngay khi cấp token mới
 * => token bị đánh cắp cũng không thể dùng lại.
 */
const rotateTokens = async (refreshToken, sessionMeta = {}) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = sha256(refreshToken);

  const user = await User.findOne({ _id: payload.sub, 'refreshTokens.tokenHash': tokenHash });
  if (!user) {
    throw ApiError.unauthorized('Phiên đăng nhập không tồn tại hoặc đã bị thu hồi', 'SESSION_REVOKED');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị tạm khoá', 'ACCOUNT_SUSPENDED');
  }

  await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: { tokenHash } } });
  const tokens = await issueTokens(user, sessionMeta);
  return { user, tokens };
};

/** Thu hồi 1 phiên (logout) hoặc toàn bộ phiên (allSessions) */
const revokeSession = async (refreshToken, { allSessions = false } = {}) => {
  const payload = verifyRefreshToken(refreshToken);

  if (allSessions) {
    await User.updateOne({ _id: payload.sub }, { $set: { refreshTokens: [] } });
    return;
  }
  await User.updateOne({ _id: payload.sub }, { $pull: { refreshTokens: { tokenHash: sha256(refreshToken) } } });
};

/** Dùng khi tài khoản bị SUSPENDED - cắt toàn bộ phiên đăng nhập */
const revokeAllSessions = (userId) => User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });

module.exports = {
  verifyAccessToken,
  verifyRefreshToken,
  issueTokens,
  rotateTokens,
  revokeSession,
  revokeAllSessions,
};

const User = require('../models/User');
const tokenService = require('../services/tokenService');
const ApiError = require('../utils/apiError');
const { USER_STATUS } = require('../utils/constants');

/**
 * Xác thực JWT + chặn tài khoản bị SUSPENDED ngay tại middleware.
 * Mọi lỗi được throw ra ngoài và xử lý tập trung ở Error Middleware.
 */
const authenticate = async (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');

  if (!token || scheme?.toLowerCase() !== 'bearer') {
    throw ApiError.unauthorized(
      'Thiếu Authorization header dạng "Bearer <access_token>"',
      'MISSING_ACCESS_TOKEN',
    );
  }

  const payload = tokenService.verifyAccessToken(token);

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('Tài khoản không tồn tại', 'USER_NOT_FOUND');

  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị tạm khoá, vui lòng liên hệ quản trị viên', 'ACCOUNT_SUSPENDED');
  }

  req.user = user;
  next();
};

/** RBAC: checkRole('admin', 'teacher') */
const checkRole =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Chức năng này chỉ dành cho: ${allowedRoles.join(', ')}`,
        'INSUFFICIENT_ROLE',
      );
    }
    next();
  };

module.exports = { authenticate, checkRole };

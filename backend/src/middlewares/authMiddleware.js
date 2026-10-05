const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenService = require('../services/tokenService');
const ApiError = require('../utils/apiError');
const { USER_STATUS } = require('../utils/constants');

/**
 * [FR05-FR08] Middleware xác thực JWT Bearer Token (thuần JWT, không truy vấn DB).
 * Giải mã token bằng JWT_SECRET, gán payload vào req.user.
 * Được giữ nguyên và export riêng là `jwtAuthMiddleware` để không mất logic cũ.
 */
function jwtAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Yêu cầu đăng nhập để truy cập.',
    });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token không hợp lệ hoặc đã hết hạn.',
    });
  }
}

/**
 * [FR01-FR04] Xác thực JWT + chặn tài khoản bị SUSPENDED ngay tại middleware.
 * req.user là User document nên có đủ `id`, `role`, `systemRole`, `status`
 * -> dùng được cho cả route của FR01-FR04 và FR05-FR08.
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

// Routes của FR05-FR08 dùng: `const authMiddleware = require('../middlewares/authMiddleware')`
// => export mặc định là `authenticate` (đọc user từ DB: có `id`, `systemRole`, `role`, `status`)
//    để các route admin/mentor/milestone của FR05-FR08 hoạt động đúng với luồng đăng nhập FR01-FR04.
// Logic JWT thuần của FR05-FR08 vẫn được giữ ở `jwtAuthMiddleware` / `authMiddleware.jwtAuthMiddleware`.
module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authMiddleware = authenticate;
module.exports.checkRole = checkRole;
module.exports.jwtAuthMiddleware = jwtAuthMiddleware;
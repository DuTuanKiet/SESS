const jwt = require('jsonwebtoken');
/**
 * Middleware xác thực JWT Bearer Token.
 * Giải mã token, gán thông tin người dùng vào req.user.
 * Mọi route yêu cầu xác thực phải đi qua middleware này trước.
 */
function authMiddleware(req, res, next) {
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
module.exports = authMiddleware;

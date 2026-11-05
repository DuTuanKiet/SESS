const authService = require('../services/authService');
const { USER_ROLES } = require('../utils/constants');

/** Thông tin phiên đăng nhập đi kèm refresh token để quản lý thiết bị */
const getSessionMeta = (req) => ({ userAgent: req.get('user-agent') ?? '', ip: req.ip ?? '' });

/** Xác định trang đích sau đăng nhập theo vai trò người dùng */
const redirectPathByRole = (role) => {
  const r = String(role || '').toLowerCase();
  const map = {
    [USER_ROLES.JUDGE]: '/judge/assignments',
    [USER_ROLES.TEACHER]: '/advisor',
    [USER_ROLES.MENTOR]: '/advisor',
    [USER_ROLES.STUDENT]: '/student',
    [USER_ROLES.ADMIN]: '/admin',
  };
  return map[r] || '/';
};

const verifyOtp = async (req, res) => {
  const data = await authService.verifyOtp({ ...req.body, sessionMeta: getSessionMeta(req) });

  const userRole = data.user?.role || data.user?.systemRole || '';
  data.redirectPath = redirectPathByRole(userRole);

  res.status(200).json({ success: true, message: 'Xác thực email thành công.', data });
};

const login = async (req, res) => {
  const data = await authService.login({ ...req.body, sessionMeta: getSessionMeta(req) });

  // Thêm redirectPath để frontend điều hướng tự động sau khi đăng nhập
  const userRole = data.user?.role || data.user?.systemRole || '';
  data.redirectPath = redirectPathByRole(userRole);

  res.status(200).json({ success: true, message: 'Đăng nhập thành công.', data });
};

const loginWithGoogle = async (req, res) => {
  const data = await authService.loginWithGoogle({ ...req.body, sessionMeta: getSessionMeta(req) });

  let message = 'Đăng nhập Google thành công.';
  if (data.isNewUser) message = 'Đã tạo tài khoản mới và đăng nhập bằng Google thành công.';
  else if (data.isLinked) message = 'Đã tự động liên kết Google vào tài khoản hiện có và đăng nhập thành công.';

  res.status(200).json({ success: true, message, data });
};

const refreshToken = async (req, res) => {
  const data = await authService.refreshSession({ ...req.body, sessionMeta: getSessionMeta(req) });
  res.status(200).json({ success: true, message: 'Làm mới phiên đăng nhập thành công.', data });
};

const logout = async (req, res) => {
  const data = await authService.logout(req.body);
  res.status(200).json({
    success: true,
    message: data.revokedAll ? 'Đã đăng xuất khỏi tất cả thiết bị.' : 'Đã đăng xuất.',
    data,
  });
};

module.exports = { verifyOtp, login, loginWithGoogle, refreshToken, logout };

const authService = require('../services/authService');

/** Thông tin phiên đăng nhập đi kèm refresh token để quản lý thiết bị */
const getSessionMeta = (req) => ({ userAgent: req.get('user-agent') ?? '', ip: req.ip ?? '' });

const verifyOtp = async (req, res) => {
  const data = await authService.verifyOtp({ ...req.body, sessionMeta: getSessionMeta(req) });
  res.status(200).json({ success: true, message: 'Xác thực email thành công.', data });
};


const mailerService = require('../services/mailerService');

const login = async (req, res) => {
  const data = await authService.login({ ...req.body, sessionMeta: getSessionMeta(req) });
  // Non-blocking login notification email
  (async () => {
    try {
      await mailerService.sendMail({
        to: data.user.email,
        subject: '[SESS] Thông báo: Phát hiện đăng nhập thành công vào tài khoản của bạn',
        text: `Xin chào ${data.user.fullName || ''},\nThời gian: ${new Date().toISOString()}\nIP: ${req.ip}\nThiết bị: ${req.get('user-agent')}\nNếu không phải bạn, liên hệ quản trị viên.`,
        html: `<p>Xin chào ${data.user.fullName || ''},</p><p>Thời gian: ${new Date().toISOString()}</p><p>IP: ${req.ip}</p><p>Thiết bị: ${req.get('user-agent')}</p><p>Nếu không phải bạn, liên hệ quản trị viên hoặc đổi mật khẩu ngay.</p>`,
      });
    } catch (e) { console.error('Login notify email failed:', e.message); }
  })();
  res.status(200).json({ success: true, message: 'Đăng nhập thành công.', data });
};

const loginWithGoogle = async (req, res) => {
  const data = await authService.loginWithGoogle({ ...req.body, sessionMeta: getSessionMeta(req) });

  let message = 'Đăng nhập Google thành công.';
  if (data.isNewUser) message = 'Đã tạo tài khoản mới và đăng nhập bằng Google thành công.';
  else if (data.isLinked) message = 'Đã tự động liên kết Google vào tài khoản hiện có và đăng nhập thành công.';

  (async () => {
    try {
      await mailerService.sendMail({
        to: data.user.email,
        subject: '[SESS] Thông báo: Phát hiện đăng nhập thành công vào tài khoản của bạn',
        text: `Xin chào ${data.user.fullName || ''},\nThời gian: ${new Date().toISOString()}\nIP: ${req.ip}\nThiết bị: ${req.get('user-agent')}\nNếu không phải bạn, liên hệ quản trị viên.`,
        html: `<p>Xin chào ${data.user.fullName || ''},</p><p>Thời gian: ${new Date().toISOString()}</p><p>IP: ${req.ip}</p><p>Thiết bị: ${req.get('user-agent')}</p><p>Nếu không phải bạn, liên hệ quản trị viên hoặc đổi mật khẩu ngay.</p>`,
      });
    } catch (e) { console.error('Login notify email failed:', e.message); }
  })();

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

const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

module.exports = { verifyOtp, login, loginWithGoogle, refreshToken, logout, getMe };

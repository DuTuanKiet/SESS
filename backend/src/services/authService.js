const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const User = require('../models/User');
const Otp = require('../models/Otp');
const tokenService = require('./tokenService');
const mailerService = require('./mailerService');
const whitelistService = require('./whitelistService');
const ApiError = require('../utils/apiError');
const { USER_ROLES, USER_STATUS, AUTH_PROVIDERS } = require('../utils/constants');
const { sha256, generateNumericCode, safeEqual } = require('../utils/security');
const {
  isNonEmptyString,
  assertRequired,
  assertEmail,
  isStudentEmail,
  assertStudentEmail,
  extractStudentIdFromEmail,
  assertNumericCode,
} = require('../utils/validation');

let googleClient;

const getGoogleClient = () => {
  if (!env.google.clientId) {
    throw ApiError.serviceUnavailable(
      'Đăng nhập Google chưa được cấu hình trên server (thiếu GOOGLE_CLIENT_ID)',
      'GOOGLE_NOT_CONFIGURED',
    );
  }
  if (!googleClient) googleClient = new OAuth2Client(env.google.clientId);
  return googleClient;
};

/** Xác thực Google ID token mà frontend gửi lên */
const verifyGoogleIdToken = async (idToken) => {
  const ticket = await getGoogleClient()
    .verifyIdToken({ idToken, audience: env.google.clientId })
    .catch(() => {
      throw ApiError.unauthorized('Google ID token không hợp lệ hoặc đã hết hạn', 'INVALID_GOOGLE_TOKEN');
    });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw ApiError.unauthorized('Không đọc được thông tin tài khoản từ Google', 'INVALID_GOOGLE_PROFILE');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    fullName: payload.name ?? '',
    avatarUrl: payload.picture ?? '',
  };
};

/**
 * Sinh OTP 6 số mới (ghi đè OTP cũ) và gửi về Gmail sinh viên qua mailerService.
 * Chống spam: bắt buộc chờ OTP_RESEND_COOLDOWN_SECONDS (mặc định 60s) mới được gửi lại.
 */
const issueOtp = async (email) => {
  // CHỐT AN TOÀN CUỐI: chỉ gửi OTP cho email sinh viên CÓ trong danh sách nhà trường.
  // Đảm bảo không nhánh code nào có thể gửi mail cho email không tồn tại trong whitelist.
  if (isStudentEmail(email)) {
    await whitelistService.assertStudentInWhitelist(email);
  }

  const existingOtp = await Otp.findOne({ email });
  const cooldownMs = env.otp.resendCooldownSeconds * 1000;
  const lastSentAt = existingOtp ? (existingOtp.sentAt ?? existingOtp.updatedAt) : null;

  if (lastSentAt && Date.now() - lastSentAt.getTime() < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - (Date.now() - lastSentAt.getTime())) / 1000);
    throw new ApiError(
      429,
      `Bạn vừa yêu cầu mã xác minh. Vui lòng chờ ${retryAfterSeconds} giây nữa rồi thử lại.`,
      'OTP_RESEND_TOO_SOON',
      { retryAfterSeconds },
    );
  }

  const code = generateNumericCode(env.otp.length);
  const expiresAt = new Date(Date.now() + env.otp.expiresInMinutes * 60_000);
  const sentAt = new Date();

  await Otp.findOneAndUpdate(
    { email },
    { $set: { codeHash: sha256(code), attempts: 0, expiresAt, sentAt } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  await mailerService.sendOtpEmail(email, code, env.otp.expiresInMinutes);

  return { code, expiresAt };
};

/**
 * Gửi email thông báo bảo mật khi sinh viên đăng nhập thành công.
 * Đây là email phụ nên nếu gửi lỗi chỉ ghi log, KHÔNG làm hỏng kết quả xác thực của người dùng.
 */
const sendLoginNotification = async (user) => {
  // Audit log: ghi lại sự kiện xác thực thành công kèm thông tin sinh viên
  console.log(
    `[Auth] Xác thực thành công: ${user.email} | ${user.fullName || 'Chưa cập nhật'} - ${user.studentId || 'Chưa cập nhật'} | Lớp ${user.className || 'Chưa cập nhật'}`,
  );

  try {
    await mailerService.sendLoginNotificationEmail(user.email, {
      fullName: user.fullName,
      studentId: user.studentId,
      className: user.className,
    });
  } catch (error) {
    console.error(`[Auth] Không gửi được email thông báo đăng nhập tới ${user.email}: ${error.message}`);
  }
};

/** Xác thực OTP -> kích hoạt tài khoản và trả luôn cặp token để đăng nhập */
const verifyOtp = async ({ email, otp, sessionMeta } = {}) => {
  const normalizedEmail = assertEmail(email);

  // Sinh viên: BẮT BUỘC có trong danh sách sinh viên của trường
  if (isStudentEmail(normalizedEmail)) {
    await whitelistService.assertStudentInWhitelist(normalizedEmail);
  }

  const code = assertNumericCode(otp, env.otp.length);

  const record = await Otp.findOne({ email: normalizedEmail });
  if (!record) {
    throw ApiError.badRequest('Không tìm thấy mã xác thực cho email này, vui lòng đăng ký lại', 'OTP_NOT_FOUND');
  }
  if (record.isExpired) {
    await record.deleteOne();
    throw ApiError.badRequest(
      `Mã xác thực đã hết hạn (${env.otp.expiresInMinutes} phút), vui lòng lấy mã mới`,
      'OTP_EXPIRED',
    );
  }
  if (record.attempts >= env.otp.maxAttempts) {
    await record.deleteOne();
    throw ApiError.tooManyRequests(
      `Bạn đã nhập sai mã xác minh ${env.otp.maxAttempts} lần nên mã đã bị huỷ. Vui lòng đăng nhập lại để nhận mã mới.`,
      'OTP_MAX_ATTEMPTS',
    );
  }

  // Tăng số lần thử trước khi kiểm tra để tránh brute-force
  record.attempts += 1;
  await record.save();

  if (!safeEqual(sha256(code), record.codeHash)) {
    throw ApiError.badRequest(
      `Mã xác thực không chính xác (còn ${env.otp.maxAttempts - record.attempts} lần thử)`,
      'OTP_INVALID',
    );
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản với email này', 'USER_NOT_FOUND');

  user.isEmailVerified = true;
  user.lastLoginAt = new Date();
  await user.save();
  await record.deleteOne();

  // Email thông báo "xác thực & đăng nhập thành công" (kèm thông tin phiên đăng nhập)
  await sendLoginNotification(user);

  const tokens = await tokenService.issueTokens(user, sessionMeta);
  return { user, tokens };
};

/** Đăng nhập bằng email/mật khẩu */
const login = async ({ email, password, sessionMeta } = {}) => {
  const normalizedEmail = assertEmail(email);
  assertRequired(password, 'password');

  // Sinh viên: BẮT BUỘC có trong danh sách sinh viên của trường mới được đăng nhập/kích hoạt
  if (isStudentEmail(normalizedEmail)) {
    await whitelistService.assertStudentInWhitelist(normalizedEmail);
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');

  if (user.authProvider === AUTH_PROVIDERS.GOOGLE && !user.password) {
    throw ApiError.badRequest(
      'Tài khoản này được tạo bằng Google, vui lòng đăng nhập bằng Google',
      'USE_GOOGLE_LOGIN',
    );
  }
  if (!(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
  }
  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị tạm khoá, vui lòng liên hệ quản trị viên', 'ACCOUNT_SUSPENDED');
  }
  if (!user.isEmailVerified) {
    const { code } = await issueOtp(user.email);
    // devOtp chỉ xuất hiện khi EXPOSE_OTP_IN_DEV=true (môi trường dev) để test nhanh
    const details = env.otp.exposeInResponse
      ? { devOtp: code, expiresInMinutes: env.otp.expiresInMinutes }
      : undefined;

    throw new ApiError(
      403,
      'Tài khoản chưa được xác thực. Mã OTP mới đã được gửi tới email của bạn',
      'EMAIL_NOT_VERIFIED',
      details,
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await tokenService.issueTokens(user, sessionMeta);
  return { user, tokens };
};

/**
 * Đăng nhập Google OAuth2 (tài khoản Gmail trường @student.ctuet.edu.vn).
 * 1. Email CHƯA có trong DB -> tự tạo tài khoản student (isEmailVerified = true,
 *    authProvider = GOOGLE, MSSV trích xuất từ email) + gửi email chào mừng.
 * 2. Email ĐÃ có trong DB (nhà trường cấp sẵn) -> tự động ACCOUNT LINKING
 *    (gán googleId, isEmailVerified = true), KHÔNG tạo tài khoản trùng lặp.
 * 3. Email ngoài tên miền sinh viên và chưa được cấp tài khoản -> 403 DOMAIN_NOT_ALLOWED.
 */
const loginWithGoogle = async ({ idToken, sessionMeta } = {}) => {
  if (!isNonEmptyString(idToken)) {
    throw ApiError.badRequest('Thiếu "idToken" của Google trong body', 'MISSING_GOOGLE_ID_TOKEN');
  }

  const profile = await verifyGoogleIdToken(idToken.trim());
  if (!profile.emailVerified) {
    throw ApiError.unauthorized('Email Google chưa được xác thực', 'GOOGLE_EMAIL_NOT_VERIFIED');
  }
  const email = assertEmail(profile.email);

  // Sinh viên: BẮT BUỘC có trong danh sách sinh viên của trường mới được kích hoạt tài khoản
  const whitelistStudent = isStudentEmail(email)
    ? await whitelistService.assertStudentInWhitelist(email)
    : null;

  // Ưu tiên tìm theo googleId, sau đó theo email để phục vụ account linking
  const existingUser = await User.findOne({ $or: [{ googleId: profile.googleId }, { email }] });

  if (existingUser?.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị tạm khoá, vui lòng liên hệ quản trị viên', 'ACCOUNT_SUSPENDED');
  }

  let user = existingUser;
  let isNewUser = false;
  let isLinked = false;

  if (!user) {
    // Chỉ email sinh viên của trường mới được tự khởi tạo tài khoản
    assertStudentEmail(email);

    user = new User({
      email,
      authProvider: AUTH_PROVIDERS.GOOGLE,
      role: USER_ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
      // Ưu tiên dữ liệu chính thức từ danh sách sinh viên của trường
      studentId: whitelistStudent?.studentId || extractStudentIdFromEmail(email),
      fullName: whitelistStudent?.fullName || profile.fullName,
      className: whitelistStudent?.className ?? '',
      advisorEmail: whitelistStudent?.advisorEmail ?? '',
      avatarUrl: profile.avatarUrl,
    });
    isNewUser = true;
  } else {
    // ACCOUNT LINKING: liên kết Google vào tài khoản đã được cấp sẵn
    if (!user.googleId) {
      user.googleId = profile.googleId;
      isLinked = true;
    }
    if (!user.fullName && profile.fullName) user.fullName = profile.fullName;
    if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
    if (!user.studentId) user.studentId = whitelistStudent?.studentId || extractStudentIdFromEmail(email);
    if (!user.className && whitelistStudent?.className) user.className = whitelistStudent.className;
    if (!user.advisorEmail && whitelistStudent?.advisorEmail) user.advisorEmail = whitelistStudent.advisorEmail;
    user.isEmailVerified = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  // Tài khoản sinh viên mới -> gửi email thông báo chào mừng qua Gmail trường
  if (isNewUser) {
    await mailerService.sendWelcomeEmail(user.email, { fullName: user.fullName, studentId: user.studentId });
  }

  const tokens = await tokenService.issueTokens(user, sessionMeta);
  return { user, tokens, isNewUser, isLinked };
};

/** Cấp lại access token từ refresh token (có rotation chống replay) */
const refreshSession = async ({ refreshToken, sessionMeta } = {}) => {
  assertRequired(refreshToken, 'refreshToken');
  return tokenService.rotateTokens(refreshToken.trim(), sessionMeta);
};

/** Thu hồi refresh token hiện tại, hoặc toàn bộ phiên nếu allSessions = true */
const logout = async ({ refreshToken, allSessions = false } = {}) => {
  assertRequired(refreshToken, 'refreshToken');
  await tokenService.revokeSession(refreshToken.trim(), { allSessions: Boolean(allSessions) });
  return { revokedAll: Boolean(allSessions) };
};

module.exports = { verifyOtp, login, loginWithGoogle, refreshSession, logout };

// Auth Service - Kết nối thực tế với Backend SESS
import httpClient from './http/httpClient';

function normalizeError(error) {
  const err = error.response?.data || error;
  const message = err.message || err.error || error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  const code = err.code || error.code;
  const status = error.response?.status || error.status;
  const details = err.details || err.data?.details;
  const e = new Error(message);
  e.code = code;
  e.status = status;
  e.details = details;
  e.response = error.response;
  return e;
}

function toAuthError(httpError, fallbackMessage, fallbackCode) {
  const backendError = httpError.response?.data;
  const error = new Error(backendError?.message || fallbackMessage);
  error.code = backendError?.code || fallbackCode;
  error.status = httpError.response?.status || 500;
  error.details = backendError?.errors;
  return error;
}

/** Gọi API đăng nhập email và mật khẩu. */
export async function loginApi({ email, password, portalType = 'user', recaptchaToken }) {
  try {
    const response = await httpClient.post('/auth/login', {
      email: (email || '').trim().toLowerCase(),
      password,
      portalType,
      ...(recaptchaToken ? { recaptchaToken } : {}),
    });
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
  }
}

/** Gọi API xác thực mã OTP email. */
export async function verifyOtpApi({ email, otp, portalType = 'user' }) {
  try {
    const response = await httpClient.post('/auth/verify-otp', { email, otp, portalType });
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Mã xác thực không chính xác hoặc đã hết hạn.', 'OTP_INVALID');
  }
}

/** Gửi lại OTP bằng luồng đăng nhập hiện có; backend tự áp dụng cooldown và kiểm tra mật khẩu. */
export async function resendOtpApi(credentials) {
  try {
    return await loginApi(credentials);
  } catch (error) {
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return { success: true, message: error.message, otpSent: true };
    }
    throw error;
  }
}

/** Gọi API đăng nhập Google bằng credential do Google cấp. */
export async function googleLoginApi({ idToken, portalType = 'user', recaptchaToken }) {
  try {
    const response = await httpClient.post('/auth/google', {
      idToken,
      portalType,
      ...(recaptchaToken ? { recaptchaToken } : {}),
    });
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Đăng nhập Google không thành công.', 'GOOGLE_LOGIN_FAILED');
  }
}

export async function refreshTokenApi({ refreshToken }) {
  try {
    const res = await httpClient.post('/auth/refresh-token', { refreshToken });
    return res.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function logoutApi(payload = {}) {
  try {
    const res = await httpClient.post('/auth/logout', payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export default {
  loginApi,
  verifyOtpApi,
  resendOtpApi,
  googleLoginApi,
  refreshTokenApi,
  logoutApi,
};

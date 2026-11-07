import httpClient from './http/httpClient';

// Merge: một bộ chuẩn hóa lỗi cho cả hai nhánh, giữ metadata để form xử lý OTP/validation.
function toAuthError(httpError, fallbackMessage, fallbackCode) {
  const backendError = httpError.response?.data;
  const error = new Error(backendError?.message || fallbackMessage);
  error.code = backendError?.code || httpError.code || fallbackCode;
  error.status = httpError.response?.status || httpError.status || 0;
  error.details = backendError?.errors || backendError?.details || backendError?.data?.details;
  error.response = httpError.response;
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

/** Giữ API refresh/logout của dev, dùng cùng HTTP client và chuẩn lỗi. */
export async function refreshTokenApi({ refreshToken }) {
  try {
    const response = await httpClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Không thể làm mới phiên đăng nhập.', 'REFRESH_FAILED');
  }
}

export async function logoutApi(payload = {}) {
  try {
    const response = await httpClient.post('/auth/logout', payload);
    return response.data;
  } catch (error) {
    throw toAuthError(error, 'Không thể đăng xuất phiên trên máy chủ.', 'LOGOUT_FAILED');
  }
}

export default { loginApi, verifyOtpApi, resendOtpApi, googleLoginApi, refreshTokenApi, logoutApi };

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

export async function loginApi({ email, password, portalType = 'user' }) {
  try {
    const res = await httpClient.post('/auth/login', {
      email: (email || '').trim(),
      password: password || '',
      portalType,
    });
    return res.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function verifyOtpApi({ email, otp }) {
  try {
    const res = await httpClient.post('/auth/verify-otp', {
      email: (email || '').trim(),
      otp,
    });
    return res.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function resendOtpApi({ email, password, portalType = 'user' }) {
  try {
    const res = await httpClient.post('/auth/login', {
      email: (email || '').trim(),
      password: password || '',
      portalType,
    });
    return res.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function googleLoginApi(payload = {}) {
  try {
    const res = await httpClient.post('/auth/google', payload);
    return res.data;
  } catch (error) {
    throw normalizeError(error);
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
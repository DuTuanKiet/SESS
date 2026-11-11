import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearSessionAuth, getSessionUserId, hasSessionConflict } from '@/stores/sessionAuth';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
});

httpClient.interceptors.request.use((config) => {
  if (hasSessionConflict()) {
    clearAuthSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/auth/login';
    }
    error.__SESSION_CONFLICT__ = true; return Promise.reject(Object.assign(new Error('SESSION_CONFLICT'), { code: 'ERR_CANCELED', __SESSION_CONFLICT__: true }));
  }
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  const userId = getSessionUserId();
  if (userId) {
    config.headers = config.headers || {};
    config.headers['X-User-Id'] = userId;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (hasSessionConflict()) {
      clearAuthSession();
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axios.post(`${httpClient.defaults.baseURL}/auth/refresh-token`, {
            refreshToken,
          });
          const accessToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.data?.tokens?.accessToken;
          if (accessToken) {
            setAccessToken(accessToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return httpClient(originalRequest);
          }
        } catch (refreshError) {
          clearAuthSession();
          if (typeof window !== 'undefined') window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      } else {
        clearAuthSession();
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;

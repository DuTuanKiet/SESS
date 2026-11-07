import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 30000,
});

// Merge: các 401 cùng phiên dùng chung một refresh; rotation cập nhật cả Pinia và storage.
let pendingRefresh = null;
const isSessionEndpoint = (url = '') =>
  /\/auth\/(login|google|verify-otp|refresh-token|logout)(?:[/?#]|$)/.test(url);

httpClient.interceptors.request.use((config) => {
  const auth = useAuthStore();
  auth.initAuth();
  config._authGeneration ??= auth.sessionVersion;
  if (config._authGeneration !== auth.sessionVersion) {
    return Promise.reject(new Error('Phiên đăng nhập đã thay đổi.'));
  }
  config.headers = config.headers || {};
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`;
  else delete config.headers.Authorization;
  config._accessToken = auth.accessToken;
  return config;
});

async function refreshSession(auth, generation) {
  if (pendingRefresh?.generation === generation) return pendingRefresh.promise;
  const entry = { generation, promise: null };
  entry.promise = (async () => {
    try {
      // Gọi axios trực tiếp để endpoint refresh không đi lại interceptor khi bị 401.
      const response = await axios.post(`${httpClient.defaults.baseURL}/auth/refresh-token`, {
        refreshToken: auth.refreshToken,
      }, { timeout: httpClient.defaults.timeout });
      if (generation !== auth.sessionVersion) throw new Error('Phiên đăng nhập đã thay đổi.');
      auth.updateTokens(response.data?.data?.tokens);
    } catch (error) {
      if (generation === auth.sessionVersion) auth.clearAuth();
      throw error;
    } finally {
      if (pendingRefresh === entry) pendingRefresh = null;
    }
  })();
  pendingRefresh = entry;
  return entry.promise;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (!request || error.response?.status !== 401 || isSessionEndpoint(request.url)) {
      return Promise.reject(error);
    }
    const auth = useAuthStore();
    const generation = request._authGeneration;
    if (generation !== auth.sessionVersion) return Promise.reject(error);
    if (request._retry || !auth.refreshToken) {
      auth.clearAuth();
      return Promise.reject(error);
    }
    request._retry = true;
    // 401 đến muộn sau rotation chỉ retry với token mới, không tiêu thụ refresh token lần nữa.
    if (request._accessToken === auth.accessToken) await refreshSession(auth, generation);
    if (generation !== auth.sessionVersion) return Promise.reject(error);
    return httpClient(request);
  }
);

export default httpClient;

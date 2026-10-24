import httpClient from '../http/httpClient';

export const authApi = {
  login: (data) => httpClient.post('/auth/login', data),
  verifyOtp: (data) => httpClient.post('/auth/verify-otp', data),
  loginWithGoogle: (data) => httpClient.post('/auth/google', data),
  refreshToken: (data) => httpClient.post('/auth/refresh-token', data),
  logout: (data) => httpClient.post('/auth/logout', data),
  getMe: () => httpClient.get('/users/me'),
};

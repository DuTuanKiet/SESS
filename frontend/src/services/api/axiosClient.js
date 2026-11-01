import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 30000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post('http://localhost:5000/api/v1/auth/refresh-token', { refreshToken });
          const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosClient(originalRequest);
          }
        } catch (e) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
          return Promise.reject(e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
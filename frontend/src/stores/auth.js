import { defineStore } from 'pinia';
import { authApi } from '@/services/api/authApi';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
  }),
  getters: {
    role: (state) => state.user?.role || state.user?.systemRole || null,
  },
  actions: {
    setTokens({ accessToken, refreshToken }) {
      if (accessToken) {
        this.accessToken = accessToken;
        localStorage.setItem('accessToken', accessToken);
        this.isAuthenticated = true;
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
    async fetchUser() {
      try {
        const res = await authApi.getMe();
        this.user = res.data?.data || res.data?.user || null;
        return this.user;
      } catch (error) {
        this.clearAuth();
        throw error;
      }
    },
    clearAuth() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

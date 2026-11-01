import { defineStore } from 'pinia';
import { authApi } from '@/services/api/authApi';

function safeParseUser(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.id && !parsed._id && !parsed.email && !parsed.fullName && !parsed.name && !parsed.username) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getStoredToken() {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token || token === 'undefined' || token === 'null' || String(token).trim() === '') {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const accessToken = getStoredToken();
    const user = safeParseUser(localStorage.getItem('user'));
    if (accessToken && !user) {
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } catch {}
      return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    }
    if (!accessToken && user) {
      try {
        localStorage.removeItem('user');
      } catch {}
      return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
    }
    let refreshToken = null;
    try {
      refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken === 'undefined' || refreshToken === 'null') refreshToken = null;
    } catch {}
    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!(accessToken && user),
    };
  },
  getters: {
    role: (state) => state.user?.role || state.user?.systemRole || null,
  },
  actions: {
    setTokens({ accessToken, refreshToken }) {
      if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
        this.accessToken = accessToken;
        try { localStorage.setItem('accessToken', accessToken); } catch {}
        this.isAuthenticated = !!(this.accessToken && this.user);
      }
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        this.refreshToken = refreshToken;
        try { localStorage.setItem('refreshToken', refreshToken); } catch {}
      }
    },
    async fetchUser() {
      try {
        const res = await authApi.getMe();
        this.user = res.data?.data || res.data?.user || null;
        this.isAuthenticated = !!(this.accessToken && this.user);
        try {
          if (this.user) localStorage.setItem('user', JSON.stringify(this.user));
        } catch {}
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
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.clear();
      } catch {}
    },
    logout() {
      this.clearAuth();
    },
  },
});

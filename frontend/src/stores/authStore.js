import { defineStore } from 'pinia';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const REMEMBERED_EMAIL_KEY = 'sess_remembered_email';

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
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null' || String(token).trim() === '') {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function getStoredRefreshToken() {
  try {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token || token === 'undefined' || token === 'null' || String(token).trim() === '') {
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return safeParseUser(raw);
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const accessToken = getStoredToken();
    const user = getStoredUser();
    if (accessToken && !user) {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch {}
      return { accessToken: null, refreshToken: null, user: null, portalType: 'user' };
    }
    if (!accessToken && user) {
      try {
        localStorage.removeItem(USER_KEY);
      } catch {}
      return { accessToken: null, refreshToken: null, user: null, portalType: 'user' };
    }
    return {
      accessToken,
      refreshToken: getStoredRefreshToken(),
      user,
      portalType: 'user',
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isAdmin: (state) => {
      const role = (state.user?.role || state.user?.systemRole || '').toLowerCase();
      return role === 'admin';
    },
    isStudent: (state) => {
      const role = (state.user?.role || state.user?.systemRole || '').toLowerCase();
      return role === 'student';
    },
    isMentor: (state) => {
      const role = (state.user?.role || state.user?.systemRole || '').toLowerCase();
      return role === 'mentor' || role === 'teacher';
    },
    isJudge: (state) => {
      const role = (state.user?.role || state.user?.systemRole || '').toLowerCase();
      return role === 'judge';
    },
    role: (state) => state.user?.role || state.user?.systemRole || null,
  },

  actions: {
    initAuth() {
      const accessToken = getStoredToken();
      const user = getStoredUser();
      const refreshToken = getStoredRefreshToken();
      if (!accessToken || !user) {
        this.clearAuth();
        return;
      }
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.user = user;
    },

    setSession({ user: userData, tokens, portal = 'user' }) {
      this.user = userData || null;
      this.portalType = portal;
      if (tokens?.accessToken) {
        this.accessToken = tokens.accessToken;
        try { localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken); } catch {}
      } else if (tokens?.token) {
        this.accessToken = tokens.token;
        try { localStorage.setItem(ACCESS_TOKEN_KEY, tokens.token); } catch {}
      }
      if (tokens?.refreshToken) {
        this.refreshToken = tokens.refreshToken;
        try { localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken); } catch {}
      }
      if (userData) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(userData)); } catch {}
      }
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.portalType = 'user';
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.clear();
      } catch {}
    },

    logout() {
      this.clearAuth();
    },

    saveRememberedEmail(email) {
      try {
        if (email && String(email).trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, String(email).trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {}
    },

    getRememberedEmail() {
      try {
        return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
      } catch {
        return '';
      }
    },

    clearRememberedEmail() {
      try {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch {}
    },
  },
});

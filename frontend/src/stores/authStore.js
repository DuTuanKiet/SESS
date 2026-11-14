import { defineStore } from 'pinia';
import { authApi } from '@/services/api/authApi';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  REMEMBERED_EMAIL_KEY,
  readSessionValue,
  writeSessionValue,
  clearSessionAuth,
  normalizeUserId,
  bindTabUser,
  hasSessionConflict,
} from '@/stores/sessionAuth';
import { useEvaluatorStore } from '@/stores/evaluatorStore';
import { useGoogleIdentity } from '@/composables/useGoogleIdentity';

/** Ngăn Google tự động chọn lại tài khoản cũ (One Tap auto-select) khi đăng xuất. */
function disableGoogleAutoSelect() {
  try {
    useGoogleIdentity().disableAutoSelect();
  } catch {
    /* SDK chưa nạp - bỏ qua an toàn */
  }
}

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

function readToken(key) {
  const token = readSessionValue(key);
  if (!token || token === 'undefined' || token === 'null' || String(token).trim() === '') return null;
  return token;
}

function readUser() {
  return safeParseUser(readSessionValue(USER_KEY));
}

function resetUserScopedStores() {
  // BR03: clear workspace/cache state when user context changes.
  try { useEvaluatorStore().$reset(); } catch {}
  try {
    const keys = ['projectDraft', 'judgeWorkspaceDraft', 'adminWorkspaceDraft'];
    for (const k of keys) {
      sessionStorage?.removeItem?.(k);
      // keep localStorage draft only if no conflict; safer to clear tab-local copies
    }
  } catch {}
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    user: null,
    portalType: 'user',
    sessionConflict: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user && !state.sessionConflict,
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
    async fetchUser() {
      try {
        const res = await authApi.getMe();
        const user = res.data?.data || res.data?.user || null;
        this._applyUser(user, { resetIfChanged: true });
        return user;
      } catch (e) {
        this.clearAuth();
        throw e;
      }
    },

    initAuth() {
      if (hasSessionConflict()) {
        this.sessionConflict = true;
        this.clearAuth();
        return;
      }
      const accessToken = readToken(ACCESS_TOKEN_KEY);
      const user = readUser();
      const refreshToken = readToken(REFRESH_TOKEN_KEY);
      if (!accessToken || !user) {
        this.clearAuth();
        return;
      }
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.user = user;
      const bind = bindTabUser(user);
      if (bind.conflict) {
        this.sessionConflict = true;
        this.clearAuth();
      }
    },

    _applyUser(userData, { resetIfChanged = false } = {}) {
      const prevId = normalizeUserId(this.user);
      const nextId = normalizeUserId(userData);
      if (resetIfChanged && prevId && nextId && prevId !== nextId) {
        resetUserScopedStores();
        clearSessionAuth();
      }
      this.user = userData || null;
      if (userData) {
        writeSessionValue(USER_KEY, JSON.stringify(userData));
        const bind = bindTabUser(userData);
        if (bind.conflict) this.sessionConflict = true;
      } else {
        writeSessionValue(USER_KEY, null);
      }
    },

    setSession({ user: userData, tokens, portal = 'user' }) {
      const incomingId = normalizeUserId(userData);
      const existingTab = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('sess_tab_user_id') : null;
      if (existingTab && incomingId && existingTab !== incomingId) {
        // BR02/BR03: cross-user login in same tab đ reset all user-scoped state before switching.
        resetUserScopedStores();
        clearSessionAuth();
      }
      this.portalType = portal;
      if (tokens?.accessToken) {
        this.accessToken = tokens.accessToken;
        writeSessionValue(ACCESS_TOKEN_KEY, tokens.accessToken);
      } else if (tokens?.token) {
        this.accessToken = tokens.token;
        writeSessionValue(ACCESS_TOKEN_KEY, tokens.token);
      }
      if (tokens?.refreshToken) {
        this.refreshToken = tokens.refreshToken;
        writeSessionValue(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
      this._applyUser(userData, { resetIfChanged: false });
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.portalType = 'user';
      // Ngăn Google tự động ghim lại tài khoản cũ sau khi đăng xuất.
      try { disableGoogleAutoSelect(); } catch {}
      try { clearSessionAuth(); sessionStorage?.clear?.(); } catch {}
    },

    logout() {
      resetUserScopedStores();
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
      try { return localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''; } catch { return ''; }
    },

    clearRememberedEmail() {
      try { localStorage.removeItem(REMEMBERED_EMAIL_KEY); } catch {}
    },

    handleStorageConflict() {
      // localStorage auth changed in another tab; this tab keeps its own sessionStorage session.
      // If this tab has no bound session, force re-auth.
      if (!this.accessToken || !this.user) {
        this.sessionConflict = true;
        this.clearAuth();
      }
    },
  },
});

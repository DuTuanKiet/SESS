import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const REMEMBERED_EMAIL_KEY = 'sess_remembered_email';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'sess_user';
const PORTAL_KEY = 'sess_portal';

export const useAuthStore = defineStore('auth', () => {
  // State: lưu trong RAM + localStorage persistence
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  const accessToken = ref(localStorage.getItem(ACCESS_TOKEN_KEY) || null);
  const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || null);
  const portalType = ref(localStorage.getItem(PORTAL_KEY) || 'user'); // 'user' | 'admin'

  // Getters
  const isAuthenticated = computed(() => Boolean(user.value && accessToken.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isStudent = computed(() => user.value?.role === 'student');
  const isMentor = computed(() => user.value?.role === 'mentor' || user.value?.role === 'teacher');
  const isJudge = computed(() => user.value?.role === 'judge');

  // Actions
  function setSession({ user: userData, tokens, portal = 'user' }) {
    user.value = userData;
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
    if (tokens?.accessToken) {
      accessToken.value = tokens.accessToken;
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      refreshToken.value = tokens.refreshToken;
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    portalType.value = portal;
    localStorage.setItem(PORTAL_KEY, portal);
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    portalType.value = 'user';
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(PORTAL_KEY);
  }

  // Quản lý Remember Me an toàn: TUYỆT ĐỐI KHÔNG lưu token, CHỈ lưu chuỗi email
  function saveRememberedEmail(email) {
    if (email && email.trim()) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  }

  function getRememberedEmail() {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  }

  function clearRememberedEmail() {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }

  return {
    user,
    accessToken,
    refreshToken,
    portalType,
    isAuthenticated,
    isAdmin,
    isStudent,
    isMentor,
    isJudge,
    setSession,
    logout,
    saveRememberedEmail,
    getRememberedEmail,
    clearRememberedEmail,
  };
});

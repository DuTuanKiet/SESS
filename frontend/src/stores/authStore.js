import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const REMEMBERED_EMAIL_KEY = 'sess_remembered_email';

export const useAuthStore = defineStore('auth', () => {
  // State: Lưu trong RAM (Memory) theo chuẩn OWASP chống XSS
  const user = ref(null);
  const accessToken = ref(null);
  const portalType = ref('user'); // 'user' | 'admin'

  // Getters
  const isAuthenticated = computed(() => Boolean(user.value && accessToken.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isStudent = computed(() => user.value?.role === 'student');
  const isMentor = computed(() => user.value?.role === 'mentor' || user.value?.role === 'teacher');
  const isJudge = computed(() => user.value?.role === 'judge');

  // Actions
  function setSession({ user: userData, tokens, portal = 'user' }) {
    user.value = userData;
    accessToken.value = tokens?.accessToken || 'mock_access_token';
    portalType.value = portal;
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    portalType.value = 'user';
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

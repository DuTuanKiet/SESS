import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';
import { authApi } from '@/services/api/authApi';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'sess_user';
const LEGACY_USER_KEY = 'user';
const PORTAL_KEY = 'sess_portal';
const REMEMBERED_EMAIL_KEY = 'sess_remembered_email';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Trình duyệt chặn storage: phiên vẫn dùng RAM, lần tải lại phải đăng nhập lại.
  }
}

function validToken(token) {
  return typeof token === 'string' && token.trim() !== ''
    && !['null', 'undefined'].includes(token) && !token.startsWith('mock_');
}

function normalizeUser(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const role = String(value.role || value.systemRole || '').toLowerCase();
  if (!(value.id || value._id) || !['student', 'mentor', 'teacher', 'judge', 'admin'].includes(role)) {
    return null;
  }
  return { ...value, role };
}

function parseUser(raw) {
  try {
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

// Merge: giữ Composition API của HEAD và API init/fetch/clear của dev trong cùng một store.
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const portalType = ref('user');
  const sessionVersion = ref(0);
  let isInitialized = false;
  let userRequest = null;
  let hasFetchedUser = false;

  const role = computed(() => user.value?.role || null);
  const isAuthenticated = computed(() => Boolean(user.value && accessToken.value));
  const isAdmin = computed(() => role.value === 'admin');
  const isStudent = computed(() => role.value === 'student');
  const isMentor = computed(() => ['mentor', 'teacher'].includes(role.value));
  const isJudge = computed(() => role.value === 'judge');

  function clearAuth() {
    sessionVersion.value += 1;
    isInitialized = true;
    userRequest = null;
    hasFetchedUser = false;
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    portalType.value = 'user';
    useNotificationStore().clear();
    // Không xóa email đã nhớ hoặc sessionStorage không thuộc quyền sở hữu của auth.
    for (const key of [USER_KEY, LEGACY_USER_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PORTAL_KEY]) {
      writeStorage(key, null);
    }
  }

  function updateTokens(tokens) {
    if (!validToken(tokens?.accessToken) || !validToken(tokens?.refreshToken)) {
      throw new Error('Hệ thống không trả về token hợp lệ.');
    }
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    writeStorage(ACCESS_TOKEN_KEY, accessToken.value);
    writeStorage(REFRESH_TOKEN_KEY, refreshToken.value);
  }

  function setSession({ user: userData, tokens, portal = 'user' }) {
    const nextUser = normalizeUser(userData);
    if (!nextUser || !validToken(tokens?.accessToken) || !validToken(tokens?.refreshToken)) {
      throw new Error('Hệ thống không trả về phiên đăng nhập hợp lệ.');
    }
    // Phiên mới vô hiệu hóa request cũ, kể cả khi đăng nhập lại cùng tài khoản.
    sessionVersion.value += 1;
    userRequest = null;
    hasFetchedUser = false;
    useNotificationStore().clear();
    updateTokens(tokens);
    user.value = nextUser;
    portalType.value = portal === 'admin' ? 'admin' : 'user';
    isInitialized = true;
    writeStorage(USER_KEY, JSON.stringify(nextUser));
    writeStorage(PORTAL_KEY, portalType.value);
    writeStorage(LEGACY_USER_KEY, null);
  }

  function initAuth() {
    if (isInitialized) return;
    isInitialized = true;
    const storedAccess = readStorage(ACCESS_TOKEN_KEY);
    const storedRefresh = readStorage(REFRESH_TOKEN_KEY);
    const currentRaw = readStorage(USER_KEY);
    // Chỉ chuyển khóa dev khi chưa có khóa chính; không hồi sinh dữ liệu cũ nếu khóa chính hỏng.
    const storedUser = parseUser(currentRaw === null ? readStorage(LEGACY_USER_KEY) : currentRaw);
    if (!storedUser || !validToken(storedAccess) || !validToken(storedRefresh)) {
      clearAuth();
      return;
    }
    setSession({
      user: storedUser,
      tokens: { accessToken: storedAccess, refreshToken: storedRefresh },
      portal: readStorage(PORTAL_KEY),
    });
  }

  function fetchUser({ force = false } = {}) {
    initAuth();
    if (!isAuthenticated.value) return Promise.resolve(null);
    if (userRequest) return userRequest;
    if (hasFetchedUser && !force) return Promise.resolve(user.value);
    const generation = sessionVersion.value;
    userRequest = (async () => {
      try {
        const response = await authApi.getMe();
        if (generation !== sessionVersion.value) return null;
        const nextUser = normalizeUser(response.data?.data);
        if (!nextUser) throw new Error('Thông tin người dùng không hợp lệ.');
        user.value = nextUser;
        writeStorage(USER_KEY, JSON.stringify(nextUser));
        hasFetchedUser = true;
        return nextUser;
      } catch (error) {
        // Lỗi mạng/5xx không chứng minh phiên sai; chỉ kết thúc phiên khi API từ chối xác thực.
        if (generation === sessionVersion.value && [401, 403].includes(error.response?.status)) {
          clearAuth();
        }
        throw error;
      } finally {
        if (generation === sessionVersion.value) userRequest = null;
      }
    })();
    return userRequest;
  }

  function saveRememberedEmail(email) {
    writeStorage(REMEMBERED_EMAIL_KEY, String(email || '').trim() || null);
  }
  function getRememberedEmail() {
    return readStorage(REMEMBERED_EMAIL_KEY) || '';
  }
  function clearRememberedEmail() {
    writeStorage(REMEMBERED_EMAIL_KEY, null);
  }

  initAuth();
  return {
    user, accessToken, refreshToken, portalType, sessionVersion, role,
    isAuthenticated, isAdmin, isStudent, isMentor, isJudge,
    setSession, updateTokens, initAuth, fetchUser, clearAuth, logout: clearAuth,
    saveRememberedEmail, getRememberedEmail, clearRememberedEmail,
  };
});

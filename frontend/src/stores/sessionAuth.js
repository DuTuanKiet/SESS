// Tab-isolated auth session (BR02/BR03). sessionStorage scopes auth to a browser tab,
// while localStorage remains as a fallback/hydration source for existing flows and refresh.
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';
export const REMEMBERED_EMAIL_KEY = 'sess_remembered_email';
const TAB_USER_ID_KEY = 'sess_tab_user_id';
const SESSION_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, TAB_USER_ID_KEY];

function safeGet(store, key) {
  try { return store?.getItem?.(key) ?? null; } catch { return null; }
}
function safeSet(store, key, value) {
  try { if (value === null || value === undefined) store?.removeItem?.(key); else store?.setItem?.(key, value); } catch {}
}
function safeRemove(store, key) {
  try { store?.removeItem?.(key); } catch {}
}

export function readSessionValue(key) {
  const session = typeof sessionStorage !== 'undefined' ? safeGet(sessionStorage, key) : null;
  if (session) return session;
  const local = typeof localStorage !== 'undefined' ? safeGet(localStorage, key) : null;
  if (local && typeof sessionStorage !== 'undefined') safeSet(sessionStorage, key, local); // hydrate tab
  return local;
}

export function writeSessionValue(key, value) {
  if (typeof sessionStorage !== 'undefined') safeSet(sessionStorage, key, value);
  if (typeof localStorage !== 'undefined') safeSet(localStorage, key, value);
}

export function clearSessionAuth() {
  for (const k of SESSION_KEYS) {
    if (typeof sessionStorage !== 'undefined') safeRemove(sessionStorage, k);
  }
  if (typeof localStorage !== 'undefined') {
    safeRemove(localStorage, ACCESS_TOKEN_KEY);
    safeRemove(localStorage, REFRESH_TOKEN_KEY);
    safeRemove(localStorage, USER_KEY);
  }
}

export function getAccessToken() {
  const t = readSessionValue(ACCESS_TOKEN_KEY);
  return t && t !== 'undefined' && t !== 'null' && String(t).trim() ? t : null;
}
export function getRefreshToken() {
  const t = readSessionValue(REFRESH_TOKEN_KEY);
  return t && t !== 'undefined' && t !== 'null' && String(t).trim() ? t : null;
}
export function setAccessToken(token) { writeSessionValue(ACCESS_TOKEN_KEY, token); }
export function getSessionUserId() { return readSessionValue(TAB_USER_ID_KEY); }

export function normalizeUserId(user) {
  const id = user?.id ?? user?._id ?? user?.userId ?? null;
  return id ? String(id) : null;
}

export function bindTabUser(user) {
  const id = normalizeUserId(user);
  const existing = getSessionUserId();
  if (existing && id && existing !== id) return { conflict: true, existing, next: id };
  if (id && typeof sessionStorage !== 'undefined') safeSet(sessionStorage, TAB_USER_ID_KEY, id);
  return { conflict: false, id };
}

export function hasSessionConflict() {
  if (typeof sessionStorage === 'undefined') return false;
  const tabId = safeGet(sessionStorage, TAB_USER_ID_KEY);
  if (!tabId) return false;
  let user;
  try { user = JSON.parse(safeGet(sessionStorage, USER_KEY) || 'null'); } catch { user = null; }
  const userId = normalizeUserId(user);
  return !!(userId && userId !== tabId);
}

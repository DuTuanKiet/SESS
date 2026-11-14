const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const POPUP_MESSAGE_SOURCE = 'sess-google-oauth';

let googleIdentityScriptPromise;
let initializedClientId = '';

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      googleIdentityScriptPromise = null;
      reject(new Error('Không thể khởi tạo dịch vụ đăng nhập Google.'));
    };
    script.onerror = () => {
      googleIdentityScriptPromise = null;
      reject(new Error('Không thể tải dịch vụ đăng nhập Google.'));
    };
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

/** Sinh chuỗi ngẫu nhiên (hex) dùng cho state/nonce chống CSRF/replay. */
function randomHex(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Ngăn Google tự động ghim/đăng nhập lại tài khoản cũ (One Tap auto-select).
 * An toàn khi gọi lúc SDK chưa nạp: optional-chaining sẽ bỏ qua.
 */
function disableAutoSelect() {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    /* ignore */
  }
}

/**
 * Nạp + khởi tạo Google Identity SDK để dùng disableAutoSelect().
 * Không render iframe; chỉ cần API quản lý auto-select.
 */
async function initGoogleIdentity() {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) return;
  try {
    await loadGoogleIdentityScript();
    if (initializedClientId !== clientId) {
      window.google.accounts.id.initialize({ client_id: clientId, auto_select: false });
      initializedClientId = clientId;
    }
    disableAutoSelect();
  } catch {
    /* SDK không bắt buộc cho luồng popup implicit */
  }
}

/** Ánh xạ mã lỗi OAuth sang thông điệp tiếng Việt dễ hiểu. */
function mapOAuthError(errorCode) {
  switch (errorCode) {
    case 'access_denied':
      return 'Bạn đã huỷ chọn tài khoản Google.';
    case 'popup_closed_by_user':
      return 'Bạn đã đóng cửa sổ đăng nhập Google.';
    default:
      return 'Đăng nhập Google không thành công. Vui lòng thử lại.';
  }
}

/**
 * NIPT (implicit) redirect consumer.
 * Chạy trong cửa sổ popup sau khi Google redirect về redirect_uri kèm #id_token=...
 * Gửi id_token về opener rồi tự đóng popup.
 */
function consumeImplicitGoogleRedirect() {
  if (typeof window === 'undefined') return;
  const raw = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!raw) return;

  const params = new URLSearchParams(raw);
  const idToken = params.get('id_token');
  const error = params.get('error');
  if (!idToken && !error) return;

  const payload = {
    source: POPUP_MESSAGE_SOURCE,
    idToken,
    error,
    state: params.get('state') || '',
  };

  if (window.opener) {
    window.opener.postMessage(payload, window.location.origin);
    window.close();
  }
}

/**
 * Mở cửa sổ chọn tài khoản Google (luôn hiện danh sách qua prompt=select_account).
 * Trả về Promise<idToken> hoặc reject với Error thân thiện.
 */
function requestGoogleIdToken() {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    return Promise.reject(
      new Error('Đăng nhập Google chưa được cấu hình. Vui lòng đặt VITE_GOOGLE_CLIENT_ID trong frontend/.env.'),
    );
  }

  const state = randomHex(16);
  const nonce = randomHex(16);
  const redirectUri = `${window.location.origin}/auth/login`;

  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'id_token');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('state', state);
  // Bắt buộc Google liệt kê toàn bộ tài khoản đã đăng nhập + "Sử dụng tài khoản khác".
  url.searchParams.set('prompt', 'select_account');

  return new Promise((resolve, reject) => {
    const width = 500;
    const height = 640;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
    const popup = window.open(
      url.toString(),
      'sess-google-oauth',
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      reject(new Error('Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup và thử lại.'));
      return;
    }

    let settled = false;
    let pollTimer = null;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      if (pollTimer) clearInterval(pollTimer);
    };

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      fn(value);
    };

    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== POPUP_MESSAGE_SOURCE) return;
      if (data.state && data.state !== state) {
        finish(reject, new Error('Phiên đăng nhập Google không khớp. Vui lòng thử lại.'));
        return;
      }
      if (data.error) {
        finish(reject, new Error(mapOAuthError(data.error)));
        return;
      }
      if (data.idToken) {
        finish(resolve, data.idToken);
        return;
      }
      finish(reject, new Error('Không nhận được thông tin đăng nhập từ Google.'));
    }

    window.addEventListener('message', onMessage);

    // Phát hiện người dùng chủ động đóng popup (không treo loading).
    pollTimer = setInterval(() => {
      if (popup.closed) {
        finish(reject, new Error(mapOAuthError('popup_closed_by_user')));
      }
    }, 600);
  });
}

export function useGoogleIdentity() {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  return {
    isConfigured: Boolean(clientId),
    initGoogleIdentity,
    disableAutoSelect,
    consumeImplicitGoogleRedirect,
    requestGoogleIdToken,
  };
}
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let googleIdentityScriptPromise;
let initializedClientId = '';
let activeCredentialHandlers = null;

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

export function useGoogleIdentity() {
  const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  async function renderGoogleButton(element, { onCredential, onError } = {}) {
    if (!clientId) {
      throw new Error('Đăng nhập Google chưa được cấu hình ở frontend.');
    }
    if (!element) return;

    await loadGoogleIdentityScript();
    if (!element.isConnected) return;

    if (initializedClientId !== clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response?.credential) {
            activeCredentialHandlers?.onError?.(
              new Error('Google không trả về thông tin đăng nhập.'),
            );
            return;
          }
          activeCredentialHandlers?.onCredential?.(response.credential);
        },
        auto_select: false,
      });
      initializedClientId = clientId;
    }

    const handlers = { onCredential, onError };
    activeCredentialHandlers = handlers;
    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: Math.max(200, Math.floor(element.getBoundingClientRect().width || 320)),
    });

    return () => {
      if (activeCredentialHandlers === handlers) activeCredentialHandlers = null;
    };
  }

  return {
    isConfigured: Boolean(clientId),
    renderGoogleButton,
  };
}

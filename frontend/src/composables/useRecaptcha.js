const RECAPTCHA_SCRIPT_BASE_URL = 'https://www.google.com/recaptcha/api.js?render=';

let recaptchaScriptPromise;

function loadRecaptchaScript(siteKey) {
  if (window.grecaptcha?.execute) return Promise.resolve();
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${RECAPTCHA_SCRIPT_BASE_URL}${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha?.execute) {
        resolve();
        return;
      }
      recaptchaScriptPromise = null;
      reject(new Error('Không thể khởi tạo dịch vụ reCAPTCHA.'));
    };
    script.onerror = () => {
      recaptchaScriptPromise = null;
      reject(new Error('Không thể tải dịch vụ reCAPTCHA.'));
    };
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
}

export function useRecaptcha() {
  const siteKey = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();

  async function executeRecaptcha(action = 'login') {
    if (!siteKey) return null;

    await loadRecaptchaScript(siteKey);
    await new Promise((resolve) => window.grecaptcha.ready(resolve));
    return window.grecaptcha.execute(siteKey, { action });
  }

  return {
    isConfigured: Boolean(siteKey),
    executeRecaptcha,
  };
}

const nodemailer = require('nodemailer');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { normalizeEmail } = require('../utils/validation');
const { GLOBAL_TEST_EMAIL } = require('../utils/constants');

let transporter;
let isPreviewMode = false;

/** Email test chính - ở môi trường dev CHỈ gửi mail thật tới địa chỉ này */
const PRIMARY_TEST_RECIPIENT = GLOBAL_TEST_EMAIL;

/**
 * Địa chỉ MẪU dùng cho seed/fixture - KHÔNG tồn tại ngoài đời.
 * Gửi mail thật tới các địa chỉ này sẽ sinh lỗi SMTP 5.1.1 (recipient does not exist).
 * Danh sách chặn cứng để chắc chắn không bao giờ gửi nhầm.
 */
const SAMPLE_ADDRESS_PATTERN =
  /^(it\.[a-z0-9]+@ctuet\.edu\.vn|11012200\d@student\.ctuet\.edu\.vn|gk\d*@ctuet\.edu\.vn|gv01@ctuet\.edu\.vn|mentor01@ctuet\.edu\.vn|admin@ctuet\.edu\.vn)$/i;

/** Kiểm tra 1 địa chỉ có phải địa chỉ mẫu (seed/fixture) hay không */
const isSampleAddress = (email) => SAMPLE_ADDRESS_PATTERN.test(normalizeEmail(email));

/** Chuẩn hóa IP hiển thị (ẩn loopback/raw dev) để email chuyên nghiệp, tránh bị thắc mắc */
const formatClientIp = (ip) => {
  const raw = String(ip || '').trim();
  if (!raw) return 'Không xác định';
  if (raw === '::1' || raw === '127.0.0.1' || raw === '::ffff:127.0.0.1' || raw === 'localhost') {
    return 'Localhost (Mạng nội bộ / Máy chủ phát triển)';
  }
  if (raw.startsWith('::ffff:')) return raw.slice(7);
  return raw;
};

/** Bóc tách User-Agent thành mô tả ngắn gọn, thân thiện (không in chuỗi UA thô) */
const parseUserAgent = (ua) => {
  const s = String(ua || '').trim();
  if (!s) return 'Thiết bị bảo mật / Không xác định';

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(s);
  let os = '';
  if (/Windows NT 10|Windows NT 11|Windows 10|Windows 11/i.test(s)) os = 'Windows';
  else if (/Windows/i.test(s)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(s)) os = 'macOS';
  else if (/Android/i.test(s)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(s)) os = 'iOS';
  else if (/Linux/i.test(s)) os = 'Linux';

  let browser = '';
  if (/Edg\//.test(s)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera\//.test(s)) browser = 'Opera';
  else if (/Chrome\//.test(s) && !/Edg\//.test(s)) browser = 'Google Chrome';
  else if (/Firefox\//.test(s)) browser = 'Mozilla Firefox';
  else if (/Safari\//.test(s) && !/Chrome\//.test(s)) browser = 'Safari';

  const parts = [os, browser].filter(Boolean);
  if (parts.length) return parts.join(' / ');
  if (isMobile) return 'Thiết bị di động / Trình duyệt web tiêu chuẩn';
  return 'Trình duyệt web tiêu chuẩn';
};

/** Định dạng thời gian kiểu Việt Nam thân thiện: DD/MM/YYYY lúc HH:mm */
const formatLoginTime = (date = new Date()) => {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  try {
    const datePart = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh',
    }).format(d);
    return `${datePart} lúc ${timePart}`;
  } catch {
    return formatDateTime(d);
  }
};

/** Logo CTUT công khai (URL trực tiếp, không localhost/Base64) — hiển thị ổn định trên Gmail/Outlook */
const CTUT_LOGO_URL = 'https://tuyensinh.ctuet.edu.vn/University/14_CTUET/img/logo.png';

const renderCtutLogoImg = (size = 56) => {
  const s = Math.max(40, Number(size) || 56);
  return `<img src="${CTUT_LOGO_URL}" alt="CTUT - Trường Đại học Kỹ thuật - Công nghệ Cần Thơ" width="${s}" height="${s}" border="0" style="display:block;width:${s}px;height:${s}px;max-width:${s}px;object-fit:contain;margin:0 auto;border:0;outline:none;text-decoration:none;" />`;
};

/**
 * Quyết định ĐÍCH GỬI THỰC TẾ cho mọi email của hệ thống.
 *
 * - Production: gửi đúng người nhận. Địa chỉ mẫu bị bỏ qua (tránh lỗi 5.1.1).
 * - Dev/Test  : hệ thống LUÔN gửi về GLOBAL_TEST_EMAIL để không gửi nhầm tới địa chỉ
 *               không tồn tại; người nhận dự kiến được ghi rõ trong nội dung + log.
 *
 * @returns {{deliveryTo: string|null, intendedTo: string, redirected: boolean, skipped: boolean, reason: string}}
 */
const resolveDeliveryTarget = (to) => {
  const intendedTo = normalizeEmail(to);

  if (!intendedTo) {
    return { deliveryTo: null, intendedTo, redirected: false, skipped: true, reason: 'EMPTY_RECIPIENT' };
  }

  if (env.isProduction) {
    if (isSampleAddress(intendedTo)) {
      return {
        deliveryTo: null,
        intendedTo,
        redirected: false,
        skipped: true,
        reason: 'SAMPLE_ADDRESS_BLOCKED',
      };
    }
    return { deliveryTo: intendedTo, intendedTo, redirected: false, skipped: false, reason: '' };
  }

  return {
    deliveryTo: PRIMARY_TEST_RECIPIENT,
    intendedTo,
    redirected: intendedTo !== PRIMARY_TEST_RECIPIENT,
    skipped: false,
    reason: '',
  };
};

/** Ghi chú "người nhận dự kiến" vào thân email khi bị chuyển hướng về email test */
const buildDeliveryNotice = (intendedTo) => ({
  text: `\n\n---------------------------------------\n[DEV/TEST] Email này được chuyển hướng về ${PRIMARY_TEST_RECIPIENT}\nNgười nhận dự kiến: ${intendedTo}\n`,
  html: `<div style="max-width:600px;margin:0 auto;padding:10px 24px 28px;font-size:12px;color:#8b93a5;line-height:1.6;">[DEV/TEST] Email này được chuyển hướng về <strong>${PRIMARY_TEST_RECIPIENT}</strong><br />Người nhận dự kiến: ${intendedTo}</div>`,
});

/**
 * Safe-guard cho môi trường development:
 * Tránh Gmail trả về thư phản hồi "Mail Delivery Subsystem 550 / 5.1.1" khi gửi tới
 * các địa chỉ sinh viên mẫu không tồn tại -> mọi email đều hội tụ về email test chính.
 */

/** Chỉ gửi mail thật khi có đủ host + tài khoản SMTP; thiếu bất kỳ phần nào -> in ra console (chế độ dev) */
const isSmtpConfigured = () => Boolean(env.mail.host && env.mail.user && env.mail.pass);

const getTransporter = () => {
  if (transporter) return transporter;

  if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: { user: env.mail.user, pass: env.mail.pass },
    });
  } else {
    isPreviewMode = true;
    transporter = nodemailer.createTransport({ jsonTransport: true });
    const reason = env.mail.host ? 'đã có SMTP_HOST nhưng thiếu SMTP_USER/SMTP_PASS' : 'chưa cấu hình SMTP';
    console.warn(`[Mail] ${reason} -> email sẽ được in ra console (chế độ dev).`);
  }

  return transporter;
};

/** In nội dung email ra console (chế độ dev) */
const logMailToConsole = (to, subject, text) => {
  console.log('\n================= [MAIL:DEV] =================');
  console.log(`To     : ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('==============================================\n');
};

/**
 * Hàm gửi email DUY NHẤT của hệ thống.
 * Mọi email (OTP, chào mừng, thông báo đăng nhập, lời mời dự án, biên nhận số)
 * đều đi qua đây -> đảm bảo định tuyến đúng về GLOBAL_TEST_EMAIL ở dev/test.
 */
const sendMail = async ({ to, subject, text, html }) => {
  const target = resolveDeliveryTarget(to);

  if (target.skipped) {
    console.warn(
      `[Mail] BỎ QUA gửi email tới "${target.intendedTo}" (${target.reason}). ` +
        'Địa chỉ mẫu không tồn tại ngoài đời -> tránh lỗi SMTP 5.1.1.',
    );
    return { sent: false, skipped: true, deliveryTo: null, intendedTo: target.intendedTo };
  }

  let finalText = text ?? '';
  let finalHtml = html;

  if (target.redirected) {
    const notice = buildDeliveryNotice(target.intendedTo);
    finalText = `${finalText}${notice.text}`;
    if (finalHtml) finalHtml = finalHtml.replace('</body>', `${notice.html}</body>`);
    console.log(
      `[Mail] Chuyển hướng email "${subject}": ${target.intendedTo} -> ${target.deliveryTo}`,
    );
  }

  let info;
  try {
    info = await getTransporter().sendMail({
      from: env.mail.from,
      to: target.deliveryTo,
      subject,
      text: finalText,
      html: finalHtml,
      headers: { 'X-Intended-Recipient': target.intendedTo },
    });
  } catch (error) {
    console.error(`[Mail] Gửi email tới ${target.deliveryTo} thất bại: ${error.message}`);

    // Production: báo lỗi 503 cho client. Dev: in mail ra console để không chặn luồng test.
    if (env.isProduction) {
      throw ApiError.serviceUnavailable('Không gửi được email, vui lòng thử lại sau', 'MAIL_SEND_FAILED');
    }
    logMailToConsole(target.deliveryTo, subject, finalText);
    return {
      sent: false,
      skipped: false,
      deliveryTo: target.deliveryTo,
      intendedTo: target.intendedTo,
      error: error.message,
    };
  }

  if (isPreviewMode) {
    logMailToConsole(target.deliveryTo, subject, finalText);
    return {
      sent: false,
      skipped: false,
      preview: true,
      deliveryTo: target.deliveryTo,
      intendedTo: target.intendedTo,
    };
  }

  console.log(
    `[Mail] Đã gửi "${subject}" tới ${target.deliveryTo}` +
      `${target.redirected ? ` (người nhận dự kiến: ${target.intendedTo})` : ''}` +
      ` | messageId: ${info.messageId} | accepted: ${(info.accepted ?? []).join(', ')}` +
      ` | text: ${finalText.length} ký tự | html: ${finalHtml ? `${finalHtml.length} ký tự` : 'không có'}`,
  );

  return {
    sent: true,
    skipped: false,
    deliveryTo: target.deliveryTo,
    intendedTo: target.intendedTo,
    messageId: info.messageId,
  };
};

/** Nhận diện thương hiệu dùng chung cho mọi email */
const BRAND = {
  name: 'SESS - CTUT',
  tagline: 'Nền tảng Hỗ trợ Khởi nghiệp Sinh viên',
  systemName: 'Hệ thống Hỗ trợ Khởi nghiệp Sinh viên (SESS)',
  university: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT)',
  primary: '#1e3a8a',
  primaryDark: '#172554',
};

/** Định dạng thời gian kiểu Việt Nam: DD/MM/YYYY HH:mm:ss */
const formatDateTime = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
};

const renderEmailLayout = ({ heading, preheader, contentHtml, brandExtra = '' }) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
  <style>
    @keyframes sessFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:620px;max-width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <tr>
            <td align="center" style="background-color:${BRAND.primary};background-image:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);padding:22px 28px;text-align:center;">
              ${brandExtra || ''}
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 28px;">${contentHtml}</td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5edf5;background-color:#f8fafc;padding:18px 28px;">
              <p style="margin:0;font-size:13px;color:#475569;">Trân trọng,</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${BRAND.primary};">Cổng thông tin SESS - ${BRAND.university}</p>
              <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Email tự động từ hệ thống, vui lòng không trả lời trực tiếp thư này.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Nội dung HTML của email OTP */
const renderOtpContent = ({ email, otp, expiresInMinutes }) => `
  <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2430;">Kính gửi người dùng SESS CTUT!</p>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d4657;">
    Mã xác minh bạn cần dùng để truy cập vào <strong>${BRAND.systemName}</strong> cho tài khoản
    <strong style="color:${BRAND.primary};">${email}</strong> là:
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:0 0 22px;">
        <div style="display:inline-block;min-width:250px;padding:18px 26px;background-color:#f4f4f6;border:1px solid #e4e4ea;border-radius:10px;font-family:'Courier New',Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:4px;color:#111111;text-align:center;">
          ${otp}
        </div>
      </td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8e6;border-left:4px solid #f0a500;border-radius:6px;">
    <tr>
      <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#6b5200;">
        <strong>Lưu ý bảo mật:</strong> Mã có hiệu lực trong ${expiresInMinutes} phút và chỉ sử dụng được 1 lần.
        Vui lòng <strong>không chia sẻ mã này</strong> cho bất kỳ ai.
      </td>
    </tr>
  </table>`;

/** Dựng nội dung email OTP (tách khỏi phần gửi để có thể preview/kiểm thử) */
const renderOtpEmail = (to, otp, expiresInMinutes) => {
  const subject = 'SESS - Mã xác minh tài khoản của bạn';
  const text = [
    'Kính gửi người dùng SESS CTUT!',
    '',
    `Mã xác minh bạn cần dùng để truy cập vào ${BRAND.systemName} cho tài khoản ${to} là:`,
    '',
    `        ${otp}`,
    '',
    `Lưu ý bảo mật: Mã có hiệu lực trong ${expiresInMinutes} phút. Không chia sẻ mã này cho bất kỳ ai.`,
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name} - ${BRAND.university}`,
  ].join('\n');

  return {
    to,
    subject,
    text,
    html: renderEmailLayout({
      heading: 'Mã xác minh tài khoản SESS',
      preheader: `Mã xác minh của bạn là ${otp} (hết hạn sau ${expiresInMinutes} phút)`,
      contentHtml: renderOtpContent({ email: to, otp, expiresInMinutes }),
    }),
  };
};

/** Gửi email OTP: kèm cả bản text (client không hỗ trợ HTML) và bản HTML */
const sendOtpEmail = (to, otp, expiresInMinutes) => sendMail(renderOtpEmail(to, otp, expiresInMinutes));

/** Dựng nội dung email thông báo đăng nhập thành công (bảo mật tài khoản) */
const renderLoginNotificationEmail = (to, { fullName, studentId, className, loginAt = new Date(), ip, userAgent, device } = {}) => {
  const loginTime = formatLoginTime(loginAt);
  const greetingName = fullName || 'bạn';
  const studentCode = studentId || null;
  const studentClass = className || null;
  const deviceLabel = device || parseUserAgent(userAgent);
  const ipLabel = formatClientIp(ip);

  const row = (label, value, { highlight = false } = {}) => `
            <tr>
              <td style="padding:10px 0;font-size:13px;color:#64748b;width:185px;vertical-align:top;border-bottom:1px solid #eef2f7;">${label}</td>
              <td style="padding:10px 0;font-size:14px;font-weight:600;color:${highlight ? '#15803d' : '#0f172a'};border-bottom:1px solid #eef2f7;">${value || '—'}</td>
            </tr>`;

  const contentHtml = `
    <div style="animation:sessFade .6s ease-out both;">
      <div style="text-align:center;margin-bottom:18px;">
        <div style="display:inline-block;width:52px;height:52px;line-height:52px;border-radius:999px;background:#ecfdf3;color:#15803d;font-size:26px;font-weight:700;box-shadow:0 0 0 6px rgba(21,128,61,0.10);">✓</div>
      </div>
      <h2 style="margin:0 0 8px;font-size:20px;line-height:1.35;color:#0f172a;text-align:center;">Đăng nhập thành công</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569;text-align:center;">
        Xin chào <strong>${greetingName}</strong>, hệ thống <strong>${BRAND.name}</strong> ghi nhận một phiên đăng nhập mới vào tài khoản của bạn.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:18px 20px 8px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;color:${BRAND.primary};text-transform:uppercase;">Chi tiết phiên đăng nhập</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row('Tài khoản', to)}
              ${studentCode ? row('Mã số sinh viên', studentCode) : ''}
              ${studentClass ? row('Lớp', studentClass) : ''}
              ${row('Thời gian', loginTime)}
              ${row('Thiết bị truy cập', deviceLabel)}
              ${row('Địa điểm / IP', ipLabel)}
              ${row('Trạng thái', 'Xác thực thành công', { highlight: true })}
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <tr>
          <td style="padding:14px 16px;font-size:13px;line-height:1.7;color:#92400e;">
            <strong style="color:#78350f;">&#128274; Cảnh báo bảo mật:</strong> Nếu đây không phải là bạn, vui lòng liên hệ ngay với <strong>Quản trị viên</strong> hoặc tiến hành đổi mật khẩu để bảo vệ tài khoản.
          </td>
        </tr>
      </table>
    </div>`;

  const text = [
    `Xin chào ${greetingName},`,
    '',
    `Hệ thống ${BRAND.name} ghi nhận một phiên đăng nhập mới vào tài khoản của bạn.`,
    '',
    '--- Chi tiết phiên đăng nhập ---',
    `Tài khoản      : ${to}`,
    ...(studentCode ? [`Mã số sinh viên: ${studentCode}`] : []),
    ...(studentClass ? [`Lớp            : ${studentClass}`] : []),
    `Thời gian      : ${loginTime}`,
    `Thiết bị       : ${deviceLabel}`,
    `Địa điểm/IP    : ${ipLabel}`,
    'Trạng thái     : Xác thực thành công',
    '',
    'Cảnh báo bảo mật: Nếu đây không phải là bạn, vui lòng liên hệ ngay với Quản trị viên hoặc tiến hành đổi mật khẩu để bảo vệ tài khoản.',
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name}`,
    BRAND.university,
  ].join('\n');

  return {
    to,
    subject: '[SESS - CTUT] Thông báo bảo mật: Đăng nhập thành công',
    text,
    html: renderEmailLayout({
      heading: 'Thông báo đăng nhập thành công',
      preheader: `Đăng nhập ${BRAND.name} - ${loginTime} - ${deviceLabel}`,
      contentHtml,
      brandExtra: renderCtutLogoImg(48),
    }),
  };
};

/** Gửi email thông báo bảo mật khi sinh viên đăng nhập thành công */
const sendLoginNotificationEmail = (to, studentInfo = {}) =>
  sendMail(renderLoginNotificationEmail(to, studentInfo));


/** Dựng nội dung email chào mừng (tài khoản sinh viên tạo tự động qua Google) */
const renderWelcomeEmail = (to, { fullName, studentId } = {}) => {
  const greetingName = fullName || 'bạn';
  const contentHtml = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2430;">Kính gửi ${greetingName},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3d4657;">
      Tài khoản của bạn đã được kích hoạt thành công trên <strong>${BRAND.systemName}</strong> bằng Google.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f6;border-radius:10px;">
      <tr>
        <td style="padding:16px 20px;font-size:14px;line-height:1.8;color:#1f2430;">
          <strong>Tên đăng nhập:</strong> ${to}<br />
          ${studentId ? `<strong>Mã số sinh viên:</strong> ${studentId}<br />` : ''}
          <strong>Phương thức:</strong> Google OAuth
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:#3d4657;">
      Bạn có thể đăng nhập vào hệ thống bằng chính tài khoản Google này.
    </p>`;

  const text = [
    `Kính gửi ${greetingName},`,
    '',
    `Tài khoản của bạn đã được kích hoạt thành công trên ${BRAND.systemName} bằng Google.`,
    '',
    `Tên đăng nhập: ${to}`,
    ...(studentId ? [`Mã số sinh viên: ${studentId}`] : []),
    'Phương thức: Google OAuth',
    '',
    'Bạn có thể đăng nhập vào hệ thống bằng chính tài khoản Google này.',
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name} - ${BRAND.university}`,
  ].join('\n');

  return {
    to,
    subject: 'SESS - Chào mừng bạn đến với hệ thống',
    text,
    html: renderEmailLayout({
      heading: 'Chào mừng bạn đến với SESS CTUT',
      preheader: `Tài khoản ${to} đã được kích hoạt thành công`,
      contentHtml,
    }),
  };
};

/** Gửi email chào mừng cho tài khoản sinh viên được khởi tạo tự động qua Google */
const sendWelcomeEmail = (to, user = {}) => sendMail(renderWelcomeEmail(to, user));

/** Gửi email mời tham gia dự án (FR04) */
const sendProjectInvitationEmail = async (to, { projectTitle, projectCode, inviterName, inviteeName } = {}) => {
  const greetingName = inviteeName || 'bạn';
  const detailRow = (label, value) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#5a6472;width:150px;">${label}</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2430;">${value}</td>
      </tr>`;

  const contentHtml = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2430;">Xin chào ${greetingName},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3d4657;">
      <strong>${inviterName || 'Trưởng nhóm'}</strong> đã mời bạn tham gia dự án trên
      <strong>${BRAND.name}</strong>. Vui lòng đăng nhập hệ thống để xác nhận hoặc từ chối lời mời.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f6;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.6px;color:${BRAND.primary};text-transform:uppercase;">Thông tin dự án</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${detailRow('Tên dự án', projectTitle || '')}
            ${detailRow('Mã dự án', projectCode || '')}
            ${detailRow('Người mời', inviterName || '')}
            ${detailRow('Trạng thái', 'Chờ bạn phản hồi', true)}
          </table>
        </td>
      </tr>
    </table>`;

  const text = [
    `Xin chào ${greetingName},`,
    '',
    `${inviterName || 'Trưởng nhóm'} đã mời bạn tham gia dự án trên ${BRAND.name}.`,
    '',
    `Tên dự án : ${projectTitle || ''}`,
    `Mã dự án  : ${projectCode || ''}`,
    'Trạng thái: Chờ bạn phản hồi',
    '',
    'Vui lòng đăng nhập hệ thống để xác nhận hoặc từ chối lời mời.',
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name}`,
    BRAND.university,
  ].join('\n');

  return sendMail({
    to,
    subject: `SESS - CTUT: Lời mời tham gia dự án ${projectTitle || ''}`.trim(),
    text,
    html: renderEmailLayout({
      heading: 'Lời mời tham gia dự án',
      preheader: `${inviterName || 'Trưởng nhóm'} đã mời bạn tham gia dự án ${projectTitle || ''}`.trim(),
      contentHtml,
    }),
  });
};

/** Gửi email biên nhận số (Digital Receipt) khi nộp bài thành công */
const sendDigitalReceiptEmail = async (to, {
  projectCode, projectTitle, version, receiptHash, receiptTimestamp, memberEmails = [],
} = {}) => {
  const formattedTime = new Date(receiptTimestamp).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const detailRow = (label, value) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#5a6472;width:180px;">${label}</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1f2430;">${value}</td>
      </tr>`;

  const contentHtml = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2430;">Xin chào,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3d4657;">
      Nhóm của bạn đã nộp bài thành công trên <strong>${BRAND.name}</strong>. Dưới đây là biên nhận số xác nhận.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f6;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.6px;color:${BRAND.primary};text-transform:uppercase;">Thông tin biên nhận</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${detailRow('Mã dự án', projectCode || '')}
            ${detailRow('Tên dự án', projectTitle || '')}
            ${detailRow('Phiên bản', `v${version || 1}`)}
            ${detailRow('Mã hash biên nhận', receiptHash || '')}
            ${detailRow('Thời điểm nộp', formattedTime)}
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#fff8e6;border-left:4px solid #f0a500;border-radius:6px;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#6b5200;">
          <strong>Lưu ý bảo mật:</strong> Mã hash biên nhận là bằng chứng duy nhất xác nhận nộp bài.
          Vui lòng giữ mã này và không chia sẻ cho bất kỳ ai.
        </td>
      </tr>
    </table>`;

  const text = [
    'Xin chào,',
    '',
    `Nhóm của bạn đã nộp bài thành công trên ${BRAND.name}.`,
    '',
    '--- Thông tin biên nhận ---',
    `Mã dự án: ${projectCode || ''}`,
    `Tên dự án: ${projectTitle || ''}`,
    `Phiên bản: v${version || 1}`,
    `Mã hash biên nhận: ${receiptHash || ''}`,
    `Thời điểm nộp: ${formattedTime}`,
    '',
    'Lưu ý bảo mật: Mã hash biên nhận là bằng chứng duy nhất xác nhận nộp bài.',
    'Vui lòng giữ mã này và không chia sẻ cho bất kỳ ai.',
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name}`,
    BRAND.university,
  ].join('\n');

  const recipients = [to, ...memberEmails].filter(Boolean);
  return Promise.all(
    recipients.map((recipient) =>
      sendMail({
        to: recipient,
        subject: `SESS - CTUT: Biên nhận số nộp bài ${projectCode || ''}`.trim(),
        text,
        html: renderEmailLayout({
          heading: 'Biên nhận số nộp bài',
          preheader: `Mã hash biên nhận: ${receiptHash || ''}`,
          contentHtml,
        }),
      }),
    ),
  );
};

module.exports = {
  sendMail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendProjectInvitationEmail,
  sendDigitalReceiptEmail,
  renderOtpEmail,
  renderWelcomeEmail,
  renderLoginNotificationEmail,
  formatClientIp,
  parseUserAgent,
  formatLoginTime,
  resolveDeliveryTarget,
  isSampleAddress,
  PRIMARY_TEST_RECIPIENT,
};

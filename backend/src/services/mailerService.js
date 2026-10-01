const nodemailer = require('nodemailer');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const { normalizeEmail } = require('../utils/validation');

let transporter;
let isPreviewMode = false;

/** Email test chính - ở môi trường dev CHỈ gửi mail thật tới địa chỉ này */
const PRIMARY_TEST_RECIPIENT = 'dtkietktpm2311025@student.ctuet.edu.vn';

/**
 * Safe-guard cho môi trường development:
 * Tránh Gmail trả về thư phản hồi "Mail Delivery Subsystem 550" khi test với các địa chỉ
 * sinh viên mẫu không tồn tại -> các địa chỉ khác chỉ mô phỏng bằng console.
 */
const shouldSimulateMailInDev = (to) =>
  env.nodeEnv === 'development' && normalizeEmail(to) !== PRIMARY_TEST_RECIPIENT;

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

const sendMail = async ({ to, subject, text, html }) => {
  // Dev: mô phỏng gửi mail cho mọi địa chỉ trừ email test chính (không gọi SMTP thật)
  if (shouldSimulateMailInDev(to)) {
    console.log(`[DEV MAILER SIMULATION] Gửi email đến: ${to} | Tiêu đề: ${subject}`);
    return;
  }

  let info;
  try {
    info = await getTransporter().sendMail({ from: env.mail.from, to, subject, text, html });
  } catch (error) {
    console.error(`[Mail] Gửi email tới ${to} thất bại: ${error.message}`);

    // Production: báo lỗi 503 cho client. Dev: in mail ra console để không chặn luồng test.
    if (env.isProduction) {
      throw ApiError.serviceUnavailable('Không gửi được email, vui lòng thử lại sau', 'MAIL_SEND_FAILED');
    }
    logMailToConsole(to, subject, text);
    return;
  }

  if (isPreviewMode) {
    logMailToConsole(to, subject, text);
    return;
  }

  console.log(
    `[Mail] Đã gửi "${subject}" tới ${to} | messageId: ${info.messageId} | accepted: ${(info.accepted ?? []).join(', ')} | text: ${text.length} ký tự | html: ${html ? `${html.length} ký tự` : 'không có'}`,
  );
};

/** Nhận diện thương hiệu dùng chung cho mọi email */
const BRAND = {
  name: 'SESS - CTUT',
  tagline: 'Nền tảng Hỗ trợ Khởi nghiệp Sinh viên',
  systemName: 'Hệ thống Hỗ trợ Khởi nghiệp Sinh viên (SESS)',
  university: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT)',
  primary: '#1A365D',
  primaryDark: '#12294A',
};

/** Định dạng thời gian kiểu Việt Nam: DD/MM/YYYY HH:mm:ss */
const formatDateTime = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
};

/**
 * Khung HTML email dùng chung: table-based + inline style để hiển thị đúng trên Gmail/Outlook.
 */
const renderEmailLayout = ({ heading, preheader, contentHtml }) => `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(11,61,145,0.12);">
          <tr>
            <td style="background-color:${BRAND.primary};background-image:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:1px;color:#ffffff;">${BRAND.name}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#cfe0ff;">${BRAND.tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${contentHtml}</td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e3e8f0;background-color:#fafbfd;padding:20px 32px;">
              <p style="margin:0;font-size:13px;color:#3d4657;">Trân trọng,</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:${BRAND.primary};">Nhóm phát triển ${BRAND.name}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#5a6472;">${BRAND.university}</p>
              <p style="margin:10px 0 0;font-size:11px;color:#8b93a5;">Email tự động, vui lòng không trả lời trực tiếp.</p>
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

/** Dòng chi tiết trong card phiên đăng nhập */
const renderDetailRow = (label, value, highlight = false) => `
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#5a6472;width:170px;vertical-align:top;">${label}</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:${highlight ? '#15803d' : '#1f2430'};">${value}</td>
            </tr>`;

/** Dựng nội dung email thông báo đăng nhập thành công (bảo mật tài khoản) */
const renderLoginNotificationEmail = (to, { fullName, studentId, className, loginAt = new Date() } = {}) => {
  const loginTime = formatDateTime(loginAt);
  const greetingName = fullName || 'bạn';
  const studentCode = studentId || 'Chưa cập nhật';
  const studentClass = className || 'Chưa cập nhật';

  const contentHtml = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2430;">Xin chào ${greetingName},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#3d4657;">
      Tài khoản của bạn đã được xác thực và đăng nhập thành công vào hệ thống <strong>${BRAND.name}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f6;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.6px;color:${BRAND.primary};text-transform:uppercase;">Chi tiết phiên đăng nhập</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${renderDetailRow('Email sinh viên', to)}
            ${renderDetailRow('Mã số sinh viên', studentCode)}
            ${renderDetailRow('Lớp', studentClass)}
            ${renderDetailRow('Thời gian', loginTime)}
            ${renderDetailRow('Trạng thái', 'Thành công', true)}
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#b91c1c;">
          <strong>Cảnh báo bảo mật:</strong> Nếu đây không phải là thao tác của bạn, vui lòng liên hệ ngay với
          Giảng viên cố vấn hoặc Ban quản trị hệ thống để bảo vệ tài khoản.
        </td>
      </tr>
    </table>`;

  const text = [
    `Xin chào ${greetingName},`,
    '',
    `Tài khoản của bạn đã được xác thực và đăng nhập thành công vào hệ thống ${BRAND.name}.`,
    '',
    '--- Chi tiết phiên đăng nhập ---',
    `Email sinh viên   : ${to}`,
    `Mã số sinh viên   : ${studentCode}`,
    `Lớp               : ${studentClass}`,
    `Thời gian         : ${loginTime}`,
    'Trạng thái        : Thành công',
    '',
    'Cảnh báo bảo mật: Nếu đây không phải là thao tác của bạn, vui lòng liên hệ ngay với Giảng viên cố vấn',
    'hoặc Ban quản trị hệ thống để bảo vệ tài khoản.',
    '',
    'Trân trọng,',
    `Nhóm phát triển ${BRAND.name}`,
    BRAND.university,
  ].join('\n');

  return {
    to,
    subject: 'SESS - CTUT: Thông báo đăng nhập thành công',
    text,
    html: renderEmailLayout({
      heading: 'Thông báo đăng nhập thành công',
      preheader: `Đăng nhập thành công vào ${BRAND.name} lúc ${loginTime}`,
      contentHtml,
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

module.exports = {
  sendMail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendProjectInvitationEmail,
  renderOtpEmail,
  renderWelcomeEmail,
  renderLoginNotificationEmail,
};

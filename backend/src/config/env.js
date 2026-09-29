const path = require('node:path');
const dotenv = require('dotenv');

// Luôn đọc file .env của backend dù chạy từ thư mục nào
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const env = {
  nodeEnv,
  isProduction,
  port: toInt(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sess_db',
  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'sess_dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sess_dev_refresh_secret_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  sessions: {
    maxActive: toInt(process.env.MAX_ACTIVE_SESSIONS, 5),
  },

  otp: {
    length: toInt(process.env.OTP_LENGTH, 6),
    expiresInMinutes: toInt(process.env.OTP_EXPIRES_MINUTES, 5),
    // Nhập sai quá số lần này -> huỷ OTP ngay (fail fast, chống brute-force)
    maxAttempts: toInt(process.env.OTP_MAX_ATTEMPTS, 3),
    // Chống spam: phải chờ đủ số giây này mới được yêu cầu gửi lại OTP
    resendCooldownSeconds: toInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    // CHỈ dùng cho dev: trả OTP trong response để test nhanh. Production luôn false.
    exposeInResponse: !isProduction && toBool(process.env.EXPOSE_OTP_IN_DEV, true),
  },

  rateLimit: {
    windowMinutes: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    apiMax: toInt(process.env.RATE_LIMIT_API_MAX, 300),
    authMax: toInt(process.env.RATE_LIMIT_AUTH_MAX, 100),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    // Chỉ cần khi exchange authorization code lấy token (luồng server-side);
    // verify idToken chỉ cần clientId.
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'SESS System <no-reply@ctuet.edu.vn>',
  },
};

if (env.isProduction) {
  const requiredKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URI'];
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`[ENV] Thiếu biến môi trường bắt buộc ở production: ${missing.join(', ')}`);
  }
}

module.exports = env;

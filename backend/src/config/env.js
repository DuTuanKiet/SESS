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
  corsOrigin: process.env.CORS_ORIGIN || (isProduction ? '' : '*'),

  // Hỗ trợ cả 2 nhánh: MONGO_URI (FR01-FR04) và MONGODB_URI (FR05-FR08)
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sess_db',
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

  // Redis (BullMQ + Rate Limiting). Thiếu REDIS_URL -> dùng host/port mặc định.
  // Ở development, nếu Redis không chạy thì hệ thống tự fallback sang chế độ không Redis.
  redis: {
    url: process.env.REDIS_URL || '',
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: toInt(process.env.REDIS_PORT, 6379),
    db: toInt(process.env.REDIS_DB, 0),
    password: process.env.REDIS_PASSWORD || '',
    // Bật/tắt hạ tầng queue (bullmq). false -> job chạy inline, không cần Redis.
    queueEnabled: toBool(process.env.REDIS_QUEUE_ENABLED, true),
    // Số job gửi email tối đa chạy song song
    emailConcurrency: toInt(process.env.QUEUE_EMAIL_CONCURRENCY, 5),
    uploadConcurrency: toInt(process.env.QUEUE_UPLOAD_CONCURRENCY, 3),
    auditConcurrency: toInt(process.env.QUEUE_AUDIT_CONCURRENCY, 5),
  },

  // Google reCAPTCHA v3. Thiếu secret -> middleware bỏ qua kiểm tra (dev) và ghi cảnh báo.
  recaptcha: {
    secret: process.env.RECAPTCHA_SECRET_KEY || '',
    scoreThreshold: Number.parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5'),
    // Bật kiểm tra reCAPTCHA cho endpoint nhạy cảm (login, import whitelist, voting)
    enabled: toBool(process.env.RECAPTCHA_ENABLED, true),
    // Bỏ qua kiểm tra trong môi trường dev khi chưa cấu hình secret
    skipWhenUnconfigured: !isProduction,
    verifyTimeoutMs: toInt(process.env.RECAPTCHA_VERIFY_TIMEOUT_MS, 5000),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    // Chỉ cần khi exchange authorization code lấy token (luồng server-side);
    // verify idToken chỉ cần clientId.
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // Salt để hash voterKey/IP của bình chọn công khai (không bao giờ lưu IP thô).
  // BẮT BUỘC đặt giá trị riêng ở production, nếu không mọi bình chọn sẽ dùng chung salt mặc định.
  voteHashSalt: process.env.VOTE_HASH_SALT || 'sess-vote-salt-dev',

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

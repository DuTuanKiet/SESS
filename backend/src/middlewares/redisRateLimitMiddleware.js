const { getRedisClient, isRedisAvailable } = require('../config/redis');
const ApiError = require('../utils/apiError');

/**
 * Rate Limiting dựa trên Redis (Enterprise Edition).
 *
 * MỤC TIÊU: triệt tiêu tool script auto-click / bot trên các endpoint công khai
 * (bình chọn công khai) và endpoint nhạy cảm (đăng nhập, import whitelist).
 *
 * THUẬT TOÁN: cửa sổ cố định (fixed window) với counter Redis:
 *   - INCR key   -> tăng bộ đếm
 *   - EXPIRE key -> đặt hạn khi đây là lần đầu trong cửa sổ
 *   - TTL key   -> số giây còn lại để client biết khi nào thử lại
 *
 * FALLBACK: nếu Redis không khả dụng -> dùng bộ đếm in-memory (đủ cho 1 instance dev).
 * Ứng dụng KHÔNG BAO GIỜ sập vì thiếu Redis.
 */

const memoryStore = new Map();
let memoryCleanupTimer = null;

/** Dọn bộ nhớ định kỳ để không phình vô hạn (chạy mỗi 5 phút) */
const scheduleMemoryCleanup = () => {
  if (memoryCleanupTimer) return;
  memoryCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt <= now) memoryStore.delete(key);
    }
  }, 5 * 60 * 1000);
  if (typeof memoryCleanupTimer.unref === 'function') memoryCleanupTimer.unref();
};

/** Bộ đếm in-memory (fallback) */
const hitMemory = (key, windowSeconds) => {
  scheduleMemoryCleanup();
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry = { count: 1, resetAt: now + windowSeconds * 1000 };
    memoryStore.set(key, entry);
    return { count: 1, resetAt: entry.resetAt, remaining: windowSeconds };
  }

  existing.count += 1;
  return {
    count: existing.count,
    resetAt: existing.resetAt,
    remaining: Math.max(0, Math.ceil((existing.resetAt - now) / 1000)),
  };
};

/** Bộ đếm Redis (primary) */
const hitRedis = async (key, windowSeconds) => {
  const client = getRedisClient();
  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, windowSeconds);
  }
  const ttl = await client.ttl(key);
  return {
    count,
    resetAt: Date.now() + Math.max(ttl, 0) * 1000,
    remaining: Math.max(ttl, 0),
  };
};

/** Tăng bộ đếm, tự chọn Redis hoặc in-memory */
const hitCounter = async (key, windowSeconds) => {
  try {
    if (await isRedisAvailable()) {
      return await hitRedis(key, windowSeconds);
    }
  } catch (error) {
    console.warn(`[RateLimit] Redis lỗi, dùng bộ đếm in-memory: ${error.message}`);
  }
  return hitMemory(key, windowSeconds);
};

/**
 * Hoàn trả 1 lượt đếm (dùng cho chế độ skipSuccessful: request thành công
 * thì không tính vào giới hạn, chỉ request lỗi mới tích luỹ).
 */
const releaseCounter = async (key) => {
  try {
    if (await isRedisAvailable()) {
      const client = getRedisClient();
      const remaining = await client.decr(key);
      if (remaining <= 0) await client.del(key);
      return;
    }
  } catch (error) {
    console.warn(`[RateLimit] Redis lỗi khi hoàn trả lượt đếm: ${error.message}`);
  }

  const entry = memoryStore.get(key);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count <= 0) memoryStore.delete(key);
};

/** Lấy định danh của client (user đã đăng nhập thì ưu tiên userId, không thì IP) */
const resolveClientKey = (req) => {
  if (req.user?.id) return `u:${req.user.id}`;
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.ip || 'unknown';
  return `ip:${ip}`;
};

/**
 * Tạo middleware rate limit.
 * @param {object} options
 * @param {number} options.max           Số request tối đa trong 1 cửa sổ
 * @param {number} [options.windowSeconds]  Độ dài cửa sổ (giây), mặc định 60
 * @param {string} [options.scope]        Tiền tố namespace của limiter
 * @param {string} [options.message]      Thông báo trả về khi vượt giới hạn
 * @param {string} [options.code]         Mã lỗi trả về
 * @param {boolean} [options.skipSuccessful] Chỉ tính các request lỗi (mặc định false)
 */
const createRedisRateLimiter = ({
  max,
  windowSeconds = 60,
  scope = 'default',
  message = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
  code = 'RATE_LIMIT_EXCEEDED',
  skipSuccessful = false,
}) => {
  const limiter = async (req, res, next) => {
    const key = `ratelimit:${scope}:${resolveClientKey(req)}`;

    const result = await hitCounter(key, windowSeconds);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - result.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (result.count > max) {
      res.setHeader('Retry-After', String(result.remaining));
      return next(ApiError.tooManyRequests(message, code, { retryAfter: result.remaining }));
    }

    if (skipSuccessful) {
      res.on('finish', () => {
        // Request thành công -> hoàn trả lượt đếm, chỉ request lỗi mới bị tính
        if (res.statusCode < 400) {
          releaseCounter(key).catch(() => {});
        }
      });
    }

    return next();
  };

  limiter.scope = scope;
  limiter.max = max;
  limiter.windowSeconds = windowSeconds;
  return limiter;
};

/**
 * Tạo limiter giới hạn theo IP (dùng cho endpoint công khai như voting).
 * Mặc định: 10 request / 60 giây / 1 IP.
 */
const createPublicEndpointLimiter = ({
  max = 10,
  windowSeconds = 60,
  scope = 'public',
  message = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  code = 'RATE_LIMIT_EXCEEDED',
} = {}) => createRedisRateLimiter({ max, windowSeconds, scope, message, code });

/** Bộ đếm dùng chung cho kiểm thử / dọn dữ liệu */
const resetMemoryStore = () => memoryStore.clear();

module.exports = {
  createRedisRateLimiter,
  createPublicEndpointLimiter,
  hitCounter,
  releaseCounter,
  resolveClientKey,
  resetMemoryStore,
  memoryStore,
};

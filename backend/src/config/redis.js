const Redis = require('ioredis');
const env = require('./env');

/**
 * Cấu hình kết nối Redis (Enterprise Edition - BullMQ + Rate Limiting).
 *
 * NGUYÊN TẮC: KHÔNG BAO GIỜ làm sập ứng dụng khi Redis không khả dụng.
 * - `lazyConnect: true` -> không mở socket ngay lúc require.
 * - `maxRetriesPerRequest: null` -> BẮT BUỘC cho BullMQ (BullMQ cần retry thủ công).
 * - `enableOfflineQueue: false` -> lệnh không được xếp hàng chờ -> lỗi nhanh,
 *   giúp fallback sang chế độ in-memory/dev diễn ra mượt mà.
 */

let redisClient = null;
let redisStatus = 'unknown'; // unknown | connected | unavailable
let statusPromise = null;

/** Tạo client ioredis mới (chưa connect) */
const createClient = () => {
  const options = {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    connectTimeout: 3000,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  };

  if (env.redis.url) {
    return new Redis(env.redis.url, options);
  }

  return new Redis({
    host: env.redis.host,
    port: env.redis.port,
    db: env.redis.db,
    password: env.redis.password || undefined,
    ...options,
  });
};

/** Lấy singleton client (tự connect lazy) */
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient();
    redisClient.on('error', (error) => {
      redisStatus = 'unavailable';
      console.warn(`[Redis] Lỗi kết nối (sẽ fallback về chế độ không Redis): ${error.message}`);
    });
    redisClient.on('ready', () => {
      redisStatus = 'connected';
    });
    redisClient.on('end', () => {
      redisStatus = 'unavailable';
    });
  }
  return redisClient;
};

/** Kiểm tra Redis có sẵn sàng hay không (PING với timeout ngắn) */
const isRedisAvailable = async () => {
  if (redisStatus === 'connected') return true;
  if (redisStatus === 'unavailable') return false;

  if (!statusPromise) {
    statusPromise = (async () => {
      try {
        const client = getRedisClient();
        if (client.status === 'wait') await client.connect();
        // Sau khi connect() thất bại, ioredis chuyển status sang 'end' ->
        // gọi ping() lúc này chỉ tạo thêm lỗi "Connection is closed" gây nhiễu log.
        if (client.status !== 'ready') {
          redisStatus = 'unavailable';
          return false;
        }
        const reply = await client.ping();
        redisStatus = reply === 'PONG' ? 'connected' : 'unavailable';
      } catch (error) {
        redisStatus = 'unavailable';
        // Lỗi gốc (vd ECONNREFUSED) đã được in bởi event 'error' ở trên.
        // Bỏ qua thông báo trùng lặp "Connection is closed." để log gọn gàng.
        if (!/connection is closed/i.test(error.message)) {
          console.warn(
            `[Redis] Không kết nối được (${error.message}). Hệ thống chuyển sang chế độ fallback không Redis.`,
          );
        }
      } finally {
        statusPromise = null;
      }
      return redisStatus === 'connected';
    })();
  }

  return statusPromise;
};

/** Trạng thái hiện tại của Redis (để hiển thị trong health check) */
const getRedisStatus = () => redisStatus;

/**
 * Chạy 1 hàm với Redis; nếu Redis lỗi -> chạy fallback.
 * Đảm bảo ứng dụng KHÔNG BAO GIỜ sập vì hạ tầng Redis.
 */
const withRedisFallback = async (fn, fallback) => {
  try {
    if (!(await isRedisAvailable())) {
      return typeof fallback === 'function' ? await fallback() : undefined;
    }
    return await fn();
  } catch (error) {
    console.warn(`[Redis] Thao tác thất bại, dùng fallback: ${error.message}`);
    return typeof fallback === 'function' ? await fallback() : undefined;
  }
};

/** Đóng kết nối (dùng khi shutdown app) */
const closeRedis = async () => {
  if (!redisClient) return;
  const client = redisClient;
  redisClient = null;
  redisStatus = 'unknown';
  try {
    // Chỉ gọi quit() khi client thực sự đang kết nối, nếu không ioredis sẽ
    // phát sinh lỗi "Connection is closed" gây nhiễu log khi shutdown.
    if (client.status === 'ready' || client.status === 'connecting') {
      await client.quit();
    } else {
      client.disconnect();
    }
  } catch {
    client.disconnect();
  }
};

module.exports = {
  getRedisClient,
  isRedisAvailable,
  getRedisStatus,
  withRedisFallback,
  closeRedis,
};

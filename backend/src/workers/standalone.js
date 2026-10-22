/**
 * Entry point chạy BullMQ Worker trong process riêng (khuyến nghị cho Production).
 *
 *   node src/workers/standalone.js
 *
 * Worker độc lập giúp tách tải xử lý nền khỏi API server:
 * - API server chỉ nhận request và đẩy job vào Redis
 * - Worker process ghi log, gửi email, xác nhận upload
 */
const { startAllWorkers, stopAllWorkers } = require('./index');
const { closeRedis } = require('../config/redis');

const bootstrap = async () => {
  const result = await startAllWorkers();

  if (!result.started) {
    console.log(
      `[Worker:standalone] Không khởi động được worker (${result.reason}). ` +
        'Hệ thống sẽ chạy inline fallback trong API server. Thoát.',
    );
    await closeRedis();
    process.exit(0);
  }

  console.log(`[Worker:standalone] Đang chạy ${result.workers.length} worker. Nhấn Ctrl+C để dừng.`);

  const shutdown = async (signal) => {
    console.log(`[Worker:standalone] Nhận ${signal}, đang dừng worker...`);
    await stopAllWorkers();
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap().catch((error) => {
  console.error('[Worker:standalone] Lỗi khởi động:', error);
  process.exit(1);
});

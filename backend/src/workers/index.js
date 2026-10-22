const { Worker } = require('bullmq');
const env = require('../config/env');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { QUEUE_NAMES } = require('../queues/queueNames');
const { processEmailJob } = require('./processors/emailProcessor');
const { processUploadJob } = require('./processors/cloudUploadProcessor');
const { processAuditJob } = require('./processors/auditProcessor');

/**
 * Khởi tạo các Worker BullMQ (Enterprise Edition).
 *
 * Worker có thể chạy:
 * - Cùng process với API server (mặc định) -> `startAllWorkers()` trong server.js
 * - Hoặc tách process riêng (khuyến nghị cho production) -> `node src/workers/standalone.js`
 *
 * Nếu Redis không khả dụng -> KHÔNG khởi động worker, các job chạy inline
 * qua queueService (fallback) nên ứng dụng vẫn hoạt động bình thường.
 */

const workerInstances = new Map();

/** Tạo 1 Worker với xử lý lỗi/logging chuẩn */
const createWorker = (queueName, processor, concurrency) => {
  const worker = new Worker(queueName, processor, {
    connection: getRedisClient(),
    concurrency,
  });

  worker.on('completed', (job) => {
    console.log(`[Worker:${queueName}] Hoàn tất job ${job.name} #${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker:${queueName}] Job ${job?.name} #${job?.id} thất bại: ${error?.message}`);
  });

  worker.on('error', (error) => {
    console.error(`[Worker:${queueName}] Lỗi worker: ${error.message}`);
  });

  workerInstances.set(queueName, worker);
  return worker;
};

/** Khởi động toàn bộ worker (chỉ khi Redis sẵn sàng) */
const startAllWorkers = async () => {
  if (!env.redis.queueEnabled) {
    console.log('[Worker] REDIS_QUEUE_ENABLED=false -> bỏ qua worker, chạy inline fallback.');
    return { started: false, reason: 'DISABLED', workers: [] };
  }

  if (!(await isRedisAvailable())) {
    console.warn(
      '[Worker] Không có Redis -> bỏ qua worker, các tác vụ nền chạy inline fallback (dev mode).',
    );
    return { started: false, reason: 'REDIS_UNAVAILABLE', workers: [] };
  }

  const started = [];

  createWorker(QUEUE_NAMES.EMAIL, processEmailJob, env.redis.emailConcurrency);
  started.push(QUEUE_NAMES.EMAIL);

  createWorker(QUEUE_NAMES.CLOUD_UPLOAD, processUploadJob, env.redis.uploadConcurrency);
  started.push(QUEUE_NAMES.CLOUD_UPLOAD);

  createWorker(QUEUE_NAMES.AUDIT, processAuditJob, env.redis.auditConcurrency);
  started.push(QUEUE_NAMES.AUDIT);

  console.log(`[Worker] Đã khởi động ${started.length} worker: ${started.join(', ')}`);
  return { started: true, workers: started };
};

/** Dừng toàn bộ worker (dùng khi shutdown) */
const stopAllWorkers = async () => {
  for (const [, worker] of workerInstances) {
    try {
      await worker.close();
    } catch {
      // Bỏ qua lỗi khi đóng worker
    }
  }
  workerInstances.clear();
};

module.exports = { startAllWorkers, stopAllWorkers, workerInstances };

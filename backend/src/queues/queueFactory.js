const { Queue } = require('bullmq');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { QUEUE_NAMES } = require('./queueNames');

/**
 * Factory tạo BullMQ Queue với kết nối Redis dùng chung.
 * Không tạo Queue khi Redis chưa sẵn sàng -> trả null để caller chạy fallback inline.
 */

const queueInstances = new Map();

/** Tạo Queue mới cho 1 tên queue */
const createQueue = async (queueName, defaultJobOptions = {}) => {
  if (queueInstances.has(queueName)) return queueInstances.get(queueName);

  if (!(await isRedisAvailable())) return null;

  const queue = new Queue(queueName, {
    connection: getRedisClient(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      ...defaultJobOptions,
    },
  });

  queue.on('error', (error) => {
    console.error(`[Queue:${queueName}] Lỗi queue: ${error.message}`);
  });

  queueInstances.set(queueName, queue);
  return queue;
};

/** Lấy (hoặc tạo) Queue theo tên; null nếu Redis không khả dụng */
const getQueue = async (queueName, defaultJobOptions) => createQueue(queueName, defaultJobOptions);

/** Đóng toàn bộ Queue (dùng khi shutdown) */
const closeAllQueues = async () => {
  for (const [, queue] of queueInstances) {
    try {
      await queue.close();
    } catch {
      // Bỏ qua lỗi khi đóng
    }
  }
  queueInstances.clear();
};

module.exports = { getQueue, createQueue, closeAllQueues, QUEUE_NAMES };

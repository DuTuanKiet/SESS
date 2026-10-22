const { getQueue } = require('../queues/queueFactory');
const { QUEUE_NAMES, JOB_NAMES, JOB_ATTEMPTS } = require('../queues/queueNames');
const { isRedisAvailable } = require('../config/redis');
const { processEmailJob } = require('../workers/processors/emailProcessor');
const { processUploadJob } = require('../workers/processors/cloudUploadProcessor');
const { processAuditJob } = require('../workers/processors/auditProcessor');
const env = require('../config/env');

/**
 * QueueService - facade duy nhất để đẩy tác vụ nặng vào hàng đợi BullMQ.
 *
 * HỢP ĐỒNG:
 * - Nếu Redis khả dụng -> job được đẩy vào queue, request trả về ngay (fire & forget).
 * - Nếu Redis KHÔNG khả dụng (dev local) -> job chạy INLINE với ĐÚNG processor của worker,
 *   nên hành vi nghiệp vụ luôn nhất quán dù có Redis hay không.
 * - Lỗi trong job nền KHÔNG BAO GIỜ làm hỏng luồng nghiệp vụ chính (chỉ log ra console).
 */

/** Đẩy 1 job vào queue; trả null nếu không thể đẩy (Redis lỗi) */
const pushJob = async (queueName, jobName, data, options = {}) => {
  if (!env.redis.queueEnabled) return null;

  try {
    const queue = await getQueue(queueName);
    if (!queue) return null;

    const job = await queue.add(jobName, data, {
      attempts: JOB_ATTEMPTS[jobName] ?? 3,
      ...options,
    });
    return job;
  } catch (error) {
    console.warn(`[Queue] Không đẩy được job "${jobName}" vào "${queueName}": ${error.message}`);
    return null;
  }
};

/** Chạy processor inline (fallback khi không có Redis) */
const runInline = async (processor, jobName, data) => {
  try {
    return await processor({ name: jobName, data });
  } catch (error) {
    console.error(`[Queue] Job inline "${jobName}" thất bại: ${error.message}`);
    return null;
  }
};

/** Đẩy email biên nhận số (1 dự án) */
const enqueueDigitalReceiptEmail = async ({ to, payload }) => {
  const job = await pushJob(QUEUE_NAMES.EMAIL, JOB_NAMES.DIGITAL_RECEIPT, { to, payload });
  if (job) return { queued: true, jobId: job.id };
  await runInline(processEmailJob, JOB_NAMES.DIGITAL_RECEIPT, { to, payload });
  return { queued: false, inline: true };
};

/** Đẩy email biên nhận số hàng loạt (nhiều dự án) */
const enqueueBulkDigitalReceiptEmail = async ({ items }) => {
  const job = await pushJob(QUEUE_NAMES.EMAIL, JOB_NAMES.BULK_DIGITAL_RECEIPT, { items });
  if (job) return { queued: true, jobId: job.id };
  await runInline(processEmailJob, JOB_NAMES.BULK_DIGITAL_RECEIPT, { items });
  return { queued: false, inline: true };
};

/** Đẩy email mời tham gia dự án */
const enqueueProjectInvitationEmail = async ({ to, payload }) => {
  const job = await pushJob(QUEUE_NAMES.EMAIL, JOB_NAMES.PROJECT_INVITATION, { to, payload });
  if (job) return { queued: true, jobId: job.id };
  await runInline(processEmailJob, JOB_NAMES.PROJECT_INVITATION, { to, payload });
  return { queued: false, inline: true };
};

/** Đẩy xác nhận upload cloud (HEAD tới storage) */
const enqueueConfirmUpload = async (data) => {
  const job = await pushJob(QUEUE_NAMES.CLOUD_UPLOAD, JOB_NAMES.CONFIRM_UPLOAD, data);
  if (job) return { queued: true, jobId: job.id };
  await runInline(processUploadJob, JOB_NAMES.CONFIRM_UPLOAD, data);
  return { queued: false, inline: true };
};

/** Đẩy ghi audit log hàng loạt */
const enqueueAuditBatch = async (entries) => {
  if (!Array.isArray(entries) || !entries.length) return { queued: false, skipped: true };

  const job = await pushJob(QUEUE_NAMES.AUDIT, JOB_NAMES.BATCH_WRITE, { entries });
  if (job) return { queued: true, jobId: job.id };
  await runInline(processAuditJob, JOB_NAMES.BATCH_WRITE, { entries });
  return { queued: false, inline: true };
};

/** Trạng thái hạ tầng queue (để health check) */
const getQueueStatus = async () => {
  const redisAvailable = await isRedisAvailable();
  return {
    redisAvailable,
    queueEnabled: env.redis.queueEnabled,
    mode: redisAvailable && env.redis.queueEnabled ? 'bullmq' : 'inline-fallback',
  };
};

module.exports = {
  enqueueDigitalReceiptEmail,
  enqueueBulkDigitalReceiptEmail,
  enqueueProjectInvitationEmail,
  enqueueConfirmUpload,
  enqueueAuditBatch,
  getQueueStatus,
  pushJob,
  QUEUE_NAMES,
  JOB_NAMES,
};

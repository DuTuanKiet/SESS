const AuditLog = require('../../models/AuditLog');
const { JOB_NAMES } = require('../../queues/queueNames');

/**
 * Processor cho Audit Queue (BullMQ).
 * Ghi log hàng loạt bằng `insertMany` (1 lần ghi thay vì N lần) để bảo vệ
 * MongoDB khỏi Write Lock khi hệ thống sinh ra nhiều sự kiện cùng lúc.
 */

/** Ghi nhiều Audit Log trong 1 lần insertMany */
const processBatchAuditWrite = async (data) => {
  const { entries = [] } = data;
  if (!entries.length) return { inserted: 0 };

  const documents = entries.map((entry) => {
    const actorId = entry.actor?._id ?? entry.actorId ?? entry.actor ?? null;
    return {
      actorId,
      actorEmail: entry.actor?.email ?? entry.actorEmail ?? '',
      userId: actorId,
      action: entry.action,
      targetEntity: entry.targetEntity,
      targetId: entry.targetId ?? null,
      oldValues: entry.oldValues ?? null,
      newValues: entry.newValues ?? null,
      ipAddress: entry.ipAddress ?? '',
      timestamp: entry.timestamp ?? new Date(),
    };
  });

  const inserted = await AuditLog.insertMany(documents, { ordered: false });
  return { inserted: inserted.length };
};

/** Dispatcher theo tên job */
const AUDIT_PROCESSORS = {
  [JOB_NAMES.BATCH_WRITE]: processBatchAuditWrite,
};

/** Hàm xử lý chung cho Worker */
const processAuditJob = async (job) => {
  const processor = AUDIT_PROCESSORS[job.name];
  if (!processor) {
    throw new Error(`Không có processor cho audit job "${job.name}"`);
  }
  return processor(job.data);
};

module.exports = {
  processAuditJob,
  processBatchAuditWrite,
  AUDIT_PROCESSORS,
};

/**
 * Tên các Job Queue (BullMQ) - Enterprise Edition.
 * Tách riêng 1 file để tránh phụ thuộc vòng (circular dependency) giữa queue/service/worker.
 */
const QUEUE_NAMES = Object.freeze({
  EMAIL: 'sess-email-queue',
  CLOUD_UPLOAD: 'sess-cloud-upload-queue',
  AUDIT: 'sess-audit-queue',
});

/** Tên job cụ thể trong từng queue */
const JOB_NAMES = Object.freeze({
  // EMAIL
  DIGITAL_RECEIPT: 'digital-receipt',
  PROJECT_INVITATION: 'project-invitation',
  BULK_DIGITAL_RECEIPT: 'bulk-digital-receipt',
  // CLOUD_UPLOAD
  CONFIRM_UPLOAD: 'confirm-upload',
  VERIFY_UPLOAD: 'verify-upload',
  // AUDIT
  BATCH_WRITE: 'batch-write',
});

/** Số lần thử lại tối đa cho mỗi loại job */
const JOB_ATTEMPTS = Object.freeze({
  [JOB_NAMES.DIGITAL_RECEIPT]: 3,
  [JOB_NAMES.PROJECT_INVITATION]: 3,
  [JOB_NAMES.BULK_DIGITAL_RECEIPT]: 3,
  [JOB_NAMES.CONFIRM_UPLOAD]: 5,
  [JOB_NAMES.VERIFY_UPLOAD]: 5,
  [JOB_NAMES.BATCH_WRITE]: 3,
});

module.exports = { QUEUE_NAMES, JOB_NAMES, JOB_ATTEMPTS };

const cloudUploadService = require('../../services/cloudUploadService');
const CloudFileUpload = require('../../models/CloudFileUpload');
const { JOB_NAMES } = require('../../queues/queueNames');

/**
 * Processor cho Cloud Upload Queue (BullMQ).
 * Xác nhận/xác minh file đã upload lên Cloud Storage là tác vụ I/O chậm
 * (gọi HEAD tới S3/MinIO) -> đưa vào queue để không chặn request và giảm tải MongoDB.
 */

/** Xác nhận file đã upload xong (gọi sau khi client PUT lên storage) */
const processConfirmUpload = async (data) => {
  const { objectKey, fileType, fileSize, checksum, uploadedBy } = data;

  const confirmed = await cloudUploadService.confirmUpload({
    objectKey,
    fileType,
    fileSize,
    checksum,
  });

  const fileRecord = await CloudFileUpload.findOne({ objectKey, uploadedBy });
  if (fileRecord) {
    fileRecord.status = 'completed';
    fileRecord.publicUrl = confirmed.publicUrl || '';
    fileRecord.checksum = checksum || '';
    await fileRecord.save();
  }

  return { objectKey, status: 'completed', fileRecordUpdated: Boolean(fileRecord) };
};

/** Xác minh trạng thái file đã lưu trong DB (dùng cho job định kỳ) */
const processVerifyUpload = async (data) => {
  const { objectKey } = data;
  const fileRecord = await CloudFileUpload.findOne({ objectKey }).lean();
  if (!fileRecord) {
    return { objectKey, found: false };
  }
  return {
    objectKey,
    found: true,
    status: fileRecord.status,
    fileSize: fileRecord.fileSize,
    publicUrl: fileRecord.publicUrl || '',
  };
};

/** Dispatcher theo tên job */
const UPLOAD_PROCESSORS = {
  [JOB_NAMES.CONFIRM_UPLOAD]: processConfirmUpload,
  [JOB_NAMES.VERIFY_UPLOAD]: processVerifyUpload,
};

/** Hàm xử lý chung cho Worker */
const processUploadJob = async (job) => {
  const processor = UPLOAD_PROCESSORS[job.name];
  if (!processor) {
    throw new Error(`Không có processor cho upload job "${job.name}"`);
  }
  return processor(job.data);
};

module.exports = {
  processUploadJob,
  processConfirmUpload,
  processVerifyUpload,
  UPLOAD_PROCESSORS,
};

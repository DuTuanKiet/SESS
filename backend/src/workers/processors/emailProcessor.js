const mailerService = require('../../services/mailerService');
const { JOB_NAMES } = require('../../queues/queueNames');

/**
 * Processor cho Email Queue (BullMQ).
 * Mỗi processor là hàm thuần: nhận `data`, trả về kết quả (không throw để job retry).
 * Dùng chung cho cả 2 đường: (1) chạy qua BullMQ, (2) fallback inline khi thiếu Redis.
 */

/** Gửi email biên nhận số cho 1 dự án */
const processDigitalReceiptEmail = async (data) => {
  const { to, payload } = data;
  await mailerService.sendDigitalReceiptEmail(to, payload);
  return { sent: true, to, projectCode: payload?.projectCode ?? '' };
};

/** Gửi email biên nhận số hàng loạt (nhiều dự án) - tách bạch để không nghẽn 1 lần gửi */
const processBulkDigitalReceiptEmail = async (data) => {
  const { items = [] } = data;
  const results = { total: items.length, sent: 0, failed: 0, errors: [] };

  for (const item of items) {
    try {
      await mailerService.sendDigitalReceiptEmail(item.to, item.payload);
      results.sent += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({ to: item.to, reason: error.message });
    }
  }

  return results;
};

/** Gửi email mời tham gia dự án */
const processProjectInvitationEmail = async (data) => {
  const { to, payload } = data;
  await mailerService.sendProjectInvitationEmail(to, payload);
  return { sent: true, to };
};

/** Dispatcher theo tên job */
const EMAIL_PROCESSORS = {
  [JOB_NAMES.DIGITAL_RECEIPT]: processDigitalReceiptEmail,
  [JOB_NAMES.BULK_DIGITAL_RECEIPT]: processBulkDigitalReceiptEmail,
  [JOB_NAMES.PROJECT_INVITATION]: processProjectInvitationEmail,
};

/** Hàm xử lý chung cho Worker */
const processEmailJob = async (job) => {
  const processor = EMAIL_PROCESSORS[job.name];
  if (!processor) {
    throw new Error(`Không có processor cho email job "${job.name}"`);
  }
  return processor(job.data);
};

module.exports = {
  processEmailJob,
  processDigitalReceiptEmail,
  processBulkDigitalReceiptEmail,
  processProjectInvitationEmail,
  EMAIL_PROCESSORS,
};

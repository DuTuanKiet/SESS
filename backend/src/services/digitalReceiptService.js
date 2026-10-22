const crypto = require('node:crypto');

/**
 * Dịch vụ sinh Biên nhận số (Digital Receipt) - Enterprise Edition.
 * Mã hash = SHA-256(projectCode + version + timestampMillis + randomSalt).
 * Lưu vào DB và dùng để xác nhận nộp bài duy nhất, không thể giả mạo.
 */

/** Sinh mã hash biên nhận số */
const generateDigitalReceiptHash = ({ projectCode, version, timestampMillis }) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const payload = `${projectCode}|${version}|${timestampMillis}|${salt}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/** Sinh đối tượng biên nhận số hoàn chỉnh */
const createDigitalReceipt = ({ projectCode, version }) => {
  const timestampMillis = Date.now();
  const hash = generateDigitalReceiptHash({ projectCode, version, timestampMillis });
  return {
    hash,
    timestamp: new Date(timestampMillis),
    timestampMillis,
  };
};

/** Xác thực mã hash biên nhận (tái sinh và so sánh) */
const verifyDigitalReceiptHash = ({ projectCode, version, timestampMillis, hash }) => {
  const expected = generateDigitalReceiptHash({ projectCode, version, timestampMillis });
  return expected === hash;
};

module.exports = {
  generateDigitalReceiptHash,
  createDigitalReceipt,
  verifyDigitalReceiptHash,
};

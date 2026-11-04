const crypto = require('node:crypto');

/**
 * Creates a SHA-256 receipt over submission metadata and canonical snapshot data.
 * The immutable revision snapshot can be used later to verify the stored hash.
 */

const toCanonicalValue = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toCanonicalValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      if (value[key] !== undefined) result[key] = toCanonicalValue(value[key]);
      return result;
    }, {});
  }
  return value;
};

/** Hash biên nhận bao phủ cả metadata lần nộp và snapshot bất biến. */
const generateDigitalReceiptHash = ({ projectCode, version, timestampMillis, snapshotData = null }) => {
  const payload = JSON.stringify(toCanonicalValue({ projectCode, version, timestampMillis, snapshotData }));
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/** Sinh đối tượng biên nhận số hoàn chỉnh */
const createDigitalReceipt = ({ projectCode, version, snapshotData = null }) => {
  const timestampMillis = Date.now();
  const hash = generateDigitalReceiptHash({ projectCode, version, timestampMillis, snapshotData });
  return {
    hash,
    timestamp: new Date(timestampMillis),
    timestampMillis,
  };
};

/** Xác thực mã hash biên nhận (tái sinh và so sánh) */
const verifyDigitalReceiptHash = ({ projectCode, version, timestampMillis, snapshotData = null, hash }) => {
  if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) return false;
  const expected = generateDigitalReceiptHash({ projectCode, version, timestampMillis, snapshotData });
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash, 'hex'));
};

module.exports = {
  generateDigitalReceiptHash,
  createDigitalReceipt,
  verifyDigitalReceiptHash,
};

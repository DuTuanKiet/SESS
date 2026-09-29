const crypto = require('node:crypto');

/** Hash 1 chiều (SHA-256) dùng cho OTP và refresh token trước khi lưu DB */
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** Sinh mã OTP gồm toàn chữ số bằng CSPRNG (mặc định 6 số) */
const generateNumericCode = (length = 6) => {
  let code = '';
  while (code.length < length) code += crypto.randomInt(0, 10);
  return code;
};

/** So sánh 2 chuỗi hash theo kiểu chống timing attack */
const safeEqual = (first, second) => {
  const bufferA = Buffer.from(String(first));
  const bufferB = Buffer.from(String(second));
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
};

module.exports = { sha256, generateNumericCode, safeEqual };

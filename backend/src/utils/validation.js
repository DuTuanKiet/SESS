const ApiError = require('./apiError');

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

/** Email sinh viên chính thức của trường: <mssv>@student.ctuet.edu.vn */
const STUDENT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.ctuet\.edu\.vn$/i;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

const assertRequired = (value, fieldName) => {
  if (!isNonEmptyString(value)) throw ApiError.badRequest(`Thiếu thông tin bắt buộc: "${fieldName}"`, 'MISSING_FIELD');
  return value.trim();
};

const assertEmail = (email, fieldName = 'email') => {
  const normalized = normalizeEmail(email);
  if (!isNonEmptyString(normalized) || !EMAIL_REGEX.test(normalized)) {
    throw ApiError.badRequest(`"${fieldName}" không phải là email hợp lệ`, 'INVALID_EMAIL');
  }
  return normalized;
};

const isStudentEmail = (email) => STUDENT_EMAIL_REGEX.test(normalizeEmail(email));

/**
 * Bắt buộc email thuộc tên miền sinh viên của trường.
 * Dùng cho luồng Google tự khởi tạo tài khoản: email ngoài domain -> 403 DOMAIN_NOT_ALLOWED
 */
const assertStudentEmail = (email) => {
  const normalized = assertEmail(email);
  if (!isStudentEmail(normalized)) {
    throw ApiError.forbidden(
      'Email phải thuộc tên miền sinh viên @student.ctuet.edu.vn hoặc đã được nhà trường cấp tài khoản',
      'DOMAIN_NOT_ALLOWED',
    );
  }
  return normalized;
};

/**
 * Trích xuất MSSV từ email sinh viên (VD: 110122001@student.ctuet.edu.vn -> 110122001).
 * Trả về undefined nếu phần tên email không giống MSSV (không có chữ số / quá ngắn).
 */
const extractStudentIdFromEmail = (email) => {
  if (!isStudentEmail(email)) return undefined;

  const localPart = normalizeEmail(email).split('@')[0] ?? '';
  const studentId = localPart.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return /\d/.test(studentId) && studentId.length >= 5 ? studentId : undefined;
};

/** Chuỗi tuỳ chọn (bỏ trống được) - dùng cho bio, phone, avatarUrl... */
const assertOptionalString = (value, fieldName, maxLength = 255) => {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== 'string') throw ApiError.badRequest(`"${fieldName}" phải là chuỗi`, 'INVALID_FIELD');

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw ApiError.badRequest(`"${fieldName}" không được vượt quá ${maxLength} ký tự`, 'INVALID_FIELD');
  }
  return trimmed;
};

/** Mảng chuỗi (VD: skills) */
const assertStringArray = (value, fieldName, { maxItems = 20, maxLength = 60 } = {}) => {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) throw ApiError.badRequest(`"${fieldName}" phải là mảng chuỗi`, 'INVALID_FIELD');
  if (value.length > maxItems) {
    throw ApiError.badRequest(`"${fieldName}" chỉ được tối đa ${maxItems} phần tử`, 'INVALID_FIELD');
  }

  return value.map((item) => {
    if (!isNonEmptyString(item)) {
      throw ApiError.badRequest(`Mỗi phần tử của "${fieldName}" phải là chuỗi không rỗng`, 'INVALID_FIELD');
    }
    const trimmed = item.trim();
    if (trimmed.length > maxLength) {
      throw ApiError.badRequest(`Mỗi phần tử của "${fieldName}" tối đa ${maxLength} ký tự`, 'INVALID_FIELD');
    }
    return trimmed;
  });
};

/** URL tuỳ chọn (http/https); chuỗi rỗng = xoá giá trị */
const assertOptionalUrl = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === '') return '';

  const url = String(value).trim();
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw ApiError.badRequest(`"${fieldName}" phải là URL hợp lệ (http/https)`, 'INVALID_URL');
  }
  return url;
};

/** Số điện thoại Việt Nam (0xxxxxxxxx hoặc +84xxxxxxxxx) */
const assertOptionalPhone = (value, fieldName = 'phone') => {
  if (value === undefined || value === null || String(value).trim() === '') return '';

  const phone = String(value).trim();
  if (!/^(0|\+84)\d{8,10}$/.test(phone)) {
    throw ApiError.badRequest(`"${fieldName}" không đúng định dạng số điện thoại Việt Nam`, 'INVALID_PHONE');
  }
  return phone;
};

const assertNumericCode = (code, length = 6, fieldName = 'otp') => {
  const pattern = new RegExp(`^\\d{${length}}$`);
  if (!pattern.test(String(code ?? '').trim())) {
    throw ApiError.badRequest(`"${fieldName}" phải là chuỗi ${length} chữ số`, 'INVALID_OTP_FORMAT');
  }
  return String(code).trim();
};

const assertEnum = (value, allowedValues, fieldName, code = 'INVALID_VALUE') => {
  if (!allowedValues.includes(value)) {
    throw ApiError.badRequest(`Giá trị "${fieldName}" không hợp lệ. Chỉ chấp nhận: ${allowedValues.join(', ')}`, code);
  }
  return value;
};

module.exports = {
  EMAIL_REGEX,
  STUDENT_EMAIL_REGEX,
  isNonEmptyString,
  normalizeEmail,
  isStudentEmail,
  extractStudentIdFromEmail,
  assertRequired,
  assertEmail,
  assertStudentEmail,
  assertOptionalString,
  assertStringArray,
  assertOptionalUrl,
  assertOptionalPhone,
  assertNumericCode,
  assertEnum,
};

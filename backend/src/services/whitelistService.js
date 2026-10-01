const StudentWhitelist = require('../models/StudentWhitelist');
const ApiError = require('../utils/apiError');
const { normalizeEmail } = require('../utils/validation');
const { STUDENT_NOT_IN_WHITELIST_MESSAGE } = require('../utils/constants');

/** Tìm thông tin sinh viên trong danh sách nhà trường (null nếu không tồn tại) */
const findStudentByEmail = (email) => StudentWhitelist.findOne({ email: normalizeEmail(email) });

/**
 * BẮT BUỘC: email sinh viên phải có trong danh sách sinh viên của trường mới được tiếp tục.
 * Fail fast: chặn ngay với 403 STUDENT_NOT_IN_WHITELIST kèm hướng dẫn liên hệ CVHT.
 */
const assertStudentInWhitelist = async (email) => {
  const student = await findStudentByEmail(email);

  // Fail fast: 404 + mã lỗi riêng, TUYỆT ĐỐI không sinh OTP / gửi email ở nhánh này
  if (!student) {
    throw ApiError.notFound(STUDENT_NOT_IN_WHITELIST_MESSAGE, 'STUDENT_NOT_IN_WHITELIST');
  }

  return student;
};

module.exports = { findStudentByEmail, assertStudentInWhitelist };

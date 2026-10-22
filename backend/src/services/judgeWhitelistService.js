const JudgeWhitelist = require('../models/JudgeWhitelist');
const ApiError = require('../utils/apiError');
const { normalizeEmail } = require('../utils/validation');

/** Tìm thông tin giám khảo trong danh sách trắng (null nếu không tồn tại) */
const findJudgeByEmail = (email) =>
  JudgeWhitelist.findOne({ email: normalizeEmail(email) });

const findJudgeByStaffCode = (staffCode) =>
  JudgeWhitelist.findOne({ staffCode: String(staffCode ?? '').trim().toUpperCase() });

/**
 * BẮT BUỘC: email phải có trong danh sách trắng Ban Giám khảo
 * mới được phép giữ/trở thành vai trò JUDGE.
 * Fail fast: chặn ngay với 403 nếu không có trong whitelist.
 */
const assertJudgeInWhitelist = async (email) => {
  const normalized = normalizeEmail(email);
  const judge = await findJudgeByEmail(normalized);

  if (!judge) {
    throw ApiError.forbidden(
      'Email của bạn không có trong danh sách trắng Ban Giám khảo. Vui lòng liên hệ phòng đào tạo để được bổ sung.',
      'JUDGE_NOT_IN_WHITELIST',
    );
  }

  return judge;
};

/** Kiểm tra xem email đã có trong whitelist hay chưa (không ném lỗi) */
const isJudgeInWhitelist = async (email) => {
  const judge = await findJudgeByEmail(email);
  return Boolean(judge);
};

/** Danh sách whitelist BGK (phân trang) */
const getJudgeWhitelist = async ({ page = 1, limit = 20, keyword, faculty } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (keyword) {
    query.$or = [
      { fullName: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
      { staffCode: { $regex: keyword, $options: 'i' } },
    ];
  }
  if (faculty) {
    query.faculty = { $regex: faculty, $options: 'i' };
  }

  const [records, total] = await Promise.all([
    JudgeWhitelist.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    JudgeWhitelist.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalRecords: total,
    },
  };
};

/** Import danh sách BGK từ dữ liệu đã parse của Excel (array of rows) */
const importJudgeWhitelistFromRows = async (rows, importedByUserId) => {
  const normalizedRows = rows.map((row) => ({
    fullName: String(row.fullName ?? row['Họ tên'] ?? row['họ tên'] ?? '').trim(),
    staffCode: String(row.staffCode ?? row['Mã số cán bộ'] ?? row['mã số cán bộ'] ?? '').trim().toUpperCase(),
    email: String(row.email ?? row['Email'] ?? row['email'] ?? '').trim().toLowerCase(),
    phone: String(row.phone ?? row['SĐT'] ?? row['sđt'] ?? row['Số điện thoại'] ?? '').trim(),
    faculty: String(row.faculty ?? row['Khoa'] ?? row['khoa'] ?? row['Đơn vị'] ?? '').trim(),
    isImported: true,
    importedAt: new Date(),
    importedBy: importedByUserId,
  }));

  // Loại bỏ dòng trống
  const validRows = normalizedRows.filter(
    (r) => r.fullName && r.staffCode && r.email,
  );

  if (!validRows.length) {
    throw ApiError.badRequest('File Excel không chứa dữ liệu hợp lệ (thiếu Họ tên / Mã số cán bộ / Email)', 'INVALID_EXCEL_DATA');
  }

  const results = { imported: 0, skipped: 0, errors: [] };

  for (const row of validRows) {
    try {
      await JudgeWhitelist.findOneAndUpdate(
        { email: row.email },
        { $setOnInsert: row },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      results.imported += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push({ email: row.email, reason: error.message });
    }
  }

  return results;
};

/** Xóa một bản ghi whitelist BGK */
const removeJudgeWhitelist = async (judgeWhitelistId) => {
  const deleted = await JudgeWhitelist.findByIdAndDelete(judgeWhitelistId);
  if (!deleted) {
    throw ApiError.notFound('Không tìm thấy bản ghi whitelist giám khảo', 'JUDGE_WHITELIST_NOT_FOUND');
  }
  return deleted;
};

/** Kiểm tra user có phải JUDGE và có trong whitelist không */
const assertUserEligibleAsJudge = async (user) => {
  if (!user) {
    throw ApiError.forbidden('Không tìm thấy tài khoản', 'USER_NOT_FOUND');
  }
  if (user.role !== 'judge' && user.systemRole !== 'judge') {
    return; // Không phải JUDGE thì không cần kiểm tra whitelist BGK
  }
  await assertJudgeInWhitelist(user.email);
  return user;
};

module.exports = {
  findJudgeByEmail,
  findJudgeByStaffCode,
  assertJudgeInWhitelist,
  isJudgeInWhitelist,
  getJudgeWhitelist,
  importJudgeWhitelistFromRows,
  removeJudgeWhitelist,
  assertUserEligibleAsJudge,
};

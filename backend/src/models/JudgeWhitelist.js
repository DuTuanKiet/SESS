const mongoose = require('mongoose');

/**
 * Danh sách trắng Ban Giám khảo (BGK Whitelist) - Enterprise Edition.
 * Đây là NGUỒN DỮ LIỆU DUY NHẤT quyết định một giảng viên/cán bộ có thể
 * được phân công vai trò JUDGE hay không.
 *
 * - Admin import file Excel (XLSX) để nạp danh sách BGK của trường.
 * - Khi giảng viên đăng nhập và có role JUDGE, hệ thống kiểm tra email
 *   phải có trong danh sách này, nếu không -> từ chối truy cập.
 * - Trường isImported đánh dấu bản ghi được nạp từ file Excel.
 */
const judgeWhitelistSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Họ tên giám khảo là bắt buộc'],
      trim: true,
      maxlength: 100,
    },
    /** Mã số cán bộ của trường (unique) */
    staffCode: {
      type: String,
      required: [true, 'Mã số cán bộ là bắt buộc'],
      trim: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email trường là bắt buộc'],
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    phone: { type: String, trim: true, default: '', maxlength: 20 },
    /** Khoa / đơn vị 소속 */
    faculty: { type: String, trim: true, default: '', maxlength: 100 },
    /** true nếu bản ghi được import từ file Excel của nhà trường */
    isImported: { type: Boolean, default: false },
    importedAt: { type: Date, default: null },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    collection: 'judge_whitelists',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('JudgeWhitelist', judgeWhitelistSchema);

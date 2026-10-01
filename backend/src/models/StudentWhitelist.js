const mongoose = require('mongoose');

/**
 * Danh sách sinh viên của trường (Student Whitelist).
 *
 * Đây là NGUỒN DỮ LIỆU DUY NHẤT quyết định một email @student.ctuet.edu.vn
 * có được phép đăng nhập / kích hoạt tài khoản hay không.
 *
 * - Giai đoạn hiện tại: seed bằng scripts/seed-whitelist.js.
 * - Giai đoạn sau: Admin import file Excel (XLSX) -> chỉ cần ghi dữ liệu vào collection này
 *   (đặt isImported = true). Logic xác thực ở authService KHÔNG cần thay đổi.
 */
const studentWhitelistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email sinh viên là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    studentId: { type: String, required: [true, 'Mã số sinh viên là bắt buộc'], trim: true, index: true },
    fullName: { type: String, required: [true, 'Họ tên sinh viên là bắt buộc'], trim: true },
    className: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    /** Email Giảng viên cố vấn học tập (CVHT) của lớp */
    advisorEmail: { type: String, lowercase: true, trim: true, default: '' },
    /** true nếu bản ghi được import từ file Excel của nhà trường */
    isImported: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'student_whitelists',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('StudentWhitelist', studentWhitelistSchema);

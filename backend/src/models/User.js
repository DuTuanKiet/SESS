const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { SYSTEM_ROLES, USER_ROLES, USER_STATUS, AUTH_PROVIDERS } = require('../utils/constants');

/** Mỗi phiên đăng nhập lưu 1 hash của refresh token (không lưu token gốc) */
const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String, trim: true, default: '' },
    ip: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * Schema người dùng hệ thống SESS - hợp nhất 2 nhánh:
 * - FR01-FR04 (FR01/FR02): email + password (bcrypt) + role + authProvider/OTP/Google + refreshTokens.
 * - FR05-FR08 (FR05-FR08): systemRole + profile{fullName, bio, field} dùng cho phân công mentor.
 * Hai trường `role` và `systemRole` luôn được đồng bộ cùng một giá trị
 * (student/mentor/teacher/admin) để cả 2 luồng truy vấn đều đúng.
 */
const userSchema = new mongoose.Schema(
  {
    // --- Định danh đăng nhập ---
    username: { type: String, default: null },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: { type: String, default: null },

    // --- Mật khẩu ---
    // `password` là trường chính của FR01-FR04 (hash bằng bcrypt ở pre('save'))
    password: {
      type: String,
      minlength: [8, 'Mật khẩu phải có tối thiểu 8 ký tự'],
      select: false, // Không bao giờ trả password ra ngoài theo mặc định
      required: [
        function passwordRequired() {
          return this.authProvider === AUTH_PROVIDERS.LOCAL;
        },
        'Mật khẩu là bắt buộc',
      ],
    },
    // `passwordHash` là cách gọi của FR05-FR08 - giữ lại để các projection cũ (passwordHash: 0) vẫn hợp lệ
    passwordHash: { type: String, default: null },

    // --- Hồ sơ ---
    fullName: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    studentId: { type: String, trim: true, unique: true, sparse: true },
    /** Lớp sinh hoạt - lấy từ danh sách sinh viên của trường (StudentWhitelist) */
    className: { type: String, trim: true, default: '' },
    /** Email Giảng viên cố vấn học tập (CVHT) của lớp */
    advisorEmail: { type: String, lowercase: true, trim: true, default: '' },

    // --- Vai trò hệ thống (2 cách gọi của 2 nhánh, luôn đồng bộ 1 giá trị) ---
    // Không đặt default ở đây: giá trị mặc định được xử lý trong pre('validate') bên dưới
    // để không ghi đè khi caller chỉ truyền `systemRole` (FR05-FR08) hoặc chỉ truyền `role` (FR01-FR04).
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      index: true,
    },
    systemRole: {
      type: String,
      enum: Object.values(SYSTEM_ROLES),
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },

    // --- Xác thực & phiên đăng nhập (FR01/FR02) ---
    isEmailVerified: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      default: AUTH_PROVIDERS.LOCAL,
    },
    googleId: { type: String, trim: true, unique: true, sparse: true },
    lastLoginAt: { type: Date, default: null },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },

    // --- Hồ sơ mở rộng dùng cho phân công mentor (FR05-FR08) ---
    profile: {
      fullName: { type: String, default: '' },
      bio: { type: String, default: '' },
      field: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: hideSensitiveFields },
    toObject: { virtuals: true, transform: hideSensitiveFields },
  },
);

/** Ẩn mọi trường nhạy cảm khi serialize ra ngoài */
function hideSensitiveFields(_doc, returnedObject) {
  delete returnedObject.password;
  delete returnedObject.passwordHash;
  delete returnedObject.refreshTokens;
  delete returnedObject.googleId;
  delete returnedObject.__v;
  return returnedObject;
}

/**
 * Đồng bộ dữ liệu giữa 2 nhánh trước khi validate:
 * - `role` là NGUỒN CHUẨN của vai trò (FR01-FR04); `systemRole` là bản sao tương thích cho FR05-FR08.
 *   Muốn đổi vai trò: sửa `role` (ví dụ qua userService.updateRole).
 *   Nếu dữ liệu cũ chỉ có `systemRole` (bản ghi tạo trước khi merge) thì `role` được suy ra từ đó.
 * - fullName (FR01-FR04) <-> profile.fullName (FR05-FR08).
 */
userSchema.pre('validate', function syncBranchFields() {
  // Vai trò hệ thống: luôn đồng bộ 2 trường về cùng 1 giá trị để cả 2 luồng truy vấn đều đúng
  const roleValue = this.role || this.systemRole || USER_ROLES.STUDENT;
  this.role = roleValue;
  this.systemRole = roleValue;

  // Hồ sơ mentor: FR05-FR08 lọc/tìm theo profile.fullName, FR01-FR04 lưu fullName ở top-level
  if (!this.profile) this.profile = {};
  if (!this.profile.fullName) this.profile.fullName = this.fullName || '';
  if (!this.fullName) this.fullName = this.profile.fullName || '';
});

/** So sánh mật khẩu người dùng nhập với hash trong DB (cần .select('+password')) */
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.pre('save', async function hashPasswordOnSave() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  // Giữ passwordHash song song để tương thích projection của FR05-FR08
  this.passwordHash = this.password;
});

module.exports = mongoose.model('User', userSchema);
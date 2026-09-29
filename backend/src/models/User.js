const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { USER_ROLES, USER_STATUS, AUTH_PROVIDERS } = require('../utils/constants');

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

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
    },
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
    fullName: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    studentId: { type: String, trim: true, unique: true, sparse: true },
    /** Lớp sinh hoạt - lấy từ danh sách sinh viên của trường (StudentWhitelist) */
    className: { type: String, trim: true, default: '' },
    /** Email Giảng viên cố vấn học tập (CVHT) của lớp */
    advisorEmail: { type: String, lowercase: true, trim: true, default: '' },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      default: AUTH_PROVIDERS.LOCAL,
    },
    googleId: { type: String, trim: true, unique: true, sparse: true },
    lastLoginAt: { type: Date, default: null },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: hideSensitiveFields },
    toObject: { virtuals: true, transform: hideSensitiveFields },
  },
);

function hideSensitiveFields(_doc, returnedObject) {
  delete returnedObject.password;
  delete returnedObject.refreshTokens;
  delete returnedObject.googleId;
  delete returnedObject.__v;
  return returnedObject;
}

/** So sánh mật khẩu người dùng nhập với hash trong DB (cần .select('+password')) */
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.pre('save', async function hashPasswordOnSave() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
});

module.exports = mongoose.model('User', userSchema);

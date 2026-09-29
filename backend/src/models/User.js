const mongoose = require('mongoose');
const { SYSTEM_ROLES, USER_STATUS } = require('../utils/constants');

/**
 * Schema người dùng hệ thống SESS.
 * Phân quyền theo systemRole: Admin, Student, Mentor.
 * Tài khoản Mentor đăng nhập email CTUT (@ctut.edu.vn).
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    systemRole: {
      type: String,
      enum: Object.values(SYSTEM_ROLES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    profile: {
      fullName: {
        type: String,
        required: true,
      },
      bio: {
        type: String,
        default: '',
      },
      field: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

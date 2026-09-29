const mongoose = require('mongoose');

/** Liên kết mạng xã hội của sinh viên */
const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

/**
 * Hồ sơ cá nhân (FR02) - quan hệ 1-1 với User.
 *
 * - Nhóm trường CHÍNH THỨC (fullName, studentId, className, advisorEmail) luôn được
 *   đồng bộ từ collection StudentWhitelist của nhà trường -> người dùng KHÔNG sửa được.
 * - Nhóm trường BỔ TRỢ (bio, skills, phone, avatarUrl, socialLinks) do sinh viên tự cập nhật.
 */
const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },

    fullName: { type: String, trim: true, default: '' },
    studentId: { type: String, trim: true, default: '' },
    className: { type: String, trim: true, default: '' },
    advisorEmail: { type: String, lowercase: true, trim: true, default: '' },

    bio: { type: String, trim: true, default: '', maxlength: 1000 },
    skills: { type: [String], default: [] },
    phone: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('UserProfile', userProfileSchema);

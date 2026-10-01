const mongoose = require('mongoose');
const { MENTOR_STATUS, MENTOR_DEFAULT_MAX_PROJECTS } = require('../utils/constants');

/**
 * Hồ sơ Mentor (FR-MENTOR-01).
 * Được tự động khởi tạo (upsert) khi tài khoản có systemRole = 'MENTOR'.
 */
const mentorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    email: { type: String, lowercase: true, trim: true, default: '' },
    fullName: { type: String, trim: true, default: '' },
    /** Lĩnh vực chuyên môn, VD: ['AI', 'Fintech'] */
    expertise: { type: [String], default: [] },
    /** Lĩnh vực nhận hướng dẫn, VD: ['E-commerce', 'EdTech'] */
    fields: { type: [String], default: [] },
    maxProjects: { type: Number, default: MENTOR_DEFAULT_MAX_PROJECTS, min: 1 },
    status: { type: String, enum: Object.values(MENTOR_STATUS), default: MENTOR_STATUS.ACTIVE, index: true },
    bio: { type: String, trim: true, default: '' },
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

module.exports = mongoose.model('Mentor', mentorSchema);

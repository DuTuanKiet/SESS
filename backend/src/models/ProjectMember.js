const mongoose = require('mongoose');
const { PROJECT_MEMBER_ROLES, PROJECT_MEMBER_STATUS } = require('../utils/constants');

/**
 * Thành viên dự án (FR04).
 * OWNER được tạo tự động khi dự án được khởi tạo; các thành viên khác được mời qua email
 * và phải phản hồi lời mời (INVITED -> ACCEPTED/REJECTED).
 */
const projectMemberSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Lưu kèm email để hiển thị danh sách thành viên không cần populate */
    email: { type: String, lowercase: true, trim: true, default: '' },
    role: {
      type: String,
      enum: Object.values(PROJECT_MEMBER_ROLES),
      default: PROJECT_MEMBER_ROLES.MEMBER,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_MEMBER_STATUS),
      default: PROJECT_MEMBER_STATUS.INVITED,
      index: true,
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    joinedAt: { type: Date, default: null },
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

/** Một người chỉ có 1 bản ghi thành viên trong 1 dự án */
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);

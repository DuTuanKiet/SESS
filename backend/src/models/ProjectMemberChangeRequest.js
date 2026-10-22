const mongoose = require('mongoose');
const {
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
} = require('../utils/constants');

/**
 * Yêu cầu thay đổi thành viên dự án (Member Change Request) - Enterprise Edition.
 * OWNER gửi yêu cầu thêm/bớt thành viên giữa các vòng thi.
 * Yêu cầu cần được Admin duyệt/từ chối trước khi thực hiện, để đảm bảo
 * lịch sử tham gia gắn mốc thời gian chính xác cho cấp chứng chỉ sau này.
 */
const projectMemberChangeRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    /** OWNER gửi yêu cầu */
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** User đối tượng bị tác động (thêm hoặc xóa) */
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Loại yêu cầu: ADD hoặc REMOVE */
    type: {
      type: String,
      enum: Object.values(MEMBER_CHANGE_REQUEST_TYPE),
      required: true,
    },
    /** Trạng thái: PENDING -> APPROVED/REJECTED */
    status: {
      type: String,
      enum: Object.values(MEMBER_CHANGE_REQUEST_STATUS),
      default: MEMBER_CHANGE_REQUEST_STATUS.PENDING,
      index: true,
    },
    /** Lý do từ người yêu cầu */
    reason: { type: String, trim: true, default: '', maxlength: 1000 },
    /** Lý do từ người phê duyệt/từ chối */
    responseReason: { type: String, trim: true, default: '', maxlength: 1000 },
    /** Admin phê duyệt/từ chối */
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null },
    /** Thời điểm thực hiện thay đổi (khi APPROVED đã được áp dụng) */
    executedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'project_member_change_requests',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** Chỉ có 1 yêu cầu đang chờ duyệt cho mỗi (project, targetUser, type) */
projectMemberChangeRequestSchema.index(
  { projectId: 1, targetUserId: 1, type: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: MEMBER_CHANGE_REQUEST_STATUS.PENDING } },
);

module.exports = mongoose.model('ProjectMemberChangeRequest', projectMemberChangeRequestSchema);

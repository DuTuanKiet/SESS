const mongoose = require('mongoose');
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require('../utils/constants');

/**
 * Schema lưu vết thao tác quản trị con người (FR14: Audit Log).
 * Bắt buộc ghi nhận cho: ASSIGN_MENTOR, REASSIGN_MENTOR, CHANGE_PROJECT_STATUS,
 * LOCK_USER, CHANGE_RUBRIC, PUBLISH_KB_DOC.
 * oldValues/newValues lưu trạng thái trước và sau thay đổi để đối soát.
 */
const auditLogSchema = new mongoose.Schema({
  // Admin hoặc người dùng thực hiện thao tác - luôn lấy từ req.user.id (JWT)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: Object.values(AUDIT_ACTIONS),
  },
  targetEntity: {
    type: String,
    required: true,
    enum: Object.values(AUDIT_ENTITIES),
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  // Trạng thái trước khi thay đổi (null nếu là tạo mới)
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Trạng thái sau khi thay đổi
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);

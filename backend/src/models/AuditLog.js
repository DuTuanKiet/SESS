const mongoose = require('mongoose');
const { AUDIT_ACTIONS, AUDIT_ENTITIES, AUDIT_TARGETS } = require('../utils/constants');

/**
 * Nhật ký thao tác trọng yếu (Audit Log - FR14).
 * Hợp nhất 2 nhánh:
 * - FR01-FR04: actorId / actorEmail / ipAddress / timestamp (ghi qua utils/audit.js).
 * - FR05-FR08: userId / createdAt (ghi qua services/auditService.js cho ASSIGN_MENTOR,
 *   REASSIGN_MENTOR, CHANGE_PROJECT_STATUS, LOCK_USER, CHANGE_RUBRIC, PUBLISH_KB_DOC).
 * oldValues/newValues lưu trạng thái trước và sau thay đổi để đối soát.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Người thực hiện thao tác (FR01-FR04). Nếu log do FR05-FR08 ghi thì hook bên dưới
    // sẽ đồng bộ userId <-> actorId để cả 2 luồng truy vấn đều đọc được.
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, lowercase: true, trim: true, default: '' },

    // Alias của actorId theo cách gọi của FR05-FR08
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: Object.values(AUDIT_ACTIONS),
    },
    // FR05-FR08 dùng AUDIT_ENTITIES (Projects/Users/...), FR01-FR04 dùng AUDIT_TARGETS (PROJECT/USER/...)
    targetEntity: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: [...new Set([...Object.values(AUDIT_ENTITIES), ...Object.values(AUDIT_TARGETS)])],
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    oldValues: { type: mongoose.Schema.Types.Mixed, default: null },
    newValues: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
    // FR05-FR08 truy vấn audit theo createdAt
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'audit_logs',
    versionKey: false,
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** Đồng bộ 2 cách lưu người thực hiện / thời điểm giữa 2 nhánh */
auditLogSchema.pre('validate', function syncAuditFields() {
  if (!this.actorId && this.userId) this.actorId = this.userId;
  if (!this.userId && this.actorId) this.userId = this.actorId;

  if (!this.timestamp) this.timestamp = new Date();
  if (!this.createdAt) this.createdAt = this.timestamp;
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
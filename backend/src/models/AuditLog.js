const mongoose = require('mongoose');

/**
 * Nhật ký thao tác trọng yếu (Audit Log - FR14).
 * Ghi lại ai làm gì, trên thực thể nào, giá trị trước/sau và IP của request.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, lowercase: true, trim: true, default: '' },
    action: { type: String, required: true, trim: true, index: true },
    targetEntity: { type: String, required: true, trim: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    oldValues: { type: mongoose.Schema.Types.Mixed, default: null },
    newValues: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'audit_logs',
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

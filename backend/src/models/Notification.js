const mongoose = require('mongoose');
const { normalizeNotification } = require('../utils/notificationCompatibility');

// Merge: giữ trường chuẩn HEAD và liên kết judge/alias mentor; không giới hạn type vào enum dev.
const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipientRole: { type: String, enum: ['judge', 'admin', 'mentor', 'teacher', 'student'] },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, required: true, trim: true, default: 'system', maxlength: 40 },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String, trim: true, default: '', maxlength: 500 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  eventKey: { type: String, required: true, trim: true, maxlength: 255 },
  relatedEvaluationId: { type: mongoose.Schema.Types.ObjectId, ref: 'HumanEvaluation', default: null },
  relatedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, trim: true, maxlength: 1000 },
  link: { type: String, trim: true, maxlength: 500 },
  read: { type: Boolean, default: false },
}, {
  timestamps: true,
  // Dữ liệu dev cũ chưa có eventKey: chỉ tạo index sau khi migration đã kiểm tra/backfill.
  autoIndex: false,
});

notificationSchema.pre('validate', function normalizeLegacyFields() {
  const normalized = normalizeNotification(this);
  for (const field of ['recipientId', 'userId', 'message', 'content', 'actionUrl', 'link', 'isRead', 'read']) {
    this[field] = normalized[field];
  }
  if (!this.eventKey) this.eventKey = `legacy:${this._id}`;
});

// Service cập nhật cả isRead/read; hook này chỉ phục vụ create/save từ caller cũ.
notificationSchema.index({ eventKey: 1 }, { unique: true });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  recipients: [{ type: String }],
  subject: { type: String, required: true },
  content: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'MOCKED', 'SKIPPED'],
    default: 'PENDING',
    index: true,
  },
  provider: { type: String, enum: ['SMTP', 'JSON_TRANSPORT', 'BULLMQ'], default: 'SMTP' },
  error: { type: String, default: '' },
  messageId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  sentAt: { type: Date },
}, { timestamps: true });

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ userId: 1, sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
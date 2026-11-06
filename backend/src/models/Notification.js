const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, required: true, trim: true, default: 'system', maxlength: 40 },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String, trim: true, default: '', maxlength: 500 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    eventKey: { type: String, required: true, trim: true, maxlength: 255, unique: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

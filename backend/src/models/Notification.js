const mongoose = require('mongoose');

/**
 * Unified Notification model.
 * - Judge/evaluator/admin pipeline (feature/judge): recipientId/recipientRole, title/content, isRead, link, relatedEvaluationId/ProjectId.
 * - Mentor module (mentor-module-stable): userId, title/content, read.
 * Both field sets are supported for backward compatibility; new code should prefer recipientId/isRead.
 */
const notificationSchema = new mongoose.Schema(
  {
    // Unified (judge) fields
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['judge', 'admin', 'mentor', 'student'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc'],
      trim: true,
      maxlength: 1000,
      default: '',
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    relatedEvaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HumanEvaluation',
      default: null,
    },
    relatedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    // Legacy mentor fields (kept for compatibility)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Normalize between unified and legacy field names
notificationSchema.pre('validate', function (next) {
  if (!this.recipientId && this.userId) this.recipientId = this.userId;
  if (!this.userId && this.recipientId) this.userId = this.recipientId;
  if (typeof this.isRead !== 'boolean' && typeof this.read === 'boolean') this.isRead = this.read;
  if (typeof this.read !== 'boolean' && typeof this.isRead === 'boolean') this.read = this.isRead;
  next();
});

/** Index để truy vấn thông báo nhanh */
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

/**
 * Thông báo hệ thống dành cho Ban Giám Khảo.
 * Lưu vết các sự kiện: phân công dự án mới, nhắc hạn chót, cập nhật Rubric, v.v.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['judge', 'admin', 'mentor', 'student'],
      required: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/** Index để truy vấn thông báo chưa đọc của người dùng nhanh */
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

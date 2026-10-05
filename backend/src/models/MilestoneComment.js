const mongoose = require('mongoose');

/**
 * Schema góp ý của Mentor cho milestone (FR07).
 * Mentor có thể góp ý nhiều lần — mỗi lần là một document độc lập.
 * Chỉ áp dụng khi milestone ở trạng thái Completed hoặc Overdue và trong vòng 5 ngày kể từ evidence.submittedAt.
 */
const milestoneCommentSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectMilestone',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

milestoneCommentSchema.index({ milestoneId: 1, createdAt: -1 });

module.exports = mongoose.model('MilestoneComment', milestoneCommentSchema);

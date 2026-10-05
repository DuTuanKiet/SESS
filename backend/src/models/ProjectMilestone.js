const mongoose = require('mongoose');
const { MILESTONE_STATUS } = require('../utils/constants');

/**
 * Schema quản lý tiến độ dự án theo milestone (FR05).
 * Vòng đời trạng thái: Pending → InProgress → Completed / Overdue / NotComplete.
 * Trạng thái phụ thuộc thời gian được tính toán động (Computed Status).
 * Khi đã nộp minh chứng (evidence), trạng thái chốt vĩnh viễn trong DB.
 */
const projectMilestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MILESTONE_STATUS),
      default: MILESTONE_STATUS.PENDING,
      index: true,
    },
    // Minh chứng sinh viên nộp (link Drive, GitHub, URL sản phẩm)
    evidence: {
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      url: {
        type: String,
        default: null,
        trim: true,
      },
      note: {
        type: String,
        default: '',
        trim: true,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Compound index tối ưu truy vấn milestone theo dự án + thứ tự thời gian bắt đầu
projectMilestoneSchema.index({ projectId: 1, startDate: 1 });

module.exports = mongoose.model('ProjectMilestone', projectMilestoneSchema);

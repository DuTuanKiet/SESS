const mongoose = require('mongoose');
const { ASSIGNMENT_STATUS } = require('../utils/constants');

const mentorAssignmentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Admin thực hiện gán/đổi mentor - lấy từ req.user.id, không tin req.body
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.ASSIGNED,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    // Ghi nhận khi mentor bị Reassign hoặc kết thúc cố vấn
    endedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

/**
 * Partial Unique Index: BẢO ĐẢM TẠI TẦNG DB CHỈ CÓ DUY NHẤT 1 ASSIGNMENT 'Assigned' PER PROJECT.
 * Cho phép cùng projectId xuất hiện nhiều lần ở trạng thái 'ReAssigned' hoặc 'Completed'
 * (lịch sử phân công), nhưng chỉ được có tối đa 1 bản ghi ở trạng thái 'Assigned'.
 */
mentorAssignmentSchema.index(
  { projectId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ASSIGNMENT_STATUS.ASSIGNED },
    name: 'unique_active_mentor_per_project',
  }
);

// Compound index tối ưu truy vấn đếm số dự án đang active của 1 mentor
mentorAssignmentSchema.index({ mentorId: 1, status: 1 });

module.exports = mongoose.model('MentorAssignment', mentorAssignmentSchema);

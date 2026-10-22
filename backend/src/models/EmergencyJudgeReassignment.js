const mongoose = require('mongoose');

/**
 * EmergencyJudgeReassignment - Điều chuyển khẩn cấp Ban Giám khảo (Enterprise Edition).
 * Khi một Giám khảo vắng mặt đột xuất, Admin có thể chọn lại dự án của Giám khảo đó
 * và gán sang cho Giám khảo dự phòng trong cùng tiểu ban, mà không làm mất dữ liệu nháp.
 * Mọi thao tác được ghi vào Audit Log đầy đủ để truy vết.
 */
const emergencyJudgeReassignmentSchema = new mongoose.Schema(
  {
    /** Dự án bị điều chuyển */
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    /** Giám khảo vắng mặt (bị thay thế) */
    originalJudgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Giám khảo dự phòng nhận über dự án */
    replacementJudgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Khoa / tiểu ban mà cả hai Giám khảo đều thuộc về (để đảm bảo cùng chuyên môn) */
    faculty: { type: String, trim: true, default: '', maxlength: 100 },

    /** Lý do điều chuyển khẩn cấp (bắt buộc) */
    reason: { type: String, trim: true, required: true, maxlength: 1000 },

    /** Admin thực hiện điều chuyển */
    reassignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reassignedAt: { type: Date, default: Date.now, index: true },

    /** Trạng thái: PENDING / COMPLETED / REVOKED */
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'REVOKED'],
      default: 'PENDING',
      index: true,
    },

    /** Ai đã hủy bỏ điều chuyển (nếu status = REVOKED) */
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, trim: true, default: '', maxlength: 500 },

    /** Ghi chú về dữ liệu nháp đã được bảo tồn (dành cho hệ thống chấm điểm sau này) */
    draftDataPreserved: { type: Boolean, default: false },
    draftDataNote: { type: String, trim: true, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
    collection: 'emergency_judge_reassignments',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** Chỉ có 1 reassignment đang PENDING cho mỗi projectId */
emergencyJudgeReassignmentSchema.index(
  { projectId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } },
);

module.exports = mongoose.model('EmergencyJudgeReassignment', emergencyJudgeReassignmentSchema);

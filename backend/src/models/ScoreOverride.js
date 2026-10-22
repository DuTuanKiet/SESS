const mongoose = require('mongoose');

/**
 * ScoreOverride - Điều chỉnh điểm Rubric có kiểm soát (Enterprise Edition).
 * Cho phép Admin hoặc Trưởng tiểu ban (Judge) chỉnh sửa điểm số của một tiêu chí
 * đánh giá trong biên độ cho phép (ví dụ ±1 hoặc ±2 điểm từ min/max của tiêu chí).
 * Bắt buộc nhập Lý do và ghi nhận đầy đủ vào Audit Log (Immutable Audit Log).
 */
const scoreOverrideSchema = new mongoose.Schema(
  {
    /** Bộ tiêu chí đang áp dụng (phiên bản Active) */
    rubricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvaluationRubric',
      required: true,
      index: true,
    },
    /** ID của tiêu chí con (criterion) trong rubric.criteria */
    criterionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    /** Tên tiêu chí (để hiển thị, chốt lại tại thời điểm override) */
    criterionName: { type: String, trim: true, default: '', maxlength: 200 },

    /** Dự án đang được đánh giá */
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    /** Điểm số gốc trước khi override (theo rubric) */
    originalScore: { type: Number, required: true, min: 0 },
    /** Điểm số sau khi override */
    overriddenScore: { type: Number, required: true, min: 0 },
    /** Chênh lệch điểm (overriddenScore - originalScore) */
    overridePoints: { type: Number, required: true },

    /** Giới hạn điều chỉnh cho phép (ví dụ 1 hoặc 2 điểm) */
    maxOverridePoints: { type: Number, default: 2, min: 0 },

    /** Lý do bắt buộc cho việc điều chỉnh điểm */
    reason: { type: String, trim: true, required: true, maxlength: 1000 },

    /** Người thực hiện override (Admin hoặc Judge) */
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    overriddenAt: { type: Date, default: Date.now, index: true },

    /** Trạng thái: APPLIED (đã áp dụng), REVOKED (đã thu hồi) */
    status: {
      type: String,
      enum: ['APPLIED', 'REVOKED'],
      default: 'APPLIED',
      index: true,
    },

    /** Ai đã thu hồi (nếu status = REVOKED) */
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    revokedAt: { type: Date, default: null },
    revokeReason: { type: String, trim: true, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
    collection: 'score_overrides',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** Một override duy nhất cho mỗi (rubricId, criterionId, projectId) ở trạng thái APPLIED */
scoreOverrideSchema.index(
  { rubricId: 1, criterionId: 1, projectId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'APPLIED' } },
);

module.exports = mongoose.model('ScoreOverride', scoreOverrideSchema);

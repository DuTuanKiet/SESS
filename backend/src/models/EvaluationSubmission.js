const mongoose = require('mongoose');

/**
 * EvaluationSubmission - Phiếu chấm điểm Rubric của Giám khảo (Enterprise Edition).
 *
 * Vai trò trong vòng đời dự án:
 *   UNDER_MENTORSHIP -> (100% giám khảo trong tiểu ban đã nộp phiếu) -> EVALUATED -> COMPLETED
 *
 * Ràng buộc:
 * - Mỗi giám khảo chỉ nộp 1 phiếu cho mỗi (dự án, rubric, tiêu chí).
 * - Dữ liệu chấm điểm của các cấp thi độc lập với nhau (mỗi cấp là 1 dự án riêng).
 */
const evaluationSubmissionSchema = new mongoose.Schema(
  {
    /** Dự án được chấm điểm */
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    /** Bộ tiêu chí sử dụng để chấm */
    rubricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EvaluationRubric',
      required: true,
      index: true,
    },

    /** Tiêu chí được chấm (bắt buộc vì mỗi tiêu chí là 1 lần chấm) */
    criterionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    /** Giám khảo nộp phiếu */
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Điểm số */
    score: { type: Number, required: true, min: 0, max: 100 },

    /** Nhận xét của giám khảo */
    comment: { type: String, trim: true, default: '', maxlength: 2000 },

    submittedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'evaluation_submissions',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** 1 giám khảo chỉ nộp 1 phiếu cho mỗi (dự án, rubric, tiêu chí) */
evaluationSubmissionSchema.index(
  { projectId: 1, rubricId: 1, criterionId: 1, judgeId: 1 },
  { unique: true },
);

module.exports = mongoose.model('EvaluationSubmission', evaluationSubmissionSchema);

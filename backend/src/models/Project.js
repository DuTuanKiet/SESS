const mongoose = require('mongoose');
const { PROJECT_STATUS, MILESTONE_STATUS } = require('../utils/constants');

/** Mốc tiến độ của dự án (dùng cho FR03 và dữ liệu gửi AI ở FR09/FR10) */
const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tên mốc tiến độ là bắt buộc'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: Object.values(MILESTONE_STATUS), default: MILESTONE_STATUS.PLANNED },
  },
  { _id: false },
);

/**
 * Dự án khởi nghiệp của sinh viên (FR03).
 * Vòng đời: DRAFT -> SUBMITTED -> NEED_REVISION/APPROVED/REJECTED.
 * Mỗi lần nộp thành công sẽ tạo 1 bản ghi ProjectRevision (snapshot) và tăng version.
 */
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Tên dự án là bắt buộc'], trim: true, maxlength: 200 },
    /** Mã dự án tự sinh, VD: SESS-2026-001 */
    code: { type: String, required: true, unique: true, trim: true, index: true },
    category: { type: String, trim: true, default: '', maxlength: 120 },
    abstract: { type: String, trim: true, default: '', maxlength: 2000 },
    problemStatement: { type: String, trim: true, default: '', maxlength: 4000 },
    solution: { type: String, trim: true, default: '', maxlength: 4000 },
    businessModel: { type: String, trim: true, default: '', maxlength: 2000 },
    attachmentUrl: { type: String, trim: true, default: '' },
    /** Các mốc tiến độ của dự án */
    milestones: { type: [milestoneSchema], default: [] },

    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.DRAFT,
      index: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    version: { type: Number, default: 1, min: 1 },
    lastSubmittedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

module.exports = mongoose.model('Project', projectSchema);

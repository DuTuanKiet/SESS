const mongoose = require('mongoose');

/**
 * Lịch sử phiên bản dự án (FR03).
 * Mỗi lần sinh viên nộp dự án thành công, hệ thống lưu 1 snapshot toàn bộ nội dung
 * tại thời điểm nộp -> phục vụ truy vết v1, v2, v3...
 */
const projectRevisionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true, immutable: true },
    versionNumber: { type: Number, required: true, min: 1, immutable: true },
    /** Toàn bộ dữ liệu dự án tại thời điểm nộp */
    snapshotData: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
    /** Biên nhận riêng của phiên bản để lịch sử không phụ thuộc biên nhận mới nhất trên Project. */
    digitalReceipt: {
      hash: { type: String, trim: true, default: '', immutable: true },
      timestamp: { type: Date, default: null, immutable: true },
      timestampMillis: { type: Number, default: null, immutable: true },
    },
    submittedAt: { type: Date, default: Date.now, immutable: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
    feedbackFromMentor: { type: String, trim: true, default: '' },
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

/** Mỗi dự án chỉ có 1 bản ghi cho mỗi số phiên bản */
projectRevisionSchema.index({ projectId: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('ProjectRevision', projectRevisionSchema);

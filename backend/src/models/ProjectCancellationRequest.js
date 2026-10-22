const mongoose = require('mongoose');
const { PROJECT_CANCELLATION_STATUS } = require('../utils/constants');

/**
 * ProjectCancellationRequest - Quy trình hủy dự án có bằng chứng (Enterprise Edition).
 *
 * Bổ sung trạng thái "hủy" vào vòng đời dự án theo Master Blueprint:
 *   - Sinh viên/giảng viên gửi yêu cầu hủy kèm LÝ DO + BẰNG CHỨNG (file đã upload cloud).
 *   - Admin (hoặc Hội đồng) duyệt/từ chối trên cơ sở bằng chứng đó.
 *   - Khi được duyệt -> dự án chuyển sang REJECTED và mọi phân công
 *     Mentor/Giám khảo đang hoạt động bị vô hiệu hóa.
 * Mọi bước đều được ghi vào Audit Log để truy vết.
 */

/** Một tệp bằng chứng đính kèm (URL do Cloud Upload sinh ra) */
const evidenceFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true, maxlength: 200 },
    fileUrl: { type: String, required: true, trim: true, maxlength: 1000 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectCancellationRequestSchema = new mongoose.Schema(
  {
    /** Dự án cần hủy */
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    /** Người gửi yêu cầu (giảng viên hướng dẫn hoặc thành viên/OWNER của dự án) */
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Lý do hủy dự án - bắt buộc tối thiểu 20 ký tự */
    reason: {
      type: String,
      required: [true, 'Lý do hủy dự án là bắt buộc'],
      trim: true,
      minlength: [20, 'Lý do hủy dự án phải có tối thiểu 20 ký tự'],
      maxlength: 2000,
    },

    /** Bằng chứng kèm theo (tối đa 10 tệp) */
    evidenceFiles: { type: [evidenceFileSchema], default: [] },

    /** Trạng thái xử lý */
    status: {
      type: String,
      enum: Object.values(PROJECT_CANCELLATION_STATUS),
      default: PROJECT_CANCELLATION_STATUS.PENDING,
      index: true,
    },

    /** Admin xử lý yêu cầu */
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, trim: true, default: '', maxlength: 1000 },
    reviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: 'project_cancellation_requests',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** Truy vấn nhanh: yêu cầu hủy theo dự án + trạng thái */
projectCancellationRequestSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model(
  'ProjectCancellationRequest',
  projectCancellationRequestSchema,
);

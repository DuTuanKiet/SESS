const mongoose = require('mongoose');

/**
 * ProjectVote - Bình chọn công khai (Public Voting) - Enterprise Edition.
 *
 * Endpoint bình chọn là endpoint CÔNG KHAI (không cần đăng nhập) nên là mục tiêu
 * của tool auto-click/bot. Vì vậy:
 * - Bắt buộc reCAPTCHA v3 (score tối thiểu) trước khi ghi nhận.
 * - Bắt buộc rate limit theo IP qua Redis.
 * - `voterKey` là HASH của IP + User-Agent (không lưu PII dạng thô) để chống vote trùng
 *   mà vẫn không thu thập dữ liệu cá nhân.
 */
const projectVoteSchema = new mongoose.Schema(
  {
    /** Dự án được bình chọn */
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    /** Khoá định danh người bình chọn (hash IP + User-Agent, hoặc userId nếu đã đăng nhập) */
    voterKey: { type: String, required: true, trim: true, index: true },

    /** Lựa chọn của người bình chọn */
    option: { type: String, required: true, trim: true, maxlength: 100 },

    /** Bình luận / góp ý kèm theo (tuỳ chọn) */
    comment: { type: String, trim: true, default: '', maxlength: 1000 },

    /** Điểm reCAPTCHA v3 của lượt bình chọn (để đối soát) */
    recaptchaScore: { type: Number, default: 0, min: 0, max: 1 },

    /** Action reCAPTCHA mà client khai báo */
    recaptchaAction: { type: String, trim: true, default: '', maxlength: 50 },

    /** IP đã hash (không lưu IP thô) */
    ipHash: { type: String, trim: true, default: '', maxlength: 128 },
  },
  {
    timestamps: true,
    collection: 'project_votes',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/** 1 người chỉ được bình chọn 1 lần cho mỗi dự án */
projectVoteSchema.index({ projectId: 1, voterKey: 1 }, { unique: true });

module.exports = mongoose.model('ProjectVote', projectVoteSchema);

const mongoose = require('mongoose');

/**
 * Lưu OTP đã hash (không lưu mã gốc).
 * TTL index giúp MongoDB tự xoá document khi hết hạn - không cần cronjob dọn rác.
 */
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    /** Thời điểm gửi OTP gần nhất - dùng để chặn spam (cooldown 60s) */
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt.getTime() <= Date.now();
});

module.exports = mongoose.model('Otp', otpSchema);

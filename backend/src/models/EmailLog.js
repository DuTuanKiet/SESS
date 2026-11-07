const mongoose = require('mongoose');
const emailLogSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipients: [{ type: String }],
  subject: { type: String, required: true },
  content: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('EmailLog', emailLogSchema);
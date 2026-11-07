const mongoose = require('mongoose');
const honorHistorySchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('HonorHistory', honorHistorySchema);
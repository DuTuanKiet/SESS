const mongoose = require('mongoose');
const projectFeedbackSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('ProjectFeedback', projectFeedbackSchema);
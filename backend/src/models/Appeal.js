const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    evaluationRoundId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRound', default: null, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    evidenceUrls: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'IN_REVIEW', 'RESOLVED', 'SUBMITTED'],
      default: 'PENDING',
      index: true,
    },
    adminResponse: { type: String, trim: true, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'appeals' }
);

appealSchema.index({ projectId: 1, submittedBy: 1, status: 1 });

module.exports = mongoose.model('Appeal', appealSchema);

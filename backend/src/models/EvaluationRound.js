const mongoose = require('mongoose');

const evaluationRoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true, trim: true },
    rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRubric', required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN', index: true },
    stageType: {
      type: String,
      enum: ['PRELIM', 'SEMI', 'FINAL', 'OTHER'],
      default: 'OTHER',
      index: true,
    },
    description: { type: String, trim: true, default: '' },
    submissionOpenAt: { type: Date, default: null, index: true },
    submissionCloseAt: { type: Date, default: null, index: true },
    scoringOpenAt: { type: Date, default: null },
    scoringCloseAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

evaluationRoundSchema.index({ stageType: 1, status: 1, submissionOpenAt: 1, submissionCloseAt: 1 });

module.exports = mongoose.model('EvaluationRound', evaluationRoundSchema);

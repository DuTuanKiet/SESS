const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    criterionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    comment: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const humanEvaluationSchema = new mongoose.Schema(
  {
    evaluationRoundId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRound', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rubricVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRubric', required: true },
    scores: [scoreSchema],
    totalScore: { type: Number, default: 0 },
    generalFeedback: { type: String, default: '', trim: true },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED'], default: 'DRAFT' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

humanEvaluationSchema.index({ evaluationRoundId: 1, projectId: 1, evaluatorId: 1 }, { unique: true });

module.exports = mongoose.model('HumanEvaluation', humanEvaluationSchema);

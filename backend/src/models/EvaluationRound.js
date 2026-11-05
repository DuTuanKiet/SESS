const mongoose = require('mongoose');

const evaluationRoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true, trim: true },
    rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRubric', required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvaluationRound', evaluationRoundSchema);

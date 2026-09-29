const mongoose = require('mongoose');
const { RUBRIC_STATUS } = require('../utils/constants');

// Schema tiêu chí con (Criterion Subdocument)
const criterionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  weight: { type: Number, required: true, min: 1, max: 100 },
  minScore: { type: Number, default: 0, min: 0 },
  maxScore: { type: Number, default: 10, min: 1 },
  order: { type: Number, default: 0 },
});

// Chốt chặn Data Guard: Điểm tối thiểu luôn phải nhỏ hơn điểm tối đa
criterionSchema.pre('validate', function (next) {
  if (this.minScore !== undefined && this.maxScore !== undefined && this.minScore >= this.maxScore) {
    const err = new Error(`Điểm tối thiểu (${this.minScore}) phải nhỏ hơn điểm tối đa (${this.maxScore}).`);
    if (typeof next === 'function') return next(err);
    throw err;
  }
  if (typeof next === 'function') next();
});

// Schema bộ tiêu chí chính
const evaluationRubricSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    version: { type: Number, default: 1, required: true },
    rootRubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRubric', default: null, index: true },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'EvaluationRubric', default: null },
    status: { type: String, enum: Object.values(RUBRIC_STATUS), default: RUBRIC_STATUS.DRAFT, index: true },
    criteria: [criterionSchema],
    totalWeight: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

evaluationRubricSchema.index({ rootRubricId: 1, version: -1 });

module.exports = mongoose.model('EvaluationRubric', evaluationRubricSchema);

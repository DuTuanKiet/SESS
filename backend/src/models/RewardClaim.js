const mongoose = require('mongoose');

const rewardClaimSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING'],
      default: 'PENDING',
      required: true,
    },
    bankName: { type: String, trim: true, required: true, maxlength: 160 },
    accountNumber: { type: String, trim: true, required: true, maxlength: 64 },
    accountHolder: { type: String, trim: true, required: true, maxlength: 160 },
    taxCode: { type: String, trim: true, default: '', maxlength: 32 },
    idCardNumber: { type: String, trim: true, default: '', maxlength: 32 },
    submittedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  {
    timestamps: true,
    collection: 'project_reward_claims',
    toJSON: {
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

rewardClaimSchema.index({ projectId: 1, submittedBy: 1 }, { unique: true });

module.exports = mongoose.model('RewardClaim', rewardClaimSchema);

const mongoose = require('mongoose');
const { PROJECT_STATUS } = require('../utils/constants');

/**
 * Schema dự án khởi nghiệp sinh viên.
 * Vòng đời trạng thái: Draft -> Submitted -> InReview ->
 *   (NeedRevision -> Submitted) -> UnderMentorship -> Evaluated -> Completed.
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    field: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.DRAFT,
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        projectRole: {
          type: String,
          enum: ['Owner', 'Member'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);

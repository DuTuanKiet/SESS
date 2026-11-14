const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    summary: { type: String, trim: true, default: '' },
    content: { type: String, trim: true, default: '' },
    thumbnailUrl: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Thong bao', index: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

newsSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
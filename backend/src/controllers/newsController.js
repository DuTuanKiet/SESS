const News = require('../models/News');
const ApiError = require('../utils/apiError');

const newsController = {
  /**
   * GET /api/v1/news
   * Danh sách tin tức đã xuất bản (public).
   * Hỗ trợ phân trang + lọc category.
   */
  getNews: async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const category = req.query.category ? String(req.query.category).trim() : '';

      const filter = { isPublished: true };
      if (category) filter.category = category;

      const [items, total] = await Promise.all([
        News.find(filter)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        News.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Lay danh sach tin tuc thanh cong.',
        data: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/news/:idOrSlug
   * Chi tiết tin tức theo ID hoặc slug (public).
   */
  getNewsById: async (req, res, next) => {
    try {
      const { idOrSlug } = req.params;
      let item = null;
      if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
        item = await News.findOne({ _id: idOrSlug, isPublished: true }).lean();
      }
      if (!item) {
        item = await News.findOne({ slug: String(idOrSlug).toLowerCase(), isPublished: true }).lean();
      }
      if (!item) throw ApiError.notFound('Khong tim thay tin tuc', 'NEWS_NOT_FOUND');

      return res.status(200).json({
        success: true,
        message: 'Lay chi tiet tin tuc thanh cong.',
        data: item,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/admin/news  (Admin)
   * Tạo tin tức.
   */
  createNews: async (req, res, next) => {
    try {
      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) throw ApiError.badRequest('Thieu tieu de tin tuc', 'NEWS_TITLE_REQUIRED');

      const slug = b.slug
        ? String(b.slug).toLowerCase().trim()
        : String(b.title).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const payload = {
        title: String(b.title).trim(),
        slug,
        summary: b.summary ? String(b.summary).trim() : '',
        content: b.content ? String(b.content).trim() : '',
        thumbnailUrl: b.thumbnailUrl ? String(b.thumbnailUrl).trim() : '',
        category: b.category ? String(b.category).trim() : 'Thong bao',
        isPublished: b.isPublished === true,
        authorId: (req.user && (req.user.id || req.user._id)) || null,
      };
      if (payload.isPublished) payload.publishedAt = b.publishedAt ? new Date(b.publishedAt) : new Date();

      const item = await News.create(payload);
      return res.status(201).json({ success: true, message: 'Tao tin tuc thanh cong.', data: item });
    } catch (err) {
      if (err && err.code === 11000) return next(ApiError.conflict('Slug tin tuc da ton tai', 'NEWS_SLUG_DUPLICATE'));
      return next(err);
    }
  },

  /**
   * PUT /api/v1/admin/news/:id  (Admin)
   * Cập nhật tin tức.
   */
  updateNews: async (req, res, next) => {
    try {
      const item = await News.findById(req.params.id);
      if (!item) throw ApiError.notFound('Khong tim thay tin tuc', 'NEWS_NOT_FOUND');

      const b = req.body || {};
      const fields = ['title', 'slug', 'summary', 'content', 'thumbnailUrl', 'category', 'isPublished', 'publishedAt'];
      for (const f of fields) {
        if (b[f] !== undefined) item[f] = b[f];
      }
      if (b.title && !b.slug && item.slug === undefined) {
        item.slug = String(b.title).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      if (item.isPublished && !item.publishedAt) item.publishedAt = new Date();
      if (item.isPublished === false) item.publishedAt = null;

      await item.save();
      return res.status(200).json({ success: true, message: 'Cap nhat tin tuc thanh cong.', data: item });
    } catch (err) {
      if (err && err.code === 11000) return next(ApiError.conflict('Slug tin tuc da ton tai', 'NEWS_SLUG_DUPLICATE'));
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/admin/news/:id  (Admin)
   * Xóa tin tức.
   */
  deleteNews: async (req, res, next) => {
    try {
      const item = await News.findByIdAndDelete(req.params.id);
      if (!item) throw ApiError.notFound('Khong tim thay tin tuc', 'NEWS_NOT_FOUND');
      return res.status(200).json({ success: true, message: 'Xoa tin tuc thanh cong.', data: { id: req.params.id } });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = newsController;
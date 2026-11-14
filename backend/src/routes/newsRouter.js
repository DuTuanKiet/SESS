const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkRole } = authMiddleware;

/**
 * GET /api/v1/news
 * Danh sách tin tức đã xuất bản (public).
 */
router.get('/', newsController.getNews);

/**
 * GET /api/v1/news/:idOrSlug
 * Chi tiết tin tức theo ID hoặc slug (public).
 */
router.get('/:idOrSlug', newsController.getNewsById);

/**
 * POST /api/v1/news  (Admin)
 */
router.post('/', authMiddleware, checkRole('admin'), newsController.createNews);

/**
 * PUT /api/v1/news/:id  (Admin)
 */
router.put('/:id', authMiddleware, checkRole('admin'), newsController.updateNews);

/**
 * DELETE /api/v1/news/:id  (Admin)
 */
router.delete('/:id', authMiddleware, checkRole('admin'), newsController.deleteNews);

module.exports = router;
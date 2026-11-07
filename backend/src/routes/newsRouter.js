const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

/**
 * GET /api/v1/news
 * Lấy danh sách tin tức (dành cho trang chủ).
 */
router.get('/', newsController.getNews);

/**
 * GET /api/v1/news/:id
 * Lấy chi tiết tin tức theo ID.
 */
router.get('/:id', newsController.getNewsById);

module.exports = router;

const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');

/**
 * GET /api/v1/competitions
 * Danh sach cuoc thi / dot danh gia da publish (public).
 */
router.get('/', competitionController.list);

/**
 * GET /api/v1/competitions/stats
 * Thong ke cuoc thi (public).
 */
router.get('/stats', competitionController.stats);

/**
 * GET /api/v1/competitions/:id
 * Chi tiet cuoc thi theo ID (public).
 */
router.get('/:id', competitionController.getById);

module.exports = router;
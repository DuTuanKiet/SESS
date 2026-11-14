const competitionService = require('../services/competitionService');

const competitionController = {
  /**
   * GET /api/v1/competitions
   */
  list: async (req, res, next) => {
    try {
      const data = await competitionService.list(req.query);
      res.status(200).json({ success: true, message: 'Lay danh sach cuoc thi thanh cong.', data });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /api/v1/competitions/stats
   */
  stats: async (req, res, next) => {
    try {
      const data = await competitionService.getStats();
      res.status(200).json({ success: true, message: 'Lay thong ke cuoc thi thanh cong.', data });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /api/v1/competitions/:id
   */
  getById: async (req, res, next) => {
    try {
      const data = await competitionService.getById(req.params.id);
      res.status(200).json({ success: true, message: 'Lay chi tiet cuoc thi thanh cong.', data });
    } catch (e) {
      next(e);
    }
  },
};

module.exports = competitionController;
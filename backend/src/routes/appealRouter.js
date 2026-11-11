const express = require('express');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { USER_ROLES } = require('../utils/constants');
const appealController = require('../controllers/appealController');

const router = express.Router();

router.post('/projects/:projectId/appeals', authenticate, appealController.handleCreateAppeal);
router.get('/projects/:projectId/appeals', authenticate, appealController.handleListProjectAppeals);
router.get('/admin/appeals', authenticate, checkRole(USER_ROLES.ADMIN), appealController.handleListAppeals);
router.patch('/admin/appeals/:appealId/review', authenticate, checkRole(USER_ROLES.ADMIN), appealController.handleReviewAppeal);

module.exports = router;

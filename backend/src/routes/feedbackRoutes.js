const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { SYSTEM_ROLES } = require('../utils/constants');
const { handleCreateFeedback, handleGetFeedbacks } = require('../controllers/feedbackController');

router.get('/', authMiddleware, handleGetFeedbacks);
router.post('/', authMiddleware, authorizeRoles(SYSTEM_ROLES.MENTOR, SYSTEM_ROLES.TEACHER), handleCreateFeedback);

module.exports = router;
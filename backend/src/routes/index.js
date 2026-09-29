const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const projectRoutes = require('./project.routes');

const router = express.Router();

/** Health check của API v1 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SESS API v1 đang hoạt động bình thường',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/projects', projectRoutes);

module.exports = router;

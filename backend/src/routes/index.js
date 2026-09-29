const express = require('express');
const router = express.Router();

const mentorRoutes = require('./mentorRoutes');
const projectRoutes = require('./projectRoutes');
const rubricRoutes = require('./rubricRoutes');
const milestoneRoutes = require('./milestoneRoutes');

// Mount routes dưới prefix /api/v1
router.use('/', mentorRoutes);
router.use('/projects', projectRoutes);
router.use('/evaluation-rubrics', rubricRoutes);
router.use('/projects/:projectId/milestones', milestoneRoutes);

module.exports = router;


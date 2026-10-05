const express = require('express');

// --- Routes của nhánh FR05-FR08 (mentor, rubric, milestone, admin duyệt dự án) ---
const mentorRoutes = require('./mentorRoutes');
const rubricRoutes = require('./rubricRoutes');
const milestoneRoutes = require('./milestoneRoutes');
const fr05ProjectRoutes = require('./projectRoutes');

// --- Routes của nhánh FR01-FR04 (auth, user, admin, project FR03/FR04) ---
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

// ---------------------------------------------------------------------------
// Nhánh FR05-FR08: mount ở root để giữ nguyên URL gốc của nhánh
// (GET /mentors, /mentor-assignments..., /evaluation-rubrics..., /projects/:projectId/milestones...)
// ---------------------------------------------------------------------------
router.use('/', mentorRoutes);
router.use('/evaluation-rubrics', rubricRoutes);
router.use('/projects/:projectId/milestones', milestoneRoutes);

// ---------------------------------------------------------------------------
// Nhánh FR01-FR04
// ---------------------------------------------------------------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

// ---------------------------------------------------------------------------
// /projects: mount CẢ HAI bộ route (không trùng path nên không che nhau)
//   FR05-FR08: GET /unassigned-mentor, PATCH /:projectId/status
//   FR01-FR04: POST /, PUT /:id, POST /:id/submit, GET /:id/revisions, các route thành viên (FR04)
// ---------------------------------------------------------------------------
router.use('/projects', fr05ProjectRoutes);
router.use('/projects', projectRoutes);

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');

// --- Routes của nhánh FR05-FR08 (mentor, rubric, milestone, admin duyệt dự án) ---
const mentorRoutes = require('./mentorRoutes');
const rubricRoutes = require('./rubricRoutes');
const milestoneRoutes = require('./milestoneRoutes');
const fr05ProjectRoutes = require('./projectRoutes');

// --- Routes của nhánh FR01-FR04 (auth, user, admin, project FR03/FR04) ---
const authRouter = require('./authRouter');
const userRouter = require('./userRouter');
const adminRouter = require('./adminRouter');
const projectRouter = require('./projectRouter');

const router = express.Router();

/** Health check của API v1 (liveness) */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SESS API v1 đang hoạt động bình thường',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

/** Readiness check - kiểm tra MongoDB kết nối */
router.get('/ready', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (dbState === 1) {
    res.status(200).json({
      success: true,
      message: 'Sẵn sàng phục vụ request',
      data: { mongodb: 'connected', uptime: process.uptime() },
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Chưa sẵn sàng - MongoDB chưa kết nối',
      code: 'SERVICE_UNAVAILABLE',
      data: { mongodb: ['disconnected', 'connecting', 'disconnecting'][dbState] || 'unknown' },
    });
  }
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
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);

// ---------------------------------------------------------------------------
// /projects: mount CẢ HAI bộ route (không trùng path nên không che nhau)
//   FR05-FR08: GET /unassigned-mentor, PATCH /:projectId/status
//   FR01-FR04: GET /, POST /, GET /:id, PUT /:id, POST /:id/submit, GET /:id/revisions, các route thành viên (FR04)
// ---------------------------------------------------------------------------
router.use('/projects', fr05ProjectRoutes);
router.use('/projects', projectRouter);

module.exports = router;
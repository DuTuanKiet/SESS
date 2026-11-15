const express = require('express');
const mongoose = require('mongoose');

// --- Routes của nhánh FR05-FR08 (mentor, rubric, milestone, admin duyệt dự án) ---
const mentorRoutes = require('./mentorRoutes');
const rubricRoutes = require('./rubricRoutes');
const milestoneRoutes = require('./milestoneRoutes');
const feedbackRoutes = require('./feedbackRoutes');

// --- Routes của nhánh FR01-FR04 (auth, user, admin, project FR03/FR04) ---
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const adminEvaluationRoutes = require('./adminEvaluationRoutes');
const projectRoutes = require('./projectRoutes');
const judgeWhitelistRoutes = require('./judgeWhitelistRoutes');
const cloudUploadRoutes = require('./cloudUploadRoutes');
const scoreOverrideRoutes = require('./scoreOverrideRoutes');
const emergencyJudgeReassignmentRoutes = require('./emergencyJudgeReassignmentRoutes');
const votingRoutes = require('./votingRoutes');
const newsRoutes = require('./newsRoutes');
const competitionRoutes = require('./competitionRoutes');
const notificationRoutes = require('./notificationRoutes');
const appealRoutes = require('./appealRoutes');

// --- Routes vòng đời nâng cao (Enterprise Edition) ---
const projectCancellationRoutes = require('./projectCancellationRoutes');
const projectHierarchyRoutes = require('./projectHierarchyRoutes');
const evaluationRoutes = require('./evaluationRoutes');
const evaluatorRoutes = require('./evaluatorRoutes');
const queueService = require('../services/queueService');

const router = express.Router();

/** Health check của API v1 (liveness) */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SESS API v1 đang hoạt động bình thường',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

/** Readiness check - kiểm tra MongoDB + trạng thái hạ tầng queue/Redis */
router.get('/ready', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const queueStatus = await queueService.getQueueStatus();
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (dbState === 1) {
    res.status(200).json({
      success: true,
      message: 'Sẵn sàng phục vụ request',
      data: {
        mongodb: 'connected',
        uptime: process.uptime(),
        redis: queueStatus.redisAvailable ? 'connected' : 'unavailable',
        queue: queueStatus.mode,
      },
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Chưa sẵn sàng - MongoDB chưa kết nối',
      code: 'SERVICE_UNAVAILABLE',
      data: {
        mongodb: ['disconnected', 'connecting', 'disconnecting'][dbState] || 'unknown',
        redis: queueStatus.redisAvailable ? 'connected' : 'unavailable',
        queue: queueStatus.mode,
      },
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
router.use('/projects/:projectId/feedbacks', feedbackRoutes);

// ---------------------------------------------------------------------------
// Nhánh FR01-FR04
// ---------------------------------------------------------------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin/evaluations', adminEvaluationRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/judge-whitelist', judgeWhitelistRoutes);
router.use('/cloud-upload', cloudUploadRoutes);
router.use('/score-overrides', scoreOverrideRoutes);
router.use('/emergency-judge-reassignments', emergencyJudgeReassignmentRoutes);
router.use('/public/votes', votingRoutes);
router.use('/news', newsRoutes);
router.use('/competitions', competitionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/', appealRoutes);

// ---------------------------------------------------------------------------
// /projects: mount CẢ bộ route (không trùng path nên không che nhau)
// Vòng đời nâng cao PHẢI được mount TRƯỚC projectRoutes vì có path tĩnh
// (/cancellation-requests) - nếu mount sau sẽ bị route GET /:id bắt mất.
// ---------------------------------------------------------------------------
router.use('/projects', projectCancellationRoutes);
router.use('/projects', projectHierarchyRoutes);
router.use('/projects', evaluationRoutes);
router.use('/evaluator', evaluatorRoutes);
router.use('/projects', projectRoutes);

module.exports = router;

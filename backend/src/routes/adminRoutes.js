const express = require('express');
const userController = require('../controllers/userController');
const adminDashboardController = require('../controllers/adminDashboardController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Toàn bộ API /admin yêu cầu đăng nhập + role admin
router.use(authenticate, checkRole(USER_ROLES.ADMIN));

// Quản lý tài khoản
router.get('/users', adminDashboardController.handleListUsers);
router.post('/users', userController.createUser);
router.patch('/users/:id/role', userController.updateUserRole);
router.patch('/users/:id/status', userController.updateUserStatus);

// Quản lý dự án / yêu cầu thành viên (toàn hệ thống)
router.get('/projects', adminDashboardController.handleListProjects);
router.get('/member-change-requests', adminDashboardController.handleListMemberChangeRequests);

// Dashboard & Audit (Admin)
router.get('/dashboard/summary', adminDashboardController.handleDashboardSummary);
router.get('/audit-logs', adminDashboardController.handleAuditLogs);

module.exports = router;

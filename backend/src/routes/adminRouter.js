const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { USER_ROLES } = require('../utils/constants');

const router = express.Router();

// Toàn bộ API /admin yêu cầu đăng nhập + role admin
router.use(authenticate, checkRole(USER_ROLES.ADMIN));

// Quản lý tài khoản
router.post('/users', userController.createUser);
router.patch('/users/:id/role', userController.updateUserRole);
router.patch('/users/:id/status', userController.updateUserStatus);

module.exports = router;

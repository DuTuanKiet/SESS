const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

// Rate-limit riêng cho nhóm API xác thực (chống brute-force mật khẩu và spam OTP)
router.use(authLimiter);

// Sinh viên KHÔNG tự đăng ký tài khoản (tài khoản do nhà trường cấp sẵn hoặc tự tạo qua Google)
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/google', authController.loginWithGoogle);
router.post('/refresh-token', authController.refreshToken);
// Logout xác thực bằng chính refresh token nên không cần access token còn hiệu lực
router.post('/logout', authController.logout);

module.exports = router;

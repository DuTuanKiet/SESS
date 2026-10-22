const express = require('express');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { requireRecaptcha } = require('../middlewares/recaptchaMiddleware');

const router = express.Router();

// Rate-limit riêng cho nhóm API xác thực (chống brute-force mật khẩu và spam OTP)
router.use(authLimiter);

// Sinh viên KHÔNG tự đăng ký tài khoản (tài khoản do nhà trường cấp sẵn hoặc tự tạo qua Google)
router.post('/verify-otp', authController.verifyOtp);
// Đăng nhập: bảo vệ thêm reCAPTCHA v3 để chặn tool đoán mật khẩu tự động
router.post('/login', requireRecaptcha({ expectedAction: 'login' }), authController.login);
router.post('/google', requireRecaptcha({ expectedAction: 'login' }), authController.loginWithGoogle);
router.post('/refresh-token', authController.refreshToken);
// Logout xác thực bằng refresh token nên không cần access token còn hiệu lực
router.post('/logout', authController.logout);

module.exports = router;

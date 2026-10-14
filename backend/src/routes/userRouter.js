const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/me', authenticate, userController.getMyProfile);

// FR02 - Hồ sơ cá nhân chi tiết (tự khởi tạo từ danh sách sinh viên của trường)
router.get('/profile/me', authenticate, userController.getMyProfileDetail);
router.put('/profile/me', authenticate, userController.updateMyProfileDetail);

module.exports = router;

const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { updateMyProfileBodySchema } = require('../validations/userValidation');

const router = express.Router();

router.get('/me', authenticate, userController.getMyProfile);

// FR02 - Hồ sơ cá nhân chi tiết (tự khởi tạo từ danh sách sinh viên của trường)
router.get('/profile/me', authenticate, userController.getMyProfileDetail);
router.put(
  '/profile/me',
  authenticate,
  validate({ body: updateMyProfileBodySchema }),
  userController.updateMyProfileDetail,
);

// BGK - Chấp nhận Cam kết Bảo mật Thông tin (Digital NDA)
router.post('/accept-nda', authenticate, userController.acceptNda);

module.exports = router;

const express = require('express');
const multer = require('multer');
const judgeWhitelistController = require('../controllers/judgeWhitelistController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');
const { requireRecaptcha } = require('../middlewares/recaptchaMiddleware');
const { createPublicEndpointLimiter } = require('../middlewares/redisRateLimitMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { USER_ROLES } = require('../utils/constants');
const {
  judgeWhitelistIdParamsSchema,
  getJudgeWhitelistQuerySchema,
} = require('../validations/judgeWhitelistValidation');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'text/csv',
    ];
    const allowedExts = ['.xls', '.xlsx', '.csv'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    const mimeOk = allowedMimes.includes(file.mimetype);
    const extOk = allowedExts.includes(ext);
    if (mimeOk || extOk) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file Excel (.xls, .xlsx) hoặc CSV (.csv)'));
  },
});

router.use(authenticate, checkRole(USER_ROLES.ADMIN));

const whitelistImportLimiter = createPublicEndpointLimiter({
  max: 5,
  windowSeconds: 300,
  scope: 'whitelist-import',
  message: 'Bạn đã import danh sách quá nhiều lần. Vui lòng thử lại sau.',
  code: 'WHITELIST_IMPORT_RATE_LIMIT_EXCEEDED',
});

router.get('/', validate({ query: getJudgeWhitelistQuerySchema }), judgeWhitelistController.getJudgeWhitelist);
router.post(
  '/import',
  whitelistImportLimiter,
  requireRecaptcha({ expectedAction: 'whitelist_import' }),
  upload.single('file'),
  judgeWhitelistController.importJudgeWhitelistExcel,
);
router.delete(
  '/:id',
  validate({ params: judgeWhitelistIdParamsSchema }),
  judgeWhitelistController.removeJudgeWhitelist,
);

module.exports = router;

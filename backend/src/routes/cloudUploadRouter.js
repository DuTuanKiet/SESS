const express = require('express');
const cloudUploadController = require('../controllers/cloudUploadController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const devCloudUploadController = require('../controllers/devCloudUploadController');
const { STORAGE_PROVIDER } = require('../utils/constants');
const { z } = require('zod');

const router = express.Router();

/** Schema body yêu cầu Presigned URL */
const presignedUrlBodySchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'projectId không đúng định dạng ObjectId.' }),
  originalName: z.string().trim().min(1, 'Tên file gốc là bắt buộc.').max(255),
  fileType: z.enum(['video', 'poster', 'document', 'image'], {
    errorMap: () => ({ message: 'fileType phải là video, poster, document hoặc image.' }),
  }),
  fileSize: z.number().int().nonnegative('fileSize phải là số nguyên không âm.'),
  mimeType: z.string().trim().max(150).optional(),
});

/** Schema body xác nhận upload */
const confirmUploadBodySchema = z.object({
  objectKey: z.string().min(1, 'objectKey là bắt buộc.'),
  checksum: z.string().optional(),
});

const projectFilesParamsSchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'projectId không đúng định dạng ObjectId.'),
});

// URL giả lập chỉ được mount ở môi trường development với storage provider dev.
if (STORAGE_PROVIDER === 'dev' && (process.env.NODE_ENV || 'development') === 'development') {
  router.put(/^\/dev-mock\/(.+)$/, devCloudUploadController.uploadDevelopmentFile);
  router.get(/^\/dev-mock\/(.+)$/, devCloudUploadController.readDevelopmentFile);
}

router.use(authenticate);

/** POST /api/v1/cloud-upload/presigned-url */
router.post(
  '/presigned-url',
  validate({ body: presignedUrlBodySchema }),
  cloudUploadController.requestPresignedUrl,
);

/** POST /api/v1/cloud-upload/confirm */
router.post(
  '/confirm',
  validate({ body: confirmUploadBodySchema }),
  cloudUploadController.confirmUpload,
);

/** GET /api/v1/cloud-upload/files/:projectId */
router.get(
  '/files/:projectId',
  validate({ params: projectFilesParamsSchema }),
  cloudUploadController.listProjectFiles,
);

module.exports = router;

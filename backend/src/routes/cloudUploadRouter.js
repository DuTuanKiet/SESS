const express = require('express');
const cloudUploadController = require('../controllers/cloudUploadController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { z } = require('zod');

const router = express.Router();

/** Schema body yêu cầu Presigned URL */
const presignedUrlBodySchema = z.object({
  projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'projectId không đúng định dạng ObjectId.' }),
  originalName: z.string().min(1, 'Tên file gốc là bắt buộc.'),
  fileType: z.enum(['video', 'poster', 'document'], {
    errorMap: () => ({ message: 'fileType phải là video, poster hoặc document.' }),
  }),
  fileSize: z.number().int().nonnegative('fileSize phải là số nguyên không âm.'),
});

/** Schema body xác nhận upload */
const confirmUploadBodySchema = z.object({
  objectKey: z.string().min(1, 'objectKey là bắt buộc.'),
  checksum: z.string().optional(),
});

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
  cloudUploadController.listProjectFiles,
);

module.exports = router;

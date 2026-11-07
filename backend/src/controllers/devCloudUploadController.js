const fs = require('node:fs');
const path = require('node:path');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const cloudUploadWorkflowService = require('../services/cloudUploadWorkflowService');
const ApiError = require('../utils/apiError');

async function uploadDevelopmentFile(req, res) {
  const objectKey = req.params[0];
  const { fileRecord, filePath } = await cloudUploadWorkflowService.prepareDevelopmentUpload(objectKey);
  const contentLength = req.headers['content-length'];
  if (contentLength !== undefined && Number(contentLength) !== fileRecord.fileSize) {
    throw ApiError.badRequest('Kích thước file không khớp với yêu cầu upload.', 'UPLOAD_SIZE_MISMATCH');
  }

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  let receivedBytes = 0;
  const sizeGuard = new Transform({
    transform(chunk, _encoding, callback) {
      receivedBytes += chunk.length;
      if (receivedBytes > fileRecord.fileSize) {
        callback(ApiError.badRequest('File vượt quá kích thước đã đăng ký.', 'FILE_TOO_LARGE'));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(req, sizeGuard, fs.createWriteStream(filePath, { flags: 'w' }));
  } catch (error) {
    await fs.promises.unlink(filePath).catch(() => {});
    throw error;
  }

  if (receivedBytes !== fileRecord.fileSize) {
    await fs.promises.unlink(filePath).catch(() => {});
    throw ApiError.badRequest('Kích thước file không khớp với yêu cầu upload.', 'UPLOAD_SIZE_MISMATCH');
  }
  fileRecord.uploadedAt = new Date();
  await fileRecord.save();
  res.status(204).end();
}

async function readDevelopmentFile(req, res) {
  const objectKey = req.params[0];
  const { fileRecord, filePath } = await cloudUploadWorkflowService.getDevelopmentFile(objectKey);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    throw ApiError.notFound('Tệp không tồn tại hoặc đã bị xóa khỏi bộ nhớ.', 'FILE_NOT_FOUND');
  }
  res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', String(fileRecord.fileSize));
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileRecord.originalName)}`);
  fs.createReadStream(filePath).pipe(res);
}

module.exports = {
  uploadDevelopmentFile,
  readDevelopmentFile,
};

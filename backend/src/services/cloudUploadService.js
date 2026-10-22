const crypto = require('node:crypto');
const axios = require('axios');
const {
  STORAGE_PROVIDER,
  STORAGE_ENDPOINT,
  STORAGE_BUCKET,
  STORAGE_REGION,
  STORAGE_ACCESS_KEY,
  STORAGE_SECRET_KEY,
  STORAGE_PUBLIC_DOMAIN,
  ALLOWED_UPLOAD_EXTENSIONS,
  UPLOAD_SIZE_LIMITS,
} = require('../utils/constants');
const ApiError = require('../utils/apiError');

/** Map extension -> fileType */
const EXT_TO_FILE_TYPE = {
  '.mp4': 'video',
  '.pdf': 'document',
  '.docx': 'document',
  '.png': 'poster',
  '.jpg': 'poster',
  '.jpeg': 'poster',
};

/** Chuẩn hóa tên object key trong bucket */
const buildObjectKey = ({ projectId, userId, originalName, fileType }) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  return `uploads/projects/${projectId}/${fileType}/${timestamp}-${userId}-${safeName}`;
};

/** Kiểm tra định dạng file và kích thước */
const validateUploadFile = ({ originalName, fileType, fileSize }) => {
  const fileExtension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(fileExtension)) {
    throw ApiError.badRequest(
      `Định dạng file "${fileExtension}" không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}`,
      'INVALID_FILE_EXTENSION',
    );
  }

  const expectedType = EXT_TO_FILE_TYPE[fileExtension];
  if (expectedType && fileType !== expectedType) {
    throw ApiError.badRequest(
      `Loại file "${fileType}" không khớp với định dạng "${fileExtension}"`,
      'INVALID_FILE_TYPE',
    );
  }

  const limit = UPLOAD_SIZE_LIMITS[fileType];
  if (limit && fileSize > limit) {
    const maxMB = (limit / (1024 * 1024)).toFixed(0);
    throw ApiError.badRequest(
      `Kích thước file quá lớn (${(fileSize / (1024 * 1024)).toFixed(2)}MB). Giới hạn ${maxMB}MB cho loại "${fileType}".`,
      'FILE_TOO_LARGE',
    );
  }

  return fileExtension;
};

/** Tạo Presigned URL cho client upload trực tiếp (dev mode nếu không cấu hình storage) */
const generatePresignedUploadUrl = async ({
  projectId,
  userId,
  originalName,
  fileType,
  fileSize,
  expiresInSeconds = 900, // 15 phút
}) => {
  validateUploadFile({ originalName, fileType, fileSize });
  const objectKey = buildObjectKey({ projectId, userId, originalName, fileType });

  // Dev mode: không có storage thật -> trả mock URL để frontend test
  if (STORAGE_PROVIDER === 'dev' || !STORAGE_ENDPOINT) {
    const presignedUrl = `${STORAGE_PUBLIC_DOMAIN || 'http://localhost:5000'}/api/v1/cloud-upload/dev-mock/${objectKey}`;
    return {
      uploadUrl: presignedUrl,
      objectKey,
      fileType,
      originalName,
      fileSize,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      method: 'PUT',
      headers: { 'Content-Type': '' },
      note: 'DEV MODE: Không có Cloud Storage thật. Sử dụng mock URL.',
    };
  }

  // S3-compatible (MinIO / R2 / AWS S3) - tạo Presigned URL bằng axios + signature v2 đơn giản
  const putUrl = `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${encodeURIComponent(objectKey)}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const amzDate = date;
  const dateStamp = date.substring(0, 8);

  // Tạo canonical request đơn giản (v4 streamlined cho PUT object)
  const canonicalHeaders = `host:${new URL(STORAGE_ENDPOINT).host}\nx-amz-acl:private\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-acl;x-amz-date';
  const canonicalRequest = [
    'PUT',
    `/${STORAGE_BUCKET}/${encodeURIComponent(objectKey)}`,
    '',
    canonicalHeaders,
    signedHeaders,
    crypto.createHash('sha256').update('', 'utf8').digest('hex'),
  ].join('\n');

  const credentialScope = `${dateStamp}/${STORAGE_REGION}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
  ].join('\n');

  // HMAC signing chain (AWS v4)
  const kDate = crypto.createHmac('sha256', `AWS4${STORAGE_SECRET_KEY}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(STORAGE_REGION).digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${STORAGE_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const publicDomain = STORAGE_PUBLIC_DOMAIN || STORAGE_ENDPOINT;
  const publicUrl = `${publicDomain}/${STORAGE_BUCKET}/${objectKey}`;

  return {
    uploadUrl: putUrl,
    objectKey,
    fileType,
    originalName,
    fileSize,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'x-amz-acl': 'private',
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    publicUrl,
  };
};

/** Xác nhận file đã upload xong (gọi sau khi client upload thành công) */
const confirmUpload = async ({ objectKey, fileType, fileSize, checksum }) => {
  // Nếu storage thật, có thể gọi HEAD object để kiểm tra tồn tại
  if (STORAGE_PROVIDER !== 'dev' && STORAGE_ENDPOINT) {
    try {
      const headUrl = `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/${encodeURIComponent(objectKey)}`;
      await axios.head(headUrl);
    } catch {
      throw ApiError.notFound('File chưa được upload lên Cloud Storage', 'FILE_NOT_FOUND_IN_STORAGE');
    }
  }

  return {
    objectKey,
    fileType,
    fileSize,
    checksum,
    status: 'completed',
    confirmedAt: new Date(),
  };
};

module.exports = {
  EXT_TO_FILE_TYPE,
  validateUploadFile,
  buildObjectKey,
  generatePresignedUploadUrl,
  confirmUpload,
};

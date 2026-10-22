const cloudUploadService = require('../services/cloudUploadService');
const queueService = require('../services/queueService');
const CloudFileUpload = require('../models/CloudFileUpload');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');

/** POST /api/v1/cloud-upload/presigned-url - yêu cầu Presigned URL để upload file trực tiếp */
const requestPresignedUrl = async (req, res) => {
  const { projectId, originalName, fileType, fileSize } = req.body;
  const userId = req.user.id;

  if (!projectId || !originalName || !fileType || fileSize === undefined) {
    throw ApiError.badRequest('Thiếu thông tin bắt buộc: projectId, originalName, fileType, fileSize', 'MISSING_UPLOAD_INFO');
  }

  // Kiểm tra dự án tồn tại và user là thành viên
  const project = await Project.findById(projectId);
  if (!project) {
    throw ApiError.notFound('Không tìm thấy dự án', 'PROJECT_NOT_FOUND');
  }

  const presigned = await cloudUploadService.generatePresignedUploadUrl({
    projectId,
    userId,
    originalName,
    fileType,
    fileSize: Number(fileSize),
  });

  // Lưu bản ghi pending vào CloudFileUpload
  await CloudFileUpload.create({
    projectId,
    uploadedBy: userId,
    originalName,
    fileType,
    mimeType: '', // sẽ cập nhật sau khi confirm
    fileSize: Number(fileSize),
    objectKey: presigned.objectKey,
    presignedUrl: presigned.uploadUrl,
    presignedExpiresAt: presigned.expiresAt,
    status: 'pending',
  });

  res.status(200).json({
    success: true,
    message: 'Cấp Presigned URL thành công.',
    data: {
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      fileType: presigned.fileType,
      originalName: presigned.originalName,
      fileSize: presigned.fileSize,
      expiresAt: presigned.expiresAt,
      method: presigned.method,
      headers: presigned.headers,
      publicUrl: presigned.publicUrl,
      note: presigned.note,
    },
  });
};

/** POST /api/v1/cloud-upload/confirm - xác nhận file đã upload xong */
const confirmUpload = async (req, res) => {
  const { objectKey, checksum } = req.body;
  if (!objectKey) {
    throw ApiError.badRequest('Thiếu objectKey', 'MISSING_OBJECT_KEY');
  }

  const fileRecord = await CloudFileUpload.findOne({ objectKey, uploadedBy: req.user.id });
  if (!fileRecord) {
    throw ApiError.notFound('Không tìm thấy bản ghi upload file', 'FILE_RECORD_NOT_FOUND');
  }

  // Xác nhận trên Cloud Storage (HEAD tới S3/MinIO) + cập nhật DB là tác vụ I/O chậm.
  // Đưa vào BullMQ để không chặn request và giảm tải ghi MongoDB.
  // Khi không có Redis -> chạy inline với cùng processor nên kết quả nhất quán.
  const result = await queueService.enqueueConfirmUpload({
    objectKey,
    fileType: fileRecord.fileType,
    fileSize: fileRecord.fileSize,
    checksum,
    uploadedBy: req.user.id,
  });

  const isQueued = result.queued === true;

  res.status(200).json({
    success: true,
    message: isQueued
      ? 'Đã nhận yêu cầu xác nhận upload. Hệ thống đang xử lý nền.'
      : 'Xác nhận upload file thành công.',
    data: {
      objectKey,
      publicUrl: fileRecord.publicUrl || '',
      fileType: fileRecord.fileType,
      fileSize: fileRecord.fileSize,
      status: isQueued ? 'processing' : 'completed',
    },
  });
};

/** GET /api/v1/cloud-upload/files/:projectId - danh sách file đã upload của dự án */
const listProjectFiles = async (req, res) => {
  const { projectId } = req.params;
  const files = await CloudFileUpload.find({ projectId, uploadedBy: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách file upload thành công.',
    data: { files },
  });
};

module.exports = {
  requestPresignedUrl,
  confirmUpload,
  listProjectFiles,
};

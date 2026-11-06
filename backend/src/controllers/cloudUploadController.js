const cloudUploadWorkflowService = require('../services/cloudUploadWorkflowService');

const requestPresignedUrl = async (req, res) => {
  const data = await cloudUploadWorkflowService.requestPresignedUpload({
    userId: req.user.id,
    payload: req.body,
  });
  res.status(200).json({
    success: true,
    message: 'Cấp Presigned URL thành công.',
    data,
  });
};

const confirmUpload = async (req, res) => {
  const data = await cloudUploadWorkflowService.confirmProjectUpload({
    userId: req.user.id,
    objectKey: req.body.objectKey,
    checksum: req.body.checksum,
  });
  res.status(200).json({
    success: true,
    message: data.status === 'processing'
      ? 'Đã nhận yêu cầu xác nhận upload. Tệp đang được xử lý.'
      : 'Xác nhận upload file thành công.',
    data,
  });
};

const listProjectFiles = async (req, res) => {
  const data = await cloudUploadWorkflowService.listProjectFiles({
    projectId: req.params.projectId,
    user: req.user,
  });
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách file dự án thành công.',
    data,
  });
};

module.exports = {
  requestPresignedUrl,
  confirmUpload,
  listProjectFiles,
};

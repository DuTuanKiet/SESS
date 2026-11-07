const path = require('node:path');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const MentorAssignment = require('../models/MentorAssignment');
const CloudFileUpload = require('../models/CloudFileUpload');
const cloudUploadService = require('./cloudUploadService');
const queueService = require('./queueService');
const ApiError = require('../utils/apiError');
const {
  ASSIGNMENT_STATUS,
  PROJECT_MEMBER_STATUS,
  STORAGE_PROVIDER,
} = require('../utils/constants');

const DEV_STORAGE_ROOT = path.resolve(__dirname, '../../uploads/dev');

function getUserRole(user) {
  return String(user?.systemRole || user?.role || '').toLowerCase();
}

async function getProjectOrFail(projectId) {
  const project = await Project.findById(projectId).lean();
  if (!project) throw ApiError.notFound('Không tìm thấy dự án.', 'PROJECT_NOT_FOUND');
  return project;
}

async function assertAcceptedMember(projectId, userId) {
  const membership = await ProjectMember.findOne({
    projectId,
    userId,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).lean();
  if (!membership) {
    throw ApiError.forbidden('Chỉ thành viên đã chấp nhận tham gia dự án mới được tải tệp lên.', 'PROJECT_MEMBERSHIP_REQUIRED');
  }
  return membership;
}

async function assertCanViewProjectFiles({ project, projectId, user }) {
  const role = getUserRole(user);
  if (role === 'admin') return;

  const userId = user.id || user._id;
  const membership = await ProjectMember.findOne({
    projectId,
    userId,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
  }).lean();
  if (membership) return;

  if (role === 'mentor' || role === 'teacher') {
    const assignment = await MentorAssignment.findOne({
      projectId,
      mentorId: userId,
      status: ASSIGNMENT_STATUS.ASSIGNED,
    }).lean();
    if (assignment) return;
  }

  if (role === 'judge' && (project.judges || []).some((judgeId) => String(judgeId) === String(userId))) return;
  throw ApiError.forbidden('Bạn không có quyền xem tệp của dự án này.', 'FORBIDDEN');
}

async function requestPresignedUpload({ userId, payload }) {
  await getProjectOrFail(payload.projectId);
  await assertAcceptedMember(payload.projectId, userId);

  const presigned = await cloudUploadService.generatePresignedUploadUrl({
    projectId: payload.projectId,
    userId,
    originalName: payload.originalName,
    fileType: payload.fileType,
    fileSize: Number(payload.fileSize),
  });

  const publicUrl = presigned.publicUrl || presigned.uploadUrl;
  await CloudFileUpload.create({
    projectId: payload.projectId,
    uploadedBy: userId,
    originalName: payload.originalName,
    fileType: presigned.fileType,
    mimeType: payload.mimeType || 'application/octet-stream',
    fileSize: Number(payload.fileSize),
    objectKey: presigned.objectKey,
    publicUrl,
    presignedUrl: presigned.uploadUrl,
    presignedExpiresAt: presigned.expiresAt,
    status: 'pending',
  });

  return {
    uploadUrl: presigned.uploadUrl,
    objectKey: presigned.objectKey,
    fileType: presigned.fileType,
    originalName: presigned.originalName,
    fileSize: presigned.fileSize,
    expiresAt: presigned.expiresAt,
    method: presigned.method,
    headers: presigned.headers,
    publicUrl,
    note: presigned.note,
  };
}

async function confirmProjectUpload({ userId, objectKey, checksum }) {
  const fileRecord = await CloudFileUpload.findOne({ objectKey, uploadedBy: userId });
  if (!fileRecord) throw ApiError.notFound('Không tìm thấy bản ghi upload của tài khoản này.', 'FILE_RECORD_NOT_FOUND');

  if (fileRecord.status === 'completed') {
    return {
      objectKey,
      publicUrl: fileRecord.publicUrl,
      fileType: fileRecord.fileType,
      fileSize: fileRecord.fileSize,
      fileName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      status: 'completed',
    };
  }

  const result = await queueService.enqueueConfirmUpload({
    objectKey,
    fileType: fileRecord.fileType,
    fileSize: fileRecord.fileSize,
    checksum,
    uploadedBy: String(userId),
  });

  if (result.queued) {
    return { objectKey, status: 'processing' };
  }

  const confirmedRecord = await CloudFileUpload.findOne({ objectKey, uploadedBy: userId }).lean();
  if (confirmedRecord?.status !== 'completed') {
    return { objectKey, status: 'processing' };
  }

  return {
    objectKey,
    publicUrl: confirmedRecord.publicUrl,
    fileType: confirmedRecord.fileType,
    fileSize: confirmedRecord.fileSize,
    fileName: confirmedRecord.originalName,
    mimeType: confirmedRecord.mimeType,
    status: 'completed',
  };
}

async function listProjectFiles({ projectId, user }) {
  const project = await getProjectOrFail(projectId);
  await assertCanViewProjectFiles({ project, projectId, user });
  const files = await CloudFileUpload.find({ projectId, status: 'completed' })
    .select('-presignedUrl')
    .sort({ createdAt: -1 })
    .lean();
  return { files };
}

function assertDevelopmentStorageEnabled() {
  if (STORAGE_PROVIDER !== 'dev' || (process.env.NODE_ENV || 'development') !== 'development') {
    throw ApiError.notFound('Không tìm thấy đường dẫn upload.', 'NOT_FOUND');
  }
}

function resolveDevObjectPath(objectKey) {
  const normalizedKey = objectKey.startsWith('uploads/projects/')
    ? objectKey.replace(/^uploads\//, '')
    : objectKey;
  const resolved = path.resolve(DEV_STORAGE_ROOT, normalizedKey);
  if (!resolved.startsWith(`${DEV_STORAGE_ROOT}${path.sep}`)) {
    throw ApiError.badRequest('objectKey không hợp lệ.', 'INVALID_OBJECT_KEY');
  }
  return resolved;
}

async function prepareDevelopmentUpload(objectKey) {
  assertDevelopmentStorageEnabled();
  if (!objectKey.startsWith('projects/') && !objectKey.startsWith('uploads/projects/')) {
    throw ApiError.badRequest('objectKey không thuộc thư mục upload của dự án.', 'INVALID_OBJECT_KEY');
  }
  const fileRecord = await CloudFileUpload.findOne({ objectKey });
  if (!fileRecord || fileRecord.status !== 'pending') {
    throw ApiError.notFound('Không tìm thấy bản ghi upload còn hiệu lực.', 'FILE_RECORD_NOT_FOUND');
  }
  if (!fileRecord.presignedExpiresAt || fileRecord.presignedExpiresAt <= new Date()) {
    throw ApiError.badRequest('URL upload đã hết hạn.', 'PRESIGNED_URL_EXPIRED');
  }
  const expectedOwner = String(fileRecord.uploadedBy);
  if (!objectKey.includes(`-${expectedOwner}-`)) {
    throw ApiError.forbidden('objectKey không khớp với chủ sở hữu bản ghi upload.', 'UPLOAD_OWNER_MISMATCH');
  }
  return { fileRecord, filePath: resolveDevObjectPath(objectKey) };
}

async function getDevelopmentFile(objectKey) {
  assertDevelopmentStorageEnabled();
  let fileRecord = await CloudFileUpload.findOne({ objectKey, status: 'completed' }).lean();
  if (!fileRecord && objectKey.startsWith('projects/')) {
    fileRecord = await CloudFileUpload.findOne({ objectKey: `uploads/${objectKey}`, status: 'completed' }).lean();
  } else if (!fileRecord && objectKey.startsWith('uploads/projects/')) {
    fileRecord = await CloudFileUpload.findOne({ objectKey: objectKey.replace(/^uploads\//, ''), status: 'completed' }).lean();
  }
  if (!fileRecord) throw ApiError.notFound('Không tìm thấy tệp đã xác nhận.', 'FILE_NOT_FOUND');
  return { fileRecord, filePath: resolveDevObjectPath(objectKey) };
}

module.exports = {
  requestPresignedUpload,
  confirmProjectUpload,
  listProjectFiles,
  prepareDevelopmentUpload,
  getDevelopmentFile,
};

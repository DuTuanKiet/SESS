const mongoose = require('mongoose');

/**
 * Metadata file upload trực tiếp lên Cloud Storage (Presigned URL) - Enterprise Edition.
 * Backend KHÔNG lưu file thực tế, chỉ lưu URL + metadata để kiểm soát quyền truy cập.
 *
 * Hỗ trợ file: Video (mp4 <500MB), Poster (png/jpg <10MB), Thuyết minh (pdf/docx <50MB).
 */
const cloudFileUploadSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Tên file gốc */
    originalName: { type: String, required: true, trim: true },
    /** Loại file: 'video' | 'poster' | 'document' */
    fileType: {
      type: String,
      enum: ['video', 'poster', 'document'],
      required: true,
      index: true,
    },
    /** MIME type */
    mimeType: { type: String, required: true, trim: true },
    /** Kích thước file (byte) */
    fileSize: { type: Number, required: true, min: 0 },
    /** Đường dẫn object key trong bucket */
    objectKey: { type: String, required: true, trim: true },
    /** URL public để tải file (sau khi upload xong) */
    publicUrl: { type: String, trim: true, default: '' },
    /** URL Presigned để client upload trực tiếp (temporary) */
    presignedUrl: { type: String, trim: true, default: '' },
    /** Hạn dùng của presigned upload URL */
    presignedExpiresAt: { type: Date, default: null },
    /** Trạng thái upload: 'pending' | 'completed' | 'failed' */
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    /** Checksum MD5/SHA256 của file để kiểm tra toàn vẹn */
    checksum: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    collection: 'cloud_file_uploads',
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

cloudFileUploadSchema.index({ projectId: 1, fileType: 1, createdAt: -1 });

module.exports = mongoose.model('CloudFileUpload', cloudFileUploadSchema);

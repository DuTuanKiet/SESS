const mongoose = require('mongoose');
const { PROJECT_STATUS, MILESTONE_STATUS } = require('../utils/constants');

/** Mốc tiến độ của dự án (dùng cho FR03 và dữ liệu gửi AI ở FR09/FR10) */
const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Tên mốc tiến độ là bắt buộc'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: Object.values(MILESTONE_STATUS), default: MILESTONE_STATUS.PLANNED },
  },
  { _id: false },
);

/**
 * Dự án khởi nghiệp của sinh viên - hợp nhất 2 nhánh:
 * - FR01-FR04 (FR03/FR04): title/code/category/abstract/problemStatement/solution/businessModel/
 *   attachmentUrl + milestones[] + ownerId + version + lastSubmittedAt; thành viên lưu ở ProjectMember.
 * - FR05-FR08: name/field/description + members[] (projectRole Owner/Member) + currentVersion;
 *   dùng cho phân công mentor và chuyển trạng thái của Admin.
 * Các cặp trường tương ứng được đồng bộ tự động trong pre('validate') nên cả 2 luồng cùng chạy được.
 * Vòng đời trạng thái: DRAFT -> SUBMITTED -> (NEED_REVISION -> SUBMITTED) -> UNDER_MENTORSHIP -> COMPLETED.
 */
const projectSchema = new mongoose.Schema(
  {
    // --- Nhánh FR01-FR04 ---
    title: { type: String, trim: true, maxlength: 200 },
    /** Mã dự án tự sinh, VD: SESS-2026-001 */
    code: { type: String, unique: true, sparse: true, trim: true, index: true },
    category: { type: String, trim: true, default: '', maxlength: 120 },
    abstract: { type: String, trim: true, default: '', maxlength: 2000 },
    problemStatement: { type: String, trim: true, default: '', maxlength: 4000 },
    solution: { type: String, trim: true, default: '', maxlength: 4000 },
    businessModel: { type: String, trim: true, default: '', maxlength: 2000 },
    attachmentUrl: { type: String, trim: true, default: '' },
    /** Các mốc tiến độ của dự án */
    milestones: { type: [milestoneSchema], default: [] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    version: { type: Number, default: 1, min: 1 },
    lastSubmittedAt: { type: Date, default: null },

    // --- Nhánh FR05-FR08 ---
    name: { type: String, trim: true },
    field: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    currentVersion: { type: Number, default: 1 },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        projectRole: {
          type: String,
          enum: ['Owner', 'Member'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // --- Trường dùng chung ---
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.DRAFT,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

/**
 * Đồng bộ dữ liệu giữa 2 nhánh (chạy trước validation):
 * title <-> name, category <-> field, abstract <-> description, version <-> currentVersion.
 * Nhờ đó dự án tạo từ API FR03 vẫn hiển thị/tìm kiếm được bằng API FR05-FR08 và ngược lại.
 */
projectSchema.pre('validate', function syncBranchFields() {
  if (!this.name && this.title) this.name = this.title;
  if (!this.title && this.name) this.title = this.name;

  if (!this.field && this.category) this.field = this.category;
  if (!this.category && this.field) this.category = this.field;

  if (!this.description && this.abstract) this.description = this.abstract;
  if (!this.abstract && this.description) this.abstract = this.description;

  if (this.isModified('version') && !this.isModified('currentVersion')) this.currentVersion = this.version;
  if (this.isModified('currentVersion') && !this.isModified('version')) this.version = this.currentVersion;
});

module.exports = mongoose.model('Project', projectSchema);
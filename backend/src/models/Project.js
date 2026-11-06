const mongoose = require('mongoose');
const { PROJECT_STATUS, MILESTONE_STATUS, PROJECT_LEVEL } = require('../utils/constants');

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

const advisorInfoSchema = new mongoose.Schema(
  {
    hasAdvisor: { type: Boolean, default: false },
    fullName: { type: String, trim: true, default: '', maxlength: 200 },
    email: { type: String, lowercase: true, trim: true, default: '', maxlength: 254 },
    phone: { type: String, trim: true, default: '', maxlength: 30 },
    department: { type: String, trim: true, default: '', maxlength: 200 },
    academicRank: { type: String, trim: true, default: '', maxlength: 100 },
  },
  { _id: false },
);

const leaderInfoSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '', maxlength: 200 },
    studentId: { type: String, trim: true, default: '', maxlength: 50 },
    className: { type: String, trim: true, default: '', maxlength: 100 },
    faculty: { type: String, trim: true, default: '', maxlength: 200 },
    email: { type: String, lowercase: true, trim: true, default: '', maxlength: 254 },
    phone: { type: String, trim: true, default: '', maxlength: 30 },
  },
  { _id: false },
);

const submissionItemSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '', maxlength: 2048 },
    fileName: { type: String, trim: true, default: '', maxlength: 255 },
    fileSize: { type: Number, min: 0, default: null },
    mimeType: { type: String, trim: true, default: '', maxlength: 150 },
    objectKey: { type: String, trim: true, default: '', maxlength: 1024 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const submissionReceiptSchema = new mongoose.Schema(
  {
    hash: { type: String, trim: true, default: '' },
    submittedAt: { type: Date, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const submissionRoundSchema = new mongoose.Schema(
  {
    roundId: { type: String, trim: true, default: '' },
    roundNumber: { type: Number, min: 1 },
    title: { type: String, trim: true, default: '', maxlength: 200 },
    status: { type: String, trim: true, default: '', maxlength: 50 },
    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    feedback: { type: String, trim: true, default: '', maxlength: 4000 },
    items: {
      pitchDeck: { type: submissionItemSchema, default: () => ({}) },
      demoVideo: { type: submissionItemSchema, default: () => ({}) },
      sourceCode: { type: submissionItemSchema, default: () => ({}) },
      businessModel: { type: submissionItemSchema, default: () => ({}) },
    },
    receipt: { type: submissionReceiptSchema, default: () => ({}) },
  },
  { _id: true },
);

const awardSchema = new mongoose.Schema(
  {
    rank: { type: String, trim: true, default: '', maxlength: 100 },
    prizeName: { type: String, trim: true, default: '', maxlength: 200 },
    cashAmount: { type: Number, min: 0, default: null },
    certificateCode: { type: String, trim: true, default: '', maxlength: 120 },
    awardedAt: { type: Date, default: null },
    decisionNumber: { type: String, trim: true, default: '', maxlength: 120 },
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
 * Vòng đời trạng thái: DRAFT -> SUBMITTED -> IN_REVIEW -> (NEED_REVISION -> SUBMITTED) ->
 *   UNDER_MENTORSHIP -> EVALUATED -> COMPLETED.
 */
const projectSchema = new mongoose.Schema(
  {
    // --- Nhánh FR01-FR04 ---
    title: { type: String, trim: true, maxlength: 200 },
    /** Mã dự án tự sinh, VD: SESS-2026-001 */
    code: { type: String, unique: true, sparse: true, trim: true, index: true },
    category: { type: String, trim: true, default: '', maxlength: 120 },
    abstract: { type: String, trim: true, default: '', maxlength: 2000 },
    faculty: { type: String, trim: true, default: '', maxlength: 200 },
    objectives: { type: String, trim: true, default: '', maxlength: 2000 },
    problemStatement: { type: String, trim: true, default: '', maxlength: 4000 },
    solution: { type: String, trim: true, default: '', maxlength: 4000 },
    businessModel: { type: String, trim: true, default: '', maxlength: 2000 },
    attachmentUrl: { type: String, trim: true, default: '' },
    /** Các mốc tiến độ của dự án */
    milestones: { type: [milestoneSchema], default: [] },
    advisorInfo: { type: advisorInfoSchema, default: () => ({}) },
    /** Luôn được làm giàu từ hồ sơ sinh viên trong StudentWhitelist. */
    leaderInfo: { type: leaderInfoSchema, default: () => ({}) },
    competitionId: { type: String, trim: true, default: '' },
    competitionTitle: { type: String, trim: true, default: '', maxlength: 200 },
    currentRound: { type: Number, min: 1, default: 1 },
    submissionRounds: { type: [submissionRoundSchema], default: [] },
    /** Thông tin giải do quy trình quản trị/seed ghi; project update không cho client sửa. */
    award: { type: awardSchema, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    version: { type: Number, default: 1, min: 1 },
    lastSubmittedAt: { type: Date, default: null },

    // --- Biên nhận số (Digital Receipt) - Enterprise Edition ---
    /** Hash SHA-256 liên kết metadata lần nộp với snapshot phiên bản. */
    digitalReceiptHash: { type: String, trim: true, default: '' },
    /** Thời điểm sinh biên nhận (mili-giây) */
    digitalReceiptTimestamp: { type: Date, default: null },
    /** File đính kèm kèm theo biên nhận (URL cloud storage) */
    digitalReceiptFileUrl: { type: String, trim: true, default: '' },

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

    // --- Thi đấu đa cấp (Enterprise Edition) ---
    /** Dự án cha (bản gốc ở cấp thấp hơn). null = dự án gốc cấp Khoa. */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    /** Cấp thi của dự án */
    level: {
      type: String,
      enum: Object.values(PROJECT_LEVEL),
      default: PROJECT_LEVEL.FACULTY,
      index: true,
    },
    /** Đánh dấu dự án đang liên kết thi vượt cấp (có dự án cha hoặc có dự án con) */
    isLinked: { type: Boolean, default: false, index: true },

    /** Tiểu ban giám khảo của dự án (dùng cho vòng chấm Rubric -> trạng thái EVALUATED) */
    judges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
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
  const syncAlias = (primary, alias) => {
    const primaryModified = this.isModified(primary);
    const aliasModified = this.isModified(alias);

    if (primaryModified && !aliasModified) this[alias] = this[primary];
    else if (aliasModified && !primaryModified) this[primary] = this[alias];
    else if (primaryModified && aliasModified) this[alias] = this[primary];
    else if (!this[primary] && this[alias]) this[primary] = this[alias];
    else if (!this[alias] && this[primary]) this[alias] = this[primary];
  };

  syncAlias('title', 'name');
  syncAlias('category', 'field');
  syncAlias('abstract', 'description');
  syncAlias('version', 'currentVersion');
});

module.exports = mongoose.model('Project', projectSchema);

export const ROLES = {
  student: 'Sinh viên',
  mentor: 'Cố vấn',
  teacher: 'Giảng viên',
  judge: 'Giám khảo',
  admin: 'Quản trị viên',
};

export const ROLE_META = {
  student: {
    label: 'Sinh viên',
    tone: 'blue',
    desc: 'Tạo đề tài, nộp hồ sơ và cập nhật tiến độ cuộc thi',
  },
  mentor: {
    label: 'Cố vấn',
    tone: 'green',
    desc: 'Hướng dẫn chuyên môn và góp ý mốc tiến độ (tối đa 2 dự án)',
  },
  teacher: {
    label: 'Giảng viên',
    tone: 'slate',
    desc: 'Giảng viên nội bộ theo dõi và hỗ trợ nghiên cứu khoa học',
  },
  judge: {
    label: 'Giám khảo',
    tone: 'amber',
    desc: 'Chấm điểm và đánh giá dự án theo phân công hội đồng',
  },
  admin: {
    label: 'Quản trị viên',
    tone: 'rose',
    desc: 'Toàn quyền cấu hình cuộc thi, tài khoản và dữ liệu hệ thống',
  },
};

export const ASSIGNABLE_ROLES = {
  student: ROLES.student,
  mentor: ROLES.mentor,
  teacher: ROLES.teacher,
  judge: ROLES.judge,
};

export const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
export const STUDENT_EMAIL_REGEX = /^[a-z0-9._%+-]+@student\.ctuet\.edu\.vn$/i;

export const LEVELS = {
  FACULTY: 'Cấp Khoa',
  UNIVERSITY: 'Cấp Trường',
  REGIONAL: 'Cấp Khu vực',
  NATIONAL: 'Cấp Quốc gia',
};

export const LEVEL_ORDER = ['FACULTY', 'UNIVERSITY', 'REGIONAL', 'NATIONAL'];

export const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  blue: 'bg-[#F1F7FF] text-[#1E56D9] ring-[#C7D7F5]',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const COMPETITION_STATUS = {
  ACTIVE: { label: 'Đang diễn ra', tone: 'green' },
  UPCOMING: { label: 'Sắp mở', tone: 'blue' },
  CLOSED: { label: 'Đã kết thúc', tone: 'slate' },
};

export const ROUND_STATUS = {
  OPEN: { label: 'Đang mở', tone: 'green' },
  UPCOMING: { label: 'Chưa mở', tone: 'amber' },
  CLOSED: { label: 'Đã đóng', tone: 'slate' },
};

export const STAGE_TYPES = {
  PRELIM: 'Sơ khảo',
  SEMI: 'Bán kết',
  FINAL: 'Chung kết',
  OTHER: 'Vòng bổ sung',
};

export const PROJECT_STATUS = {
  DRAFT: { label: 'Nháp', tone: 'slate' },
  SUBMITTED: { label: 'Đã nộp', tone: 'amber' },
  IN_REVIEW: { label: 'Đang xét duyệt', tone: 'amber' },
  NEED_REVISION: { label: 'Cần chỉnh sửa', tone: 'amber' },
  UNDER_MENTORSHIP: { label: 'Đang cố vấn', tone: 'blue' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  EVALUATED: { label: 'Đã chấm', tone: 'blue' },
  COMPLETED: { label: 'Hoàn thành', tone: 'green' },
  REJECTED: { label: 'Từ chối', tone: 'rose' },
  CANCELLED: { label: 'Đã hủy', tone: 'slate' },
};

// Ma trận chuyển trạng thái hợp lệ cho vòng đời dự án (khớp backend projectStateMachine)
export const PROJECT_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['IN_REVIEW', 'NEED_REVISION', 'REJECTED'],
  NEED_REVISION: ['SUBMITTED'],
  IN_REVIEW: ['APPROVED', 'REJECTED', 'UNDER_MENTORSHIP'],
  UNDER_MENTORSHIP: ['EVALUATED', 'COMPLETED', 'REJECTED'],
  EVALUATED: ['COMPLETED', 'REJECTED'],
  APPROVED: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export const CANCELLATION_STATUS = {
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt hủy', tone: 'rose' },
  REJECTED: { label: 'Từ chối hủy', tone: 'slate' },
};

export const MEMBER_CHANGE_STATUS = {
  PENDING: { label: 'Đang chờ', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt', tone: 'green' },
  REJECTED: { label: 'Từ chối', tone: 'rose' },
};

export const MEMBER_CHANGE_TYPES = {
  ADD: { label: 'Thêm', tone: 'blue' },
  REMOVE: { label: 'Xóa / rời nhóm', tone: 'amber' },
};

export const EVIDENCE_SCOPE_META = {
  ROUND: { label: 'Hồ sơ vòng thi', tone: 'blue' },
  MILESTONE: { label: 'Mốc tiến độ', tone: 'amber' },
  PROPOSAL: { label: 'Hồ sơ thuyết minh', tone: 'green' },
};

export const EVIDENCE_REQUIRED_OPTIONS = [
  'Bắt buộc',
  'Bắt buộc vòng Chung kết',
  'Bắt buộc vòng Khoa',
  'Theo từng mốc',
  'Tùy chọn',
];

export const LEVEL_HIERARCHY_META = {
  FACULTY: {
    title: 'Cấp Khoa',
    desc: 'Vòng sơ tuyển tại đơn vị Khoa',
  },
  UNIVERSITY: {
    title: 'Cấp Trường',
    desc: 'Vòng chính thức toàn trường CTUT',
  },
  REGIONAL: {
    title: 'Cấp Khu vực',
    desc: 'Cụm ĐBSCL & đối tác',
  },
  NATIONAL: {
    title: 'Cấp Quốc gia',
    desc: 'SV_STARTUP Bộ GD&ĐT',
  },
};

export const RUBRIC_STATUS = {
  Active: { label: 'Đang áp dụng', tone: 'green' },
  Draft: { label: 'Bản nháp', tone: 'amber' },
  Deprecated: { label: 'Ngừng dùng', tone: 'slate' },
};

// Danh mục hành động kiểm toán khớp StaticFE và bổ sung các action phát sinh từ store Judging/Voting
export const AUDIT_ACTION_META = {
  CREATE_USER: { label: 'Cấp tài khoản mới', tone: 'blue', isSensitive: false },
  IMPORT_USERS: { label: 'Nhập tài khoản từ Excel', tone: 'blue', isSensitive: true },
  RESET_USER_PASSWORD: { label: 'Cấp lại mật khẩu', tone: 'amber', isSensitive: true },
  LOCK_USER: { label: 'Khóa / mở tài khoản', tone: 'rose', isSensitive: true },
  CHANGE_USER_ROLE: { label: 'Đổi vai trò', tone: 'amber', isSensitive: true },
  WHITELIST_UPDATE: { label: 'Cập nhật danh sách duyệt', tone: 'blue', isSensitive: false },
  ASSIGN_MENTOR: { label: 'Gán cố vấn', tone: 'blue', isSensitive: false },
  REASSIGN_MENTOR: { label: 'Đổi cố vấn', tone: 'amber', isSensitive: false },
  CHANGE_PROJECT_STATUS: { label: 'Đổi trạng thái dự án', tone: 'blue', isSensitive: false },
  PROMOTE_PROJECT: { label: 'Đề xuất vượt cấp', tone: 'green', isSensitive: false },
  TRANSFER_PROJECT_OWNER: { label: 'Đổi trưởng nhóm', tone: 'rose', isSensitive: true },
  CANCEL_PROJECT_REVIEW: { label: 'Duyệt hủy dự án', tone: 'amber', isSensitive: false },
  MEMBER_CHANGE_REVIEW: { label: 'Duyệt đổi thành viên', tone: 'blue', isSensitive: false },
  CHANGE_RUBRIC: { label: 'Cập nhật bộ tiêu chí', tone: 'blue', isSensitive: false },
  SCORE_OVERRIDE: { label: 'Điều chỉnh điểm', tone: 'rose', isSensitive: true },
  COMPETITION_UPDATE: { label: 'Cập nhật cuộc thi / vòng', tone: 'green', isSensitive: false },
  COMPETITION_CREATE: { label: 'Tạo cuộc bình chọn / thi', tone: 'green', isSensitive: false },
  CATALOG_UPDATE: { label: 'Cập nhật danh mục', tone: 'blue', isSensitive: false },
  REWARD_REVIEW: { label: 'Duyệt hồ sơ nhận giải', tone: 'green', isSensitive: false },
  NEWS_PUBLISH: { label: 'Quản lý tin tức', tone: 'blue', isSensitive: false },
  CREATE_COUNCIL: { label: 'Thành lập hội đồng', tone: 'green', isSensitive: false },
  UPDATE_COUNCIL: { label: 'Cập nhật hội đồng', tone: 'blue', isSensitive: false },
  DELETE_COUNCIL: { label: 'Xóa hội đồng', tone: 'rose', isSensitive: true },
  ASSIGN_ROUND: { label: 'Phân công chấm vòng thi', tone: 'blue', isSensitive: false },
  CREATE_EMERGENCY: { label: 'Điều chuyển khẩn cấp BGK', tone: 'rose', isSensitive: true },
  COMPLETE_EMERGENCY: { label: 'Hoàn tất điều chuyển BGK', tone: 'green', isSensitive: false },
  REVOKE_OVERRIDE: { label: 'Thu hồi điều chỉnh điểm', tone: 'amber', isSensitive: true },
  REVOKE_EMERGENCY: { label: 'Thu hồi điều chuyển BGK', tone: 'amber', isSensitive: false },
};

// Thứ tự tùy chọn trong bộ lọc hành động (giữ đúng 19 mục gốc của StaticFE)
export const AUDIT_FILTER_ACTION_KEYS = [
  'CREATE_USER',
  'IMPORT_USERS',
  'RESET_USER_PASSWORD',
  'LOCK_USER',
  'CHANGE_USER_ROLE',
  'WHITELIST_UPDATE',
  'ASSIGN_MENTOR',
  'REASSIGN_MENTOR',
  'CHANGE_PROJECT_STATUS',
  'PROMOTE_PROJECT',
  'TRANSFER_PROJECT_OWNER',
  'CANCEL_PROJECT_REVIEW',
  'MEMBER_CHANGE_REVIEW',
  'CHANGE_RUBRIC',
  'SCORE_OVERRIDE',
  'COMPETITION_UPDATE',
  'CATALOG_UPDATE',
  'REWARD_REVIEW',
  'NEWS_PUBLISH',
];

export const AUDIT_ENTITY_OPTIONS = [
  'Projects',
  'Users',
  'StudentWhitelist',
  'JudgeWhitelist',
  'MentorAssignments',
  'EvaluationRubrics',
  'ScoreOverrides',
  'Competitions',
  'Catalogs',
  'RewardClaims',
  'VotingCampaigns',
  'News',
];

export const REWARD_CLAIM_STATUS = {
  PENDING: { label: 'Chờ xác minh', tone: 'amber' },
  APPROVED: { label: 'Đã duyệt chi', tone: 'blue' },
  PAID: { label: 'Đã giải ngân', tone: 'green' },
  REJECTED: { label: 'Cần bổ sung / Từ chối', tone: 'rose' },
};

export const VOTING_CAMPAIGN_STATUS = {
  PUBLIC: { label: 'Đang Public', detailLabel: 'Đang công khai', tone: 'green' },
  DRAFT: { label: 'Bản nháp', detailLabel: 'Bản nháp (Chưa công khai)', tone: 'amber' },
  CLOSED: { label: 'Đã đóng', detailLabel: 'Đã đóng bình chọn', tone: 'slate' },
};

export const NEWS_CATEGORIES = ['Thông báo', 'Thể lệ', 'Sự kiện', 'Vinh danh'];

export const NEWS_STATUS = {
  PUBLISHED: { label: 'Đang công khai', tone: 'green' },
  DRAFT: { label: 'Bản nháp', tone: 'amber' },
};




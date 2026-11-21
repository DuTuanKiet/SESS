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

export const CHART_PALETTE = ['#1E56D9', '#0D9488', '#D97706', '#6366F1', '#64748B'];

export const FACULTY_SHORT_MAP = {
  'Công nghệ thông tin': 'CNTT',
  'Công nghệ hóa học': 'CN Hóa học',
  'Kỹ thuật cơ khí': 'Cơ khí',
  'Điện - Điện tử': 'Điện - ĐT',
  'Kỹ thuật xây dựng': 'Xây dựng',
};

export const PROJECT_STAGE_GROUPS = [
  { key: 'DRAFT', label: 'Nháp', statuses: ['DRAFT'], color: '#64748B' },
  {
    key: 'PENDING',
    label: 'Chờ duyệt',
    statuses: ['SUBMITTED', 'IN_REVIEW', 'NEED_REVISION'],
    color: '#D97706',
  },
  {
    key: 'MENTORING',
    label: 'Cố vấn',
    statuses: ['UNDER_MENTORSHIP'],
    color: '#1E56D9',
  },
  {
    key: 'COMPLETED',
    label: 'Hoàn tất',
    statuses: ['APPROVED', 'EVALUATED', 'COMPLETED'],
    color: '#059669',
  },
  {
    key: 'REJECTED',
    label: 'Hủy / Loại',
    statuses: ['REJECTED', 'CANCELLED'],
    color: '#E11D48',
  },
];

// Cấu hình 5 nhóm điều hướng của Sidebar Admin ánh xạ sang router hiện có
export const ADMIN_SIDEBAR_GROUPS = [
  {
    title: 'Vận hành',
    items: [
      { key: 'overview', label: 'Tổng quan', to: '/admin' },
      { key: 'competitions', label: 'Quản lý cuộc thi', to: '/admin/competitions' },
    ],
  },
  {
    title: 'Tài khoản',
    items: [{ key: 'users', label: 'Tài khoản & DS duyệt', to: '/admin/users' }],
  },
  {
    title: 'Dự án',
    items: [
      { key: 'projects', label: 'Dự án & Thành viên', to: '/admin/projects' },
      {
        key: 'mentors',
        label: 'Điều phối cố vấn',
        to: '/admin/mentor-assignments',
      },
      {
        key: 'catalogs',
        label: 'Danh mục dữ liệu',
        to: '/admin/catalogs',
      },
    ],
  },
  {
    title: 'Đánh giá',
    items: [
      { key: 'rubrics', label: 'Bộ tiêu chí', to: '/admin/rubrics' },
      { key: 'judging', label: 'Chấm điểm & Phúc khảo', to: '/admin/judge-assignments' },
      {
        key: 'awards',
        label: 'Trao giải & Tin tức',
        to: '/admin/awards-news',
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [{ key: 'audit', label: 'Nhật ký kiểm toán', to: '/admin/audit-logs' }],
  },
];

export const ADMIN_NAV_CRUMBS = {
  overview: 'Tổng quan',
  competitions: 'Quản lý cuộc thi',
  users: 'Tài khoản & Danh sách duyệt',
  projects: 'Dự án & Thành viên',
  mentors: 'Điều phối cố vấn',
  catalogs: 'Danh mục dữ liệu',
  rubrics: 'Bộ tiêu chí',
  judging: 'Chấm điểm & Phúc khảo',
  awards: 'Trao giải & Tin tức',
  audit: 'Nhật ký kiểm toán',
};

export function buildSvgBannerDataUri(
  startHex,
  endHex,
  accentHex,
  patternLabel = 'SESS CTUT'
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${startHex}"/>
        <stop offset="100%" stop-color="${endHex}"/>
      </linearGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="260" fill="url(#g)"/>
    <rect width="800" height="260" fill="url(#grid)"/>
    <circle cx="690" cy="40" r="140" fill="${accentHex}" fill-opacity="0.22"/>
    <circle cx="740" cy="210" r="95" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="110" cy="220" r="110" fill="${accentHex}" fill-opacity="0.14"/>
    <text x="760" y="232" text-anchor="end" fill="#ffffff" fill-opacity="0.18" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="3">${patternLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const BANNER_PRESETS = [
  {
    key: 'navy',
    label: 'Xanh CTUT',
    url: buildSvgBannerDataUri('#0B1F4B', '#1E56D9', '#60A5FA', 'SESS CTUT'),
  },
  {
    key: 'indigo',
    label: 'Công nghệ & AI',
    url: buildSvgBannerDataUri('#1E1B4B', '#2563EB', '#38BDF8', 'TECH & AI'),
  },
  {
    key: 'emerald',
    label: 'Khởi nghiệp Xanh',
    url: buildSvgBannerDataUri('#064E3B', '#0D9488', '#34D399', 'INNOVATION'),
  },
  {
    key: 'slate',
    label: 'Lưu trữ',
    url: buildSvgBannerDataUri('#0F172A', '#334155', '#94A3B8', 'ARCHIVE'),
  },
];

// Hằng số nghiệp vụ điều phối cố vấn khớp ràng buộc backend (tối đa 2 dự án/cố vấn)
export const MAX_PROJECTS_PER_MENTOR = 2;

export const UNASSIGNED_ELIGIBLE_STATUSES = [
  'SUBMITTED',
  'IN_REVIEW',
  'NEED_REVISION',
  'APPROVED',
];

export const BASE_DIRECTORY_UNITS = [
  'Phòng KHCN & HTQT',
  'Hội đồng chuyên môn',
  'Đơn vị ngoài trường',
  'Doanh nghiệp',
  'ĐH Cần Thơ',
  'VCCI Cần Thơ',
];


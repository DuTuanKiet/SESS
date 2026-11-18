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



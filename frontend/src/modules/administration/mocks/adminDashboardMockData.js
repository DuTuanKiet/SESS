export const ROLES = {
  student: 'Sinh viên',
  mentor: 'Cố vấn',
  teacher: 'Giảng viên',
  judge: 'Giám khảo',
  admin: 'Quản trị viên',
};

export const LEVELS = {
  FACULTY: 'Cấp Khoa',
  UNIVERSITY: 'Cấp Trường',
  REGIONAL: 'Cấp Khu vực',
  NATIONAL: 'Cấp Quốc gia',
};

export const LEVEL_ORDER = ['FACULTY', 'UNIVERSITY', 'REGIONAL', 'NATIONAL'];

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

export const CHART_PALETTE = ['#1E56D9', '#0D9488', '#D97706', '#6366F1', '#64748B'];

export const FACULTY_SHORT_MAP = {
  'Công nghệ thông tin': 'CNTT',
  'Công nghệ hóa học': 'CN Hóa học',
  'Kỹ thuật cơ khí': 'Cơ khí',
  'Điện - Điện tử': 'Điện - ĐT',
  'Kỹ thuật xây dựng': 'Xây dựng',
};

// Cấu hình 5 nhóm điều hướng của Sidebar Admin khớp giao diện mẫu và ánh xạ sang router hiện có
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
    items: [
      { key: 'users', label: 'Tài khoản & DS duyệt', to: '/admin/users' },
    ],
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
        to: { path: '/admin/competitions', query: { section: 'awards' } },
      },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { key: 'audit', label: 'Nhật ký kiểm toán', to: '/admin/audit-logs' },
    ],
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

// Dữ liệu giả lập khớp cấu trúc và số liệu từ StaticFE/admin-dashboard.html
const BASE_PROJECTS = [
  {
    id: 'p1',
    competitionId: 'c1',
    code: 'SESS-2026-001',
    title: 'Nền tảng kết nối nông sản sạch ĐBSCL',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'SUBMITTED',
    submittedAt: '11/11/2026 15:40',
    advisorInfo: null,
  },
  {
    id: 'p2',
    competitionId: 'c1',
    code: 'SESS-2026-002',
    title: 'Ứng dụng AI nhận diện bệnh lúa',
    faculty: 'Kỹ thuật cơ khí',
    level: 'FACULTY',
    status: 'UNDER_MENTORSHIP',
    submittedAt: '08/11/2026 09:30',
    needsAdminReview: true,
    advisorInfo: { name: 'TS. Lê Văn Hùng', email: 'lvhung@ctuet.edu.vn' },
  },
  {
    id: 'p3',
    competitionId: 'c1',
    code: 'SESS-2026-003',
    title: 'Hệ thống quản lý nhà trọ thông minh',
    faculty: 'Công nghệ thông tin',
    level: 'UNIVERSITY',
    status: 'IN_REVIEW',
    submittedAt: '10/11/2026 20:15',
    advisorInfo: null,
  },
  {
    id: 'p4',
    competitionId: 'c1',
    code: 'SESS-2026-004',
    title: 'Bao bì sinh học từ vỏ trấu',
    faculty: 'Công nghệ hóa học',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    submittedAt: '12/11/2026 11:00',
    advisorInfo: { name: 'ThS. Phạm Thị Lan', email: 'ptlan@ctuet.edu.vn' },
  },
  {
    id: 'p5',
    competitionId: 'c1',
    code: 'SESS-2026-005',
    title: 'Trạm sạc xe điện năng lượng mặt trời',
    faculty: 'Điện - Điện tử',
    level: 'FACULTY',
    status: 'NEED_REVISION',
    submittedAt: '06/11/2026 16:45',
    advisorInfo: null,
  },
  {
    id: 'p6',
    competitionId: 'c1',
    code: 'SESS-2026-006',
    title: 'Du lịch cộng đồng số hóa Cần Thơ',
    faculty: 'Kinh tế',
    level: 'FACULTY',
    status: 'REJECTED',
    submittedAt: '05/11/2026 10:10',
    advisorInfo: null,
  },
  {
    id: 'p7',
    competitionId: 'c2',
    code: 'CNTT-2026-001',
    title: 'Hệ thống tưới tiêu IoT cho vườn cây ăn trái Cần Thơ',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'DRAFT',
    submittedAt: '12/11/2026 08:20',
    advisorInfo: null,
  },
  {
    id: 'p8',
    competitionId: 'c2',
    code: 'CNTT-2026-002',
    title: 'Trợ lý tra cứu học vụ CTUT bằng LLM',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'APPROVED',
    submittedAt: '11/11/2026 19:00',
    advisorInfo: { name: 'ThS. Nguyễn Thị Mai', email: 'ntmai@ctuet.edu.vn' },
  },
  {
    id: 'p9',
    competitionId: 'c3',
    code: 'SESS-2025-014',
    title: 'Giải pháp lọc nước nhiễm mặn bằng vật liệu biochar',
    faculty: 'Công nghệ hóa học',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    submittedAt: '18/12/2025 14:00',
    advisorInfo: { name: 'ThS. Lê Thu Thảo', email: 'ltthao@ctuet.edu.vn' },
  },
  {
    id: 'p10',
    competitionId: 'c3',
    code: 'SESS-2025-019',
    title: 'Thiết bị giám sát chất lượng nước nuôi tôm tự động',
    faculty: 'Điện - Điện tử',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    submittedAt: '18/12/2025 14:30',
    advisorInfo: { name: 'TS. Đặng Quang Minh', email: 'dqminh@ctuet.edu.vn' },
  },
];

const BASE_USERS = [
  { id: 'u1', code: '2311001', name: 'Trần Minh Khoa', role: 'student', status: 'ACTIVE' },
  { id: 'u2', code: 'GV0108', name: 'TS. Lê Văn Hùng', role: 'mentor', status: 'ACTIVE' },
  { id: 'u3', code: 'GV0114', name: 'ThS. Nguyễn Thị Mai', role: 'mentor', status: 'ACTIVE' },
  { id: 'u4', code: 'BGK001', name: 'PGS. Phạm Hoàng Long', role: 'judge', status: 'ACTIVE' },
  { id: 'u5', code: '2311045', name: 'Võ Hoàng Nam', role: 'student', status: 'SUSPENDED' },
  { id: 'u6', code: '2311082', name: 'Huỳnh Gia Hân', role: 'student', status: 'ACTIVE' },
  { id: 'u7', code: 'GV0129', name: 'TS. Nguyễn Hồng Duyên', role: 'judge', status: 'ACTIVE' },
  { id: 'u8', code: 'CB0001', name: 'Nguyễn Văn Quản', role: 'admin', status: 'ACTIVE' },
];

const BASE_MENTORS = [
  { id: 'm1', name: 'TS. Lê Văn Hùng', active: ['SESS-2026-002'] },
  { id: 'm2', name: 'ThS. Nguyễn Thị Mai', active: ['CNTT-2026-002'] },
  { id: 'm3', name: 'ThS. Trần Quốc Việt', active: [] },
  { id: 'm4', name: 'TS. Phạm Thị Lan', active: ['SESS-2026-004'] },
  { id: 'm5', name: 'ThS. Nguyễn Minh Trí', active: [] },
  { id: 'm6', name: 'ThS. Võ Thị Bích Ngọc', active: ['SESS-2025-014', 'SESS-2025-019'] },
];

const BASE_COMPETITIONS = [
  {
    id: 'c1',
    code: 'CTUT-STARTUP-2026',
    status: 'ACTIVE',
    rounds: [
      { roundNumber: 1, status: 'OPEN' },
      { roundNumber: 2, status: 'UPCOMING' },
      { roundNumber: 3, status: 'UPCOMING' },
    ],
  },
  {
    id: 'c2',
    code: 'CNTT-IDEA-2026',
    status: 'UPCOMING',
    rounds: [{ roundNumber: 1, status: 'UPCOMING' }],
  },
  {
    id: 'c3',
    code: 'CTUT-STARTUP-2025',
    status: 'CLOSED',
    rounds: [
      { roundNumber: 1, status: 'CLOSED' },
      { roundNumber: 2, status: 'CLOSED' },
    ],
  },
];

const BASE_EVALUATIONS = [
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-001', status: 'SUBMITTED', score: 8.2 },
  { competitionId: 'c1', roundNumber: 2, project: 'SESS-2026-003', status: 'DRAFT', score: null },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-002', status: 'SUBMITTED', score: 7.6 },
  { competitionId: 'c1', roundNumber: 3, project: 'SESS-2026-004', status: 'SUBMITTED', score: 8.8 },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-001', status: 'SUBMITTED', score: 7.9 },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-002', status: 'DRAFT', score: null },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-005', status: 'DRAFT', score: null },
  { competitionId: 'c2', roundNumber: 1, project: 'CNTT-2026-002', status: 'SUBMITTED', score: 8.4 },
];

const BASE_CANCELLATIONS = [
  {
    id: 'cr-1',
    project: 'SESS-2026-005',
    by: 'Phan Thị Yến',
    reason: 'Nhóm không đủ kinh phí chế tạo mẫu thử',
    date: '09/11/2026',
    status: 'PENDING',
  },
  {
    id: 'cr-2',
    project: 'SESS-2026-006',
    by: 'Mai Anh Thư',
    reason: 'Thành viên chuyển trường giữa kỳ',
    date: '08/11/2026',
    status: 'PENDING',
  },
];

const BASE_CHANGE_REQUESTS = [
  {
    id: 'mc-1',
    project: 'SESS-2026-001',
    type: 'ADD',
    student: 'Nguyễn Bảo Ngọc',
    reason: 'Bổ sung thành viên mảng marketing',
    date: '10/11/2026',
    status: 'PENDING',
  },
  {
    id: 'mc-2',
    project: 'SESS-2026-003',
    type: 'REMOVE',
    student: 'Đặng Văn Lực',
    reason: 'Xin rời nhóm do trùng lịch thực tập',
    date: '11/11/2026',
    status: 'PENDING',
  },
  {
    id: 'mc-3',
    project: 'SESS-2026-002',
    type: 'REMOVE',
    student: 'Võ Hoàng Nam',
    reason: 'Không tham gia hoạt động nhóm',
    date: '11/11/2026',
    status: 'PENDING',
  },
];

const BASE_EMERGENCIES = [
  {
    id: 'em-1',
    project: 'SESS-2026-003',
    from: 'Trương Quang Vinh',
    to: 'TS. Nguyễn Hồng Duyên',
    reason: 'Xung đột lợi ích với nhóm',
    date: '11/11/2026',
    status: 'PENDING',
  },
  {
    id: 'em-2',
    project: 'SESS-2026-001',
    from: 'TS. Nguyễn Hồng Duyên',
    to: 'PGS. Phạm Hoàng Long',
    reason: 'Giám khảo bận công tác',
    date: '05/11/2026',
    status: 'COMPLETED',
  },
];

const BASE_APPEALS = [
  {
    id: 'ap-1',
    competitionId: 'c1',
    projectCode: 'SESS-2026-002',
    submittedBy: 'Ngô Thanh Tâm',
    reason: 'Đề nghị phúc khảo tiêu chí Tính khả thi - Vòng 1',
    status: 'PENDING',
    createdAt: '12/11/2026',
  },
];

const BASE_REWARD_CLAIMS = [
  {
    id: 'rc-1',
    projectCode: 'SESS-2025-014',
    awardRank: 'Giải Nhất',
    prizeAmount: '12.000.000 đ',
    submittedBy: 'Lê Minh Thư',
    submittedAt: '24/12/2025',
    status: 'PAID',
  },
  {
    id: 'rc-2',
    projectCode: 'SESS-2025-019',
    awardRank: 'Giải Nhì',
    prizeAmount: '7.000.000 đ',
    submittedBy: 'Trần Quốc Huy',
    submittedAt: '25/12/2025',
    status: 'APPROVED',
  },
  {
    id: 'rc-3',
    projectCode: 'SESS-2026-004',
    awardRank: 'Đề xuất Giải Nhất (Dự kiến)',
    prizeAmount: '15.000.000 đ',
    submittedBy: 'Lâm Ngọc Trâm',
    submittedAt: '12/11/2026',
    status: 'PENDING',
  },
];

const BASE_PUBLIC_VOTES = [
  {
    id: 'pv-1',
    projectCode: 'SESS-2026-002',
    competitionTitle: 'Khởi nghiệp Sáng tạo CTUT 2026',
    votes24h: 34,
    anomalyStatus: 'NORMAL',
    isLocked: false,
  },
  {
    id: 'pv-2',
    projectCode: 'SESS-2026-004',
    competitionTitle: 'Khởi nghiệp Sáng tạo CTUT 2026',
    votes24h: 29,
    anomalyStatus: 'NORMAL',
    isLocked: false,
  },
  {
    id: 'pv-3',
    projectCode: 'SESS-2026-001',
    competitionTitle: 'Khởi nghiệp Sáng tạo CTUT 2026',
    votes24h: 118,
    anomalyStatus: 'WATCH',
    isLocked: false,
  },
  {
    id: 'pv-4',
    projectCode: 'CNTT-2026-002',
    competitionTitle: 'Ý tưởng Công nghệ Số CNTT 2026',
    votes24h: 12,
    anomalyStatus: 'NORMAL',
    isLocked: false,
  },
];

const BASE_NOTIFICATIONS = [
  {
    id: 'ntf-1',
    recipientRole: 'admin',
    title: 'Lệch điểm giám khảo - SESS-2026-002',
    content: 'Độ lệch điểm giữa hai giám khảo >= 2.50 điểm',
    type: 'warning',
    isRead: false,
    targetNav: 'judging',
    targetSub: 'judging-override',
    createdAt: '13/11 09:15',
  },
  {
    id: 'ntf-2',
    recipientRole: 'admin',
    title: 'Bình chọn bất thường - SESS-2026-001',
    content: 'Ghi nhận 42 lượt vote trùng dải IP trong 1 giờ',
    type: 'warning',
    isRead: false,
    targetNav: 'awards',
    targetSub: 'awards-votes',
    createdAt: '13/11 08:40',
  },
  {
    id: 'ntf-3',
    recipientRole: 'admin',
    title: 'Đơn xin hủy dự án - SESS-2026-005',
    content: 'Nhóm trưởng Phan Thị Yến đã gửi biên bản xin hủy',
    type: 'info',
    isRead: false,
    targetNav: 'projects',
    targetSub: 'projects-cancel',
    createdAt: '12/11 17:10',
  },
  {
    id: 'ntf-4',
    recipientRole: 'admin',
    title: 'Hồ sơ nhận giải mới - SESS-2026-004',
    content: 'Lâm Ngọc Trâm gửi tài khoản nhận thưởng để đối chiếu',
    type: 'info',
    isRead: false,
    targetNav: 'awards',
    targetSub: 'awards-claims',
    createdAt: '12/11 16:05',
  },
  {
    id: 'ntf-5',
    recipientRole: 'admin',
    title: 'Khiếu nại kết quả chấm - SESS-2026-002',
    content: 'Sinh viên gửi yêu cầu phúc khảo tiêu chí Tính khả thi',
    type: 'error',
    isRead: false,
    targetNav: 'judging',
    targetSub: 'judging-override',
    createdAt: '12/11 14:30',
  },
  {
    id: 'ntf-6',
    recipientRole: 'admin',
    title: 'Phát thông báo lịch nộp Vòng Sơ khảo',
    content: 'Đã gửi tới nhóm Sinh viên - CTUT-STARTUP-2026',
    type: 'success',
    isRead: true,
    targetNav: 'awards',
    targetSub: 'awards-news',
    createdAt: '11/11 10:00',
  },
  {
    id: 'ntf-7',
    recipientRole: 'admin',
    title: 'Dự án mới đăng ký - CNTT-2026-001',
    content: 'Hệ thống ghi nhận hồ sơ nháp tại Khoa CNTT',
    type: 'info',
    isRead: true,
    targetNav: 'projects',
    targetSub: 'projects-list',
    createdAt: '10/11 14:20',
  },
];

const BASE_AUDIT_LOGS = [
  { id: 'al-01', timestamp: '13/11/2026 08:52', isToday: true },
  { id: 'al-02', timestamp: '13/11/2026 08:15', isToday: true },
  { id: 'al-03', timestamp: '12/11/2026 16:40', isToday: false },
  { id: 'al-04', timestamp: '11/11/2026 16:20', isToday: false },
  { id: 'al-05', timestamp: '11/11/2026 11:05', isToday: false },
  { id: 'al-06', timestamp: '10/11/2026 09:05', isToday: false },
  { id: 'al-07', timestamp: '09/11/2026 15:18', isToday: false },
  { id: 'al-08', timestamp: '08/11/2026 10:30', isToday: false },
];

export function createInitialDashboardMockState() {
  return structuredClone({
    projects: BASE_PROJECTS,
    users: BASE_USERS,
    mentors: BASE_MENTORS,
    competitions: BASE_COMPETITIONS,
    evaluations: BASE_EVALUATIONS,
    cancellations: BASE_CANCELLATIONS,
    changeRequests: BASE_CHANGE_REQUESTS,
    emergencies: BASE_EMERGENCIES,
    appeals: BASE_APPEALS,
    rewardClaims: BASE_REWARD_CLAIMS,
    publicVotes: BASE_PUBLIC_VOTES,
    notifications: BASE_NOTIFICATIONS,
    auditLogs: BASE_AUDIT_LOGS,
  });
}

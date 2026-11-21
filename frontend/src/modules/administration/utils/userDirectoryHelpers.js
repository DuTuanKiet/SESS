import { BASE_DIRECTORY_UNITS, ROLES } from '../constants/adminConstants.js';

// Tập hợp các hàm xử lý dữ liệu thuần cho phân hệ Tài khoản & Danh sách duyệt

/** Khởi tạo cấu trúc state rỗng ban đầu cho store tài khoản. */
export function createEmptyUsersState() {
  return {
    users: [],
    studentWhitelist: [],
    judges: [],
    mentors: [],
    projects: [],
    auditLogs: [],
  };
}

/** Đệm số có 2 chữ số cho định dạng ngày giờ tiếng Việt. */
export function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Trả về ngày hiện tại dạng dd/mm/yyyy. */
export function formatTodayDate() {
  const now = new Date();
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
}

/** Trả về thời điểm hiện tại dạng dd/mm/yyyy HH:mm. */
export function formatNowTimestamp() {
  const now = new Date();
  return `${formatTodayDate()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** Chuẩn hóa giá trị ngày từ API sang chuỗi dd/mm/yyyy (hoặc kèm giờ). */
export function formatApiDate(raw, includeTime = false) {
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(String(raw))) return String(raw);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  const datePart = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  return includeTime ? `${datePart} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : datePart;
}

/** Trích xuất mảng bản ghi từ các cấu trúc payload trả về của API. */
export function extractItems(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

/** Chuẩn hóa bản ghi tài khoản người dùng từ payload API sang shape hiển thị của FE. */
export function normalizeUserFromApi(raw = {}) {
  const rawRole = String(raw.role || raw.systemRole || 'student').toLowerCase();
  const role = ROLES[rawRole] ? rawRole : 'student';
  return {
    id: String(raw._id || raw.id || `u-${Date.now()}`),
    code: String(raw.code || raw.studentId || raw.staffCode || '').toUpperCase(),
    name: raw.fullName || raw.name || 'Chưa cập nhật',
    email: String(raw.email || '').toLowerCase(),
    unit: raw.unit || raw.faculty || 'Chưa cập nhật',
    role,
    status: raw.status === 'SUSPENDED' || raw.status === 'INACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    phone: raw.phoneNumber || raw.phone || '',
    createdAt: formatApiDate(raw.createdAt) || formatTodayDate(),
    lastLoginAt: formatApiDate(raw.lastLoginAt, true) || 'Chưa đăng nhập',
    mustChangePassword: Boolean(raw.mustChangePassword),
    passwordUpdatedAt: formatApiDate(raw.passwordUpdatedAt, true) || '—',
    ndaAccepted: Boolean(raw.ndaAccepted),
  };
}

/** Chuẩn hóa bản ghi sinh viên whitelist từ payload API. */
export function normalizeStudentWhitelistFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `sw-${Date.now()}`),
    studentId: String(raw.studentId || raw.code || ''),
    fullName: raw.fullName || raw.name || 'Chưa cập nhật',
    email: String(raw.email || '').toLowerCase(),
    className: raw.className || '',
    faculty: raw.faculty || raw.unit || '',
    phone: raw.phoneNumber || raw.phone || '',
    advisorEmail: String(raw.advisorEmail || '').toLowerCase(),
    isImported: Boolean(raw.isImported),
  };
}

/** Chuẩn hóa bản ghi ban giám khảo từ payload API. */
export function normalizeJudgeFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `jw-${Date.now()}`),
    staffCode: String(raw.staffCode || raw.code || '').toUpperCase(),
    email: String(raw.email || '').toLowerCase(),
    name: raw.fullName || raw.name || 'Chưa cập nhật',
    unit: raw.faculty || raw.unit || raw.department || 'Chuyên gia độc lập',
    phone: raw.phoneNumber || raw.phone || '',
    date: formatApiDate(raw.createdAt || raw.date) || formatTodayDate(),
    isImported: Boolean(raw.isImported ?? true),
  };
}

/** Sinh ID tạm ở phía client cho thao tác tạo bản ghi cục bộ. */
export function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Tạo bản ghi tài khoản mới chuẩn theo shape state của store. */
export function createLocalUserRecord({
  code,
  name,
  email,
  unit = 'Công nghệ thông tin',
  role = 'student',
  status = 'ACTIVE',
  phone = '',
  mustChangePassword = true,
}) {
  return {
    id: makeLocalId('u'),
    code,
    name,
    email,
    unit,
    role,
    status,
    phone,
    createdAt: formatTodayDate(),
    lastLoginAt: 'Chưa đăng nhập',
    mustChangePassword: Boolean(mustChangePassword),
    passwordUpdatedAt: formatNowTimestamp(),
    ndaAccepted: false,
  };
}

/** Tạo bản ghi thông tin đăng nhập tạm vừa cấp để phục vụ modal và xuất Excel. */
export function createIssuedCredentialEntry({ name, code, email, role, unit, tempPassword }) {
  return {
    name,
    code,
    email,
    role: ROLES[role] || role,
    unit,
    tempPassword,
  };
}

/** Lập Map tra cứu nhanh tài khoản theo email viết thường. */
export function buildUserByEmailMap(users = []) {
  const map = new Map();
  users.forEach((u) => {
    if (u.email) map.set(u.email.toLowerCase(), u);
  });
  return map;
}

/** Tổng hợp danh sách đơn vị không trùng cho các form chọn khoa/đơn vị. */
export function buildDirectoryUnitOptions({
  activeFaculties = [],
  manageableUsers = [],
  judges = [],
}) {
  return Array.from(
    new Set([
      ...activeFaculties,
      ...BASE_DIRECTORY_UNITS,
      ...manageableUsers.map((u) => u.unit).filter(Boolean),
      ...judges.map((j) => j.unit).filter(Boolean),
    ])
  );
}

/** Thu thập danh sách giá trị duy nhất theo key và sắp xếp chuẩn tiếng Việt. */
export function collectSortedUnique(items = [], key) {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'vi')
  );
}

/** Lọc danh sách tài khoản quản trị được theo từ khóa, vai trò, đơn vị và trạng thái. */
export function filterAccounts(manageableUsers = [], accountFilters = {}) {
  const keyword = String(accountFilters.keyword || '').trim().toLowerCase();
  return manageableUsers.filter((u) => {
    const matchKeyword =
      !keyword ||
      `${u.code || ''} ${u.name} ${u.email} ${u.unit} ${u.phone || ''}`
        .toLowerCase()
        .includes(keyword);
    const matchRole = !accountFilters.role || u.role === accountFilters.role;
    const matchUnit = !accountFilters.unit || u.unit === accountFilters.unit;
    const matchStatus =
      !accountFilters.status ||
      (accountFilters.status === 'MUST_CHANGE'
        ? Boolean(u.mustChangePassword)
        : u.status === accountFilters.status);
    return matchKeyword && matchRole && matchUnit && matchStatus;
  });
}

/** Lọc danh sách sinh viên hợp lệ theo từ khóa, khoa, nguồn nhập và trạng thái tài khoản. */
export function filterStudents(studentWhitelist = [], studentFilters = {}, userByEmailMap) {
  const keyword = String(studentFilters.keyword || '').trim().toLowerCase();
  return studentWhitelist.filter((s) => {
    const matchKeyword =
      !keyword ||
      `${s.studentId} ${s.fullName} ${s.email} ${s.className || ''} ${s.phone || ''} ${s.advisorEmail || ''}`
        .toLowerCase()
        .includes(keyword);
    const matchFaculty = !studentFilters.faculty || s.faculty === studentFilters.faculty;
    const matchSource =
      !studentFilters.source ||
      (studentFilters.source === 'imported' ? s.isImported : !s.isImported);
    const hasAccount = Boolean(userByEmailMap?.has(s.email.toLowerCase()));
    const matchAccount =
      !studentFilters.account || (studentFilters.account === 'linked' ? hasAccount : !hasAccount);
    return matchKeyword && matchFaculty && matchSource && matchAccount;
  });
}

/** Lọc danh sách ban giám khảo theo từ khóa, đơn vị và trạng thái tài khoản/NDA. */
export function filterJudges(judges = [], judgeFilters = {}, userByEmailMap) {
  const keyword = String(judgeFilters.keyword || '').trim().toLowerCase();
  return judges.filter((j) => {
    const matchKeyword =
      !keyword ||
      `${j.staffCode || ''} ${j.email} ${j.name} ${j.unit} ${j.phone || ''}`
        .toLowerCase()
        .includes(keyword);
    const matchUnit = !judgeFilters.unit || j.unit === judgeFilters.unit;
    const linkedUser = userByEmailMap?.get(j.email.toLowerCase());
    const matchAccount =
      !judgeFilters.account ||
      (judgeFilters.account === 'linked' && Boolean(linkedUser)) ||
      (judgeFilters.account === 'unlinked' && !linkedUser) ||
      (judgeFilters.account === 'nda_pending' && (!linkedUser || !linkedUser.ndaAccepted));
    return matchKeyword && matchUnit && matchAccount;
  });
}

/** Tính toán 10 chỉ số KPI tổng quan cho 3 phân hệ Tài khoản và Danh sách duyệt. */
export function computeDirectoryKpis({
  manageableUsers = [],
  studentWhitelist = [],
  judges = [],
  userByEmailMap,
}) {
  const activeUsers = manageableUsers.filter((u) => u.status === 'ACTIVE').length;
  const suspendedUsers = manageableUsers.length - activeUsers;
  const pendingPassCount = manageableUsers.filter(
    (u) => u.mustChangePassword || u.lastLoginAt === 'Chưa đăng nhập'
  ).length;

  const linkedStudents = studentWhitelist.filter((s) =>
    userByEmailMap?.has(s.email.toLowerCase())
  ).length;
  const unlinkedStudents = studentWhitelist.length - linkedStudents;

  const linkedJudges = judges.filter((j) => userByEmailMap?.has(j.email.toLowerCase())).length;
  const ndaAcceptedCount = judges.filter(
    (j) => userByEmailMap?.get(j.email.toLowerCase())?.ndaAccepted
  ).length;

  return {
    activeUsers,
    manageableTotal: manageableUsers.length,
    suspendedUsers,
    pendingPassCount,
    studentWhitelistTotal: studentWhitelist.length,
    linkedStudents,
    unlinkedStudents,
    judgeWhitelistTotal: judges.length,
    linkedJudges,
    ndaAcceptedCount,
  };
}

/** Tìm tài khoản theo ID hoặc email (không phân biệt hoa thường). */
export function findDirectoryUser(users = [], idOrEmail) {
  const needle = String(idOrEmail || '').trim().toLowerCase();
  return users.find((u) => u.id.toLowerCase() === needle || u.email.toLowerCase() === needle);
}

/** Kiểm tra tài khoản có thuộc nhóm Quản trị viên được bảo vệ khỏi thao tác sửa/khóa hay không. */
export function isProtectedAdminUser(user, currentAdminUserId = '') {
  return (
    !user ||
    user.role === 'admin' ||
    (Boolean(currentAdminUserId) && user.id === currentAdminUserId)
  );
}

/** Tổng hợp đầy đủ ngữ cảnh liên kết (whitelist, cố vấn, dự án, nhật ký) cho modal chi tiết tài khoản. */
export function resolveUserDetailContext({
  userId,
  users = [],
  manageableUsers = [],
  currentAdminUserId = '',
  studentWhitelist = [],
  judges = [],
  mentors = [],
  projects = [],
  auditLogs = [],
}) {
  const rawTarget = findDirectoryUser(users, userId);
  if (rawTarget && isProtectedAdminUser(rawTarget, currentAdminUserId)) {
    return { user: rawTarget, isProtectedAdmin: true };
  }
  const user = rawTarget || manageableUsers[0];
  if (!user) return null;

  const lowerEmail = user.email.toLowerCase();
  const linkedWhitelist = studentWhitelist.find((s) => s.email.toLowerCase() === lowerEmail);
  const linkedJudge = judges.find((j) => j.email.toLowerCase() === lowerEmail);
  const mentorProfile = mentors.find((m) => m.email.toLowerCase() === lowerEmail);
  const relatedProjects = projects.filter(
    (p) =>
      p.leaderEmail?.toLowerCase() === lowerEmail ||
      p.advisorEmail?.toLowerCase() === lowerEmail ||
      p.members.some((m) => m.toLowerCase().includes(user.name.toLowerCase()))
  );
  const userLogs = auditLogs
    .filter((l) => l.targetId === user.email || l.summary.includes(user.name))
    .slice(0, 4);

  return {
    user,
    isProtectedAdmin: false,
    linkedWhitelist,
    linkedJudge,
    mentorProfile,
    relatedProjects,
    userLogs,
  };
}

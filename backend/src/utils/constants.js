/**
 * Hằng số dùng chung toàn hệ thống (tránh magic string rải rác trong code).
 */
const USER_ROLES = Object.freeze({
  STUDENT: 'student',
  MENTOR: 'mentor',
  TEACHER: 'teacher',
  ADMIN: 'admin',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
});

const AUTH_PROVIDERS = Object.freeze({
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE',
});

/** Loại token JWT - dùng để chống dùng lẫn access token cho mục đích refresh */
const TOKEN_TYPES = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
});

/** Thông điệp hướng dẫn khi email sinh viên không có trong danh sách của nhà trường */
const STUDENT_NOT_IN_WHITELIST_MESSAGE =
  'Email tài khoản không có trong danh sách sinh viên của trường. Vui lòng liên hệ Giảng viên cố vấn học tập (CVHT) của lớp để cập nhật danh sách.';

/** Trạng thái vòng đời của dự án (FR03) */
const PROJECT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  UNDER_MENTORSHIP: 'UNDER_MENTORSHIP',
  NEED_REVISION: 'NEED_REVISION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
});

/** Chỉ 2 trạng thái này mới cho phép chỉnh sửa dự án */
const EDITABLE_PROJECT_STATUSES = Object.freeze([PROJECT_STATUS.DRAFT, PROJECT_STATUS.NEED_REVISION]);

/** Dự án bị "đóng băng": đã nộp hoặc đang trong quá trình xét duyệt */
const LOCKED_PROJECT_STATUSES = Object.freeze([
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.IN_REVIEW,
  PROJECT_STATUS.UNDER_MENTORSHIP,
  PROJECT_STATUS.APPROVED,
  PROJECT_STATUS.COMPLETED,
]);

/** Trạng thái dự án được coi là "đã kết thúc" (không tính là dự án đang hoạt động) */
const FINISHED_PROJECT_STATUSES = Object.freeze([PROJECT_STATUS.COMPLETED, PROJECT_STATUS.REJECTED]);

/** Trạng thái milestone của dự án */
const MILESTONE_STATUS = Object.freeze({
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
});

/** Trạng thái hồ sơ Mentor (FR-MENTOR-01) */
const MENTOR_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

/** Giá trị mặc định khi tự khởi tạo hồ sơ Mentor */
const MENTOR_DEFAULT_MAX_PROJECTS = 5;

/** Hành động ghi vào AuditLog (FR14) */
const AUDIT_ACTIONS = Object.freeze({
  CREATE_PROJECT: 'CREATE_PROJECT',
  CHANGE_PROJECT_STATUS: 'CHANGE_PROJECT_STATUS',
  CHANGE_PROJECT_ROLE: 'CHANGE_PROJECT_ROLE',
  CHANGE_USER_STATUS: 'CHANGE_USER_STATUS',
  CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
  CREATE_USER: 'CREATE_USER',
  INVITE_PROJECT_MEMBER: 'INVITE_PROJECT_MEMBER',
  REMOVE_PROJECT_MEMBER: 'REMOVE_PROJECT_MEMBER',
});

/** Thực thể bị tác động bởi AuditLog */
const AUDIT_TARGETS = Object.freeze({
  PROJECT: 'PROJECT',
  PROJECT_MEMBER: 'PROJECT_MEMBER',
  USER: 'USER',
  MENTOR: 'MENTOR',
});

/** Vai trò thành viên dự án (FR04) */
const PROJECT_MEMBER_ROLES = Object.freeze({
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
});

/** Trạng thái lời mời tham gia dự án (FR04) */
const PROJECT_MEMBER_STATUS = Object.freeze({
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
});

/** Tiền tố mã dự án tự sinh, VD: SESS-2026-001 */
const PROJECT_CODE_PREFIX = 'SESS';

/** Ràng buộc nghiệp vụ: Trưởng nhóm phải chuyển quyền trước khi rời dự án */
const OWNER_MUST_TRANSFER_MESSAGE =
  'Bạn là Trưởng nhóm. Vui lòng chuyển quyền Trưởng nhóm cho thành viên khác trước khi rời dự án.';

/** Ràng buộc: mỗi sinh viên chỉ được tham gia 1 dự án đang hoạt động */
const USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE =
  'Bạn đang tham gia một dự án khác đang hoạt động, không thể tạo hoặc tham gia dự án mới.';

/** Ràng buộc: dự án đã nộp/đang xét duyệt thì không được chỉnh sửa */
const PROJECT_LOCKED_MESSAGE =
  'Dự án đã được nộp hoặc đang trong quá trình xét duyệt, không thể chỉnh sửa.';

module.exports = {
  USER_ROLES,
  USER_STATUS,
  AUTH_PROVIDERS,
  TOKEN_TYPES,
  STUDENT_NOT_IN_WHITELIST_MESSAGE,
  PROJECT_STATUS,
  EDITABLE_PROJECT_STATUSES,
  LOCKED_PROJECT_STATUSES,
  FINISHED_PROJECT_STATUSES,
  MILESTONE_STATUS,
  MENTOR_STATUS,
  MENTOR_DEFAULT_MAX_PROJECTS,
  AUDIT_ACTIONS,
  AUDIT_TARGETS,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  PROJECT_CODE_PREFIX,
  OWNER_MUST_TRANSFER_MESSAGE,
  USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE,
  PROJECT_LOCKED_MESSAGE,
};

/**
 * Hằng số dùng chung toàn dự án SESS Backend.
 * Hợp nhất enum/mã phản hồi/thông báo của cả 2 nhánh FR01-FR04 và FR05-FR08.
 *
 * NGUYÊN TẮC HỢP NHẤT: giữ ĐỦ key của cả 2 nhánh; những key cùng ý nghĩa nhưng khác
 * giá trị (PROJECT_STATUS, USER_STATUS, USER_ROLES/SYSTEM_ROLES) được quy về MỘT giá trị
 * duy nhất để dữ liệu người dùng/dự án không bị tách thành 2 bộ trạng thái.
 *   - USER_ROLES    : chữ thường (student/mentor/teacher/admin) - theo normalizeRoleInput của FR01-FR04.
 *   - USER_STATUS   : chữ HOA (ACTIVE/SUSPENDED) - theo normalizeStatusInput của FR01-FR04.
 *   - PROJECT_STATUS: chữ HOA (DRAFT/SUBMITTED/...) - theo FR01-FR04, có thêm EVALUATED của FR05-FR08.
 */

/** Vai trò hệ thống (FR01-FR04 dùng `role`, FR05-FR08 dùng `systemRole` - cùng giá trị) */
const USER_ROLES = Object.freeze({
  STUDENT: 'student',
  MENTOR: 'mentor',
  TEACHER: 'teacher',
  ADMIN: 'admin',
});

/** Alias của USER_ROLES để tương thích code FR05-FR08 (SYSTEM_ROLES.ADMIN, .MENTOR, .STUDENT) */
const SYSTEM_ROLES = Object.freeze({
  ADMIN: USER_ROLES.ADMIN,
  STUDENT: USER_ROLES.STUDENT,
  MENTOR: USER_ROLES.MENTOR,
  TEACHER: USER_ROLES.TEACHER,
});

/** Trạng thái tài khoản - SUSPEND là alias của SUSPENDED (FR05-FR08) */
const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  SUSPEND: 'SUSPENDED',
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

/** Trạng thái vòng đời của dự án (FR03 + FR05-FR08) */
const PROJECT_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  UNDER_MENTORSHIP: 'UNDER_MENTORSHIP',
  NEED_REVISION: 'NEED_REVISION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  // Trạng thái riêng của FR05-FR08 (đã đánh giá)
  EVALUATED: 'EVALUATED',
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

/**
 * Trạng thái milestone - hợp nhất 2 nhánh:
 * FR05-FR08 dùng Pending/InProgress/Completed/Overdue/NotComplete (ProjectMilestone),
 * FR01-FR04 dùng PLANNED/IN_PROGRESS/DONE cho mốc tiến độ nhúng trong Project.milestones.
 */
const MILESTONE_STATUS = Object.freeze({
  PENDING: 'Pending',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  NOT_COMPLETE: 'NotComplete',
  PLANNED: 'PLANNED',
  DONE: 'DONE',
});

/** Trạng thái hồ sơ Mentor (FR01-FR04 - FR-MENTOR-01) */
const MENTOR_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

/** Giá trị mặc định khi tự khởi tạo hồ sơ Mentor */
const MENTOR_DEFAULT_MAX_PROJECTS = 5;

/** Trạng thái phân công mentor (FR05-FR08) */
const ASSIGNMENT_STATUS = Object.freeze({
  ASSIGNED: 'Assigned',
  REASSIGNED: 'ReAssigned',
  COMPLETED: 'Completed',
});

/** Trạng thái bộ tiêu chí đánh giá (FR05-FR08) */
const RUBRIC_STATUS = Object.freeze({
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  DEPRECATED: 'Deprecated',
});

/** Hành động ghi vào AuditLog (FR14) - hợp nhất hành động của cả 2 nhánh */
const AUDIT_ACTIONS = Object.freeze({
  // FR05-FR08
  ASSIGN_MENTOR: 'ASSIGN_MENTOR',
  REASSIGN_MENTOR: 'REASSIGN_MENTOR',
  LOCK_USER: 'LOCK_USER',
  CHANGE_RUBRIC: 'CHANGE_RUBRIC',
  PUBLISH_KB_DOC: 'PUBLISH_KB_DOC',
  CREATE_MILESTONE: 'CREATE_MILESTONE',
  UPDATE_MILESTONE: 'UPDATE_MILESTONE',
  // FR01-FR04
  CREATE_PROJECT: 'CREATE_PROJECT',
  CHANGE_PROJECT_STATUS: 'CHANGE_PROJECT_STATUS',
  CHANGE_PROJECT_ROLE: 'CHANGE_PROJECT_ROLE',
  CHANGE_USER_STATUS: 'CHANGE_USER_STATUS',
  CHANGE_USER_ROLE: 'CHANGE_USER_ROLE',
  CREATE_USER: 'CREATE_USER',
  INVITE_PROJECT_MEMBER: 'INVITE_PROJECT_MEMBER',
  REMOVE_PROJECT_MEMBER: 'REMOVE_PROJECT_MEMBER',
});

/** Thực thể bị tác động bởi AuditLog - cách gọi của FR05-FR08 */
const AUDIT_ENTITIES = Object.freeze({
  MENTOR_ASSIGNMENTS: 'MentorAssignments',
  PROJECTS: 'Projects',
  USERS: 'Users',
  EVALUATION_RUBRICS: 'EvaluationRubrics',
  KNOWLEDGE_DOCUMENTS: 'KnowledgeDocuments',
  PROJECT_MILESTONES: 'ProjectMilestones',
});

/** Thực thể bị tác động bởi AuditLog - cách gọi của FR01-FR04 */
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

// Trạng thái dự án đủ điều kiện cần được phân công mentor (FR05-FR08)
const MENTORSHIP_ELIGIBLE_STATUSES = [
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.IN_REVIEW,
  PROJECT_STATUS.NEED_REVISION,
];

// Giới hạn tối đa số dự án mỗi mentor được cố vấn cùng lúc (FR05-FR08)
const MAX_PROJECTS_PER_MENTOR = 2;

// Số ngày sinh viên được phép nộp minh chứng trễ sau khi hết hạn dueDate (FR05)
const LATE_SUBMISSION_DAYS = 3;

// Số ngày mentor được phép góp ý kể từ ngày kết thúc milestone (dueDate) (FR07)
const COMMENT_DEADLINE_DAYS = 5;

/** Ràng buộc nghiệp vụ: Trưởng nhóm phải chuyển quyền trước khi rời dự án (FR04) */
const OWNER_MUST_TRANSFER_MESSAGE =
  'Bạn là Trưởng nhóm. Vui lòng chuyển quyền Trưởng nhóm cho thành viên khác trước khi rời dự án.';

/** Ràng buộc: mỗi sinh viên chỉ được tham gia 1 dự án đang hoạt động (FR04) */
const USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE =
  'Bạn đang tham gia một dự án khác đang hoạt động, không thể tạo hoặc tham gia dự án mới.';

/** Ràng buộc: dự án đã nộp/đang xét duyệt thì không được chỉnh sửa (FR03) */
const PROJECT_LOCKED_MESSAGE =
  'Dự án đã được nộp hoặc đang trong quá trình xét duyệt, không thể chỉnh sửa.';

module.exports = {
  // Vai trò & trạng thái người dùng
  USER_ROLES,
  SYSTEM_ROLES,
  USER_STATUS,
  AUTH_PROVIDERS,
  TOKEN_TYPES,
  STUDENT_NOT_IN_WHITELIST_MESSAGE,

  // Vòng đời dự án
  PROJECT_STATUS,
  EDITABLE_PROJECT_STATUSES,
  LOCKED_PROJECT_STATUSES,
  FINISHED_PROJECT_STATUSES,
  MILESTONE_STATUS,
  MENTOR_STATUS,
  MENTOR_DEFAULT_MAX_PROJECTS,
  ASSIGNMENT_STATUS,
  RUBRIC_STATUS,

  // Audit log (FR14)
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUDIT_TARGETS,

  // Phân công mentor (FR05-FR08)
  MENTORSHIP_ELIGIBLE_STATUSES,
  MAX_PROJECTS_PER_MENTOR,
  LATE_SUBMISSION_DAYS,
  COMMENT_DEADLINE_DAYS,

  // Thành viên dự án (FR04)
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  PROJECT_CODE_PREFIX,
  OWNER_MUST_TRANSFER_MESSAGE,
  USER_ALREADY_IN_ACTIVE_PROJECT_MESSAGE,
  PROJECT_LOCKED_MESSAGE,
};
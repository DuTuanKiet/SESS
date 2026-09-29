/**
 * Hằng số dùng chung toàn dự án SESS Backend.
 * Giữ các enum, mã phản hồi và thông báo tập trung để tránh magic string.
 */

const SYSTEM_ROLES = Object.freeze({
  ADMIN: 'Admin',
  STUDENT: 'Student',
  MENTOR: 'Mentor',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'Active',
  SUSPEND: 'Suspend',
});

const PROJECT_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'InReview',
  NEED_REVISION: 'NeedRevision',
  UNDER_MENTORSHIP: 'UnderMentorship',
  EVALUATED: 'Evaluated',
  COMPLETED: 'Completed',
});

const ASSIGNMENT_STATUS = Object.freeze({
  ASSIGNED: 'Assigned',
  REASSIGNED: 'ReAssigned',
  COMPLETED: 'Completed',
});

const RUBRIC_STATUS = Object.freeze({
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  DEPRECATED: 'Deprecated',
});

const MILESTONE_STATUS = Object.freeze({
  PENDING: 'Pending',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  NOT_COMPLETE: 'NotComplete',
});

const AUDIT_ACTIONS = Object.freeze({
  ASSIGN_MENTOR: 'ASSIGN_MENTOR',
  REASSIGN_MENTOR: 'REASSIGN_MENTOR',
  CHANGE_PROJECT_STATUS: 'CHANGE_PROJECT_STATUS',
  LOCK_USER: 'LOCK_USER',
  CHANGE_RUBRIC: 'CHANGE_RUBRIC',
  PUBLISH_KB_DOC: 'PUBLISH_KB_DOC',
  CREATE_MILESTONE: 'CREATE_MILESTONE',
  UPDATE_MILESTONE: 'UPDATE_MILESTONE',
});

const AUDIT_ENTITIES = Object.freeze({
  MENTOR_ASSIGNMENTS: 'MentorAssignments',
  PROJECTS: 'Projects',
  USERS: 'Users',
  EVALUATION_RUBRICS: 'EvaluationRubrics',
  KNOWLEDGE_DOCUMENTS: 'KnowledgeDocuments',
  PROJECT_MILESTONES: 'ProjectMilestones',
});

// Trạng thái dự án đủ điều kiện cần được phân công mentor
const MENTORSHIP_ELIGIBLE_STATUSES = [
  PROJECT_STATUS.SUBMITTED,
  PROJECT_STATUS.IN_REVIEW,
  PROJECT_STATUS.NEED_REVISION,
];

// Giới hạn tối đa số dự án mỗi mentor được cố vấn cùng lúc
const MAX_PROJECTS_PER_MENTOR = 2;

// Số ngày sinh viên được phép nộp minh chứng trễ sau khi hết hạn dueDate (FR05)
const LATE_SUBMISSION_DAYS = 3;

// Số ngày mentor được phép góp ý kể từ ngày kết thúc milestone (dueDate) (FR07)
const COMMENT_DEADLINE_DAYS = 5;

module.exports = {
  SYSTEM_ROLES,
  USER_STATUS,
  PROJECT_STATUS,
  ASSIGNMENT_STATUS,
  RUBRIC_STATUS,
  MILESTONE_STATUS,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  MENTORSHIP_ELIGIBLE_STATUSES,
  MAX_PROJECTS_PER_MENTOR,
  LATE_SUBMISSION_DAYS,
  COMMENT_DEADLINE_DAYS,
};

import {
  LEVEL_ORDER,
  PROJECT_STATUS,
  PROJECT_TRANSITIONS,
} from '@/modules/administration/constants/adminConstants';

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function stripLeaderSuffix(memberName) {
  return String(memberName || '')
    .replace(/\s*\(Trưởng nhóm\)\s*$/i, '')
    .trim();
}

export function getTransferLeaderCandidates(project) {
  const members = Array.isArray(project?.members) ? project.members : [];
  return members.slice(1).map(stripLeaderSuffix).filter(Boolean);
}

// Xác định tập trạng thái đích theo state machine; trạng thái kết thúc phải đi qua luồng cưỡng chế
export function getAllowedProjectTransitions(status) {
  const transitions = PROJECT_TRANSITIONS[status];
  if (Array.isArray(transitions) && transitions.length > 0) {
    return {
      isTerminal: false,
      targets: transitions,
    };
  }
  return {
    isTerminal: true,
    targets: Object.keys(PROJECT_STATUS).filter((item) => item !== status),
  };
}

export function getNextPromoteLevels(currentLevel) {
  const index = LEVEL_ORDER.indexOf(currentLevel);
  if (index < 0) return [];
  return LEVEL_ORDER.slice(index + 1);
}

export function slicePaginatedItems(items, page, pageSize) {
  const safeSize = Math.max(1, Number(pageSize) || 5);
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safeSize;
  return items.slice(start, start + safeSize);
}

export function formatProjectTimestamp(raw = new Date()) {
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(raw.trim())) {
    return raw.trim();
  }
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return `${datePart} ${timePart}`;
}

// Bộ chuẩn hóa dữ liệu sẵn sàng cho giai đoạn kết nối Live API (bao gồm POST /api/v1/projects/:projectId/promote)
export function normalizeAdminProject(raw = {}) {
  const milestones = Array.isArray(raw.milestones) ? raw.milestones : [];
  const completedCount = milestones.filter((item) => item.status === 'COMPLETED').length;

  return {
    id: String(raw._id || raw.id || ''),
    competitionId: String(raw.competitionId?._id || raw.competitionId || ''),
    code: raw.code || '—',
    title: raw.title || raw.name || 'Dự án chưa đặt tên',
    category: raw.category || 'Chưa phân loại',
    faculty: raw.faculty || raw.leaderInfo?.faculty || 'Khác',
    level: raw.level || 'FACULTY',
    status: raw.status || 'DRAFT',
    currentRound: raw.currentRound || 'Chưa cập nhật',
    submittedAt: raw.submittedAt ? formatProjectTimestamp(raw.submittedAt) : '—',
    ms: Array.isArray(raw.ms) ? raw.ms : [completedCount, milestones.length],
    needsAdminReview: Boolean(raw.needsAdminReview),
    leaderInfo: raw.leaderInfo || null,
    advisorInfo: raw.advisorInfo || raw.currentMentor || null,
    members: Array.isArray(raw.members) ? raw.members : [],
    objectives: raw.objectives || '',
    abstract: raw.abstract || '',
    problemStatement: raw.problemStatement || '',
    solution: raw.solution || '',
    businessModel: raw.businessModel || '',
    attachmentUrl: raw.attachmentUrl || null,
    milestones,
    submissionRounds: raw.submissionRounds || null,
  };
}

export function normalizeCancellationRequest(raw = {}) {
  return {
    id: String(raw._id || raw.id || ''),
    project: raw.project || raw.projectId?.code || '—',
    by: raw.by || raw.requesterId?.fullName || raw.requesterId?.email || 'Sinh viên',
    reason: raw.reason || raw.note || '',
    file: raw.file || raw.evidenceFile || '',
    date: raw.date || (raw.createdAt ? formatProjectTimestamp(raw.createdAt).split(' ')[0] : '—'),
    status: raw.status || 'PENDING',
    reviewNote: raw.reviewNote || raw.adminResponse || '',
  };
}

export function normalizeMemberChangeRequest(raw = {}) {
  return {
    id: String(raw._id || raw.id || ''),
    project: raw.project || raw.projectId?.code || '—',
    type: raw.type || raw.action || 'ADD',
    student: raw.student || raw.targetUserId?.fullName || raw.targetUserId?.email || 'Sinh viên',
    reason: raw.reason || '',
    date: raw.date || (raw.createdAt ? formatProjectTimestamp(raw.createdAt).split(' ')[0] : '—'),
    status: raw.status || 'PENDING',
    responseReason: raw.responseReason || raw.adminResponse || '',
  };
}

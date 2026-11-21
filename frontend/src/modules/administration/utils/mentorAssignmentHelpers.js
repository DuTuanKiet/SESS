import { MAX_PROJECTS_PER_MENTOR } from '@/modules/administration/constants/adminConstants';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatTimestamp(raw = new Date()) {
  if (typeof raw === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(raw.trim())) {
    return raw.trim();
  }
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return '—';
  const day = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return `${day} ${time}`;
}

export function extractArrayPayload(response, candidateKeys = []) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  for (const key of candidateKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(response?.[key])) return response[key];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

// Chuẩn hóa dự án chưa có cố vấn từ cả Mock và API GET /projects/unassigned-mentor
export function normalizeUnassignedProject(raw = {}) {
  const id = String(raw._id || raw.id || '');
  const title = raw.title || raw.name || 'Dự án chưa đặt tên';
  const code = raw.code || (id ? `#${id.slice(-6).toUpperCase()}` : '—');
  const category = raw.category || raw.field || '';
  const faculty = raw.faculty || raw.field || 'Chưa phân khoa';

  return {
    id,
    code,
    title,
    category,
    faculty,
    status: raw.status || 'SUBMITTED',
    submittedAt: raw.submittedAt || (raw.createdAt ? formatTimestamp(raw.createdAt) : '—'),
    advisorInfo: raw.advisorInfo || null,
  };
}

// Chuẩn hóa danh sách dự án đang hướng dẫn thành object thống nhất cho cả Mock (code) và Live API (projectId)
export function normalizeMentorActiveItem(item, projectsByCode = new Map()) {
  if (typeof item === 'string') {
    const matched = projectsByCode.get(item);
    return {
      projectId: matched?.id || item,
      code: item,
      title: matched?.title || '',
      displayLabel: item,
    };
  }

  const projectId = String(item?.projectId || item?._id || item?.id || '');
  const code = String(item?.projectCode || item?.code || '').trim();
  const title = String(item?.projectName || item?.title || item?.name || '').trim();
  const matched = code ? projectsByCode.get(code) : null;

  return {
    projectId: projectId || matched?.id || code,
    code: code || matched?.code || '',
    title: title || matched?.title || '',
    displayLabel: code || title || projectId || '—',
  };
}

// Chuẩn hóa thông tin cố vấn từ cả Mock và API GET /mentors
export function normalizeMentorRecord(raw = {}, projectsByCode = new Map()) {
  const id = String(raw.userId || raw._id || raw.id || '');
  const rawActive = Array.isArray(raw.currentProjects)
    ? raw.currentProjects
    : Array.isArray(raw.activeProjects)
      ? raw.activeProjects
      : Array.isArray(raw.active)
        ? raw.active
        : [];

  const activeProjects = rawActive.map((item) => normalizeMentorActiveItem(item, projectsByCode));
  const fields = Array.isArray(raw.fields) && raw.fields.length
    ? raw.fields
    : Array.isArray(raw.expertise) && raw.expertise.length
      ? raw.expertise
      : raw.unit
        ? [raw.unit]
        : ['Chuyên môn chung'];

  const maxProjects = Number(raw.maxProjects) || MAX_PROJECTS_PER_MENTOR;
  const activeCount = Number.isFinite(Number(raw.activeProjectsCount))
    ? Number(raw.activeProjectsCount)
    : activeProjects.length;

  return {
    id,
    name: raw.fullName || raw.name || raw.profile?.fullName || 'Chưa cập nhật',
    email: String(raw.email || '').toLowerCase(),
    unit: raw.unit || raw.faculty || '',
    phone: raw.phone || raw.phoneNumber || '',
    status: raw.status || 'ACTIVE',
    fields,
    maxProjects,
    activeCount,
    activeProjects,
  };
}

const ASSIGNMENT_STATUS_LABELS = {
  ASSIGNED: 'Đang phụ trách',
  REASSIGNED: 'Đã điều chuyển',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

// Chuẩn hóa dòng lịch sử phân công cố vấn cho cả Audit Log và MentorAssignment API
export function normalizeAssignmentHistoryEntry(raw = {}, index = 0) {
  // Nhánh bản ghi từ API GET /mentor-assignments/project/:projectId
  if (raw.mentorId || raw.assignedAt) {
    const mentorName =
      raw.mentorId?.profile?.fullName ||
      raw.mentorId?.fullName ||
      raw.mentorId?.email ||
      'Cố vấn';
    const assignedByName =
      raw.assignedBy?.profile?.fullName || raw.assignedBy?.fullName || raw.assignedBy?.email || '';
    const status = String(raw.status || 'ASSIGNED').toUpperCase();
    const isLatest = index === 0;
    const isCurrent = status === 'ASSIGNED';

    return {
      id: String(raw._id || raw.id || `hist-${index}`),
      summary: `${mentorName}${assignedByName ? ` (do ${assignedByName} phân công)` : ''}`,
      timestamp: formatTimestamp(raw.assignedAt || raw.startedAt || raw.createdAt),
      reason: raw.note || '',
      badgeLabel: isCurrent ? 'Đang phụ trách' : ASSIGNMENT_STATUS_LABELS[status] || 'Lịch sử',
      badgeTone: isCurrent || isLatest ? 'blue' : 'slate',
      isLatest,
    };
  }

  // Nhánh bản ghi Audit Log 
  const isLatest = index === 0;
  return {
    id: String(raw.id || `hist-${index}`),
    summary: raw.summary || 'Cập nhật phân công cố vấn',
    timestamp: raw.timestamp || '—',
    reason: raw.newValues?.reason || raw.newValues?.note || '',
    badgeLabel: isLatest ? 'Mới nhất' : 'Lịch sử',
    badgeTone: isLatest ? 'blue' : 'slate',
    isLatest,
  };
}

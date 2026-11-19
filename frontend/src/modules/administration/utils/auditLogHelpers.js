import { AUDIT_ACTION_META } from '../constants/adminConstants.js';

export const DEFAULT_AUDIT_ACTOR = {
  actorEmail: 'admin.phongkhcn@ctuet.edu.vn',
  actorRole: 'ADMIN',
  ipAddress: '10.20.14.8',
};

// Tập ID đã được seed trong adminUsersMockData để tránh đè mất diff JSON chi tiết khi gộp read-only
export const SEEDED_USER_AUDIT_IDS = new Set(['al-03', 'al-04', 'al-06', 'al-08']);

/**
 * Suy đoán đối tượng (targetEntity) cho log phát sinh từ các store cũ không lưu sẵn trường này.
 */
export function inferEntityByAction(action) {
  const code = String(action || '').toUpperCase();
  if (!code) return 'System';
  if (code.includes('WHITELIST')) return 'StudentWhitelist';
  if (code.includes('USER')) return 'Users';
  if (code.includes('MENTOR')) return 'MentorAssignments';
  if (code.includes('OVERRIDE')) return 'ScoreOverrides';
  if (code.includes('RUBRIC')) return 'EvaluationRubrics';
  if (code.includes('CATALOG')) return 'Catalogs';
  if (code.includes('REWARD')) return 'RewardClaims';
  if (code.includes('NEWS')) return 'News';
  if (code.includes('PROJECT') || code.includes('CANCEL') || code.includes('MEMBER')) {
    return 'Projects';
  }
  if (code.includes('COMPETITION')) return 'Competitions';
  if (code.includes('COUNCIL') || code.includes('ROUND') || code.includes('EMERGENCY')) {
    return 'Competitions';
  }
  return 'System';
}

/**
 * Chuyển chuỗi thời gian DD/MM/YYYY [HH:mm] hoặc định dạng vi-VN thành khóa số để sắp xếp giảm dần.
 */
export function parseAuditTimestampKey(raw) {
  const text = String(raw || '').trim();
  if (!text) return 0;

  const dmyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/.exec(text);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    const hour = Number(dmyMatch[4] || 0);
    const minute = Number(dmyMatch[5] || 0);
    return (((year * 100 + month) * 100 + day) * 100 + hour) * 100 + minute;
  }

  // Hỗ trợ định dạng 'HH:mm DD/MM/YYYY' của Intl.DateTimeFormat('vi-VN') ở store Judging
  const timeFirstMatch = /^(\d{1,2}):(\d{2})[,\s]+(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (timeFirstMatch) {
    const hour = Number(timeFirstMatch[1]);
    const minute = Number(timeFirstMatch[2]);
    const day = Number(timeFirstMatch[3]);
    const month = Number(timeFirstMatch[4]);
    const year = Number(timeFirstMatch[5]);
    return (((year * 100 + month) * 100 + day) * 100 + hour) * 100 + minute;
  }

  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function normalizeAuditLogEntry(raw, fallbackActor = DEFAULT_AUDIT_ACTOR) {
  if (!raw || typeof raw !== 'object') return null;

  const action = String(raw.action || '').trim() || 'SYSTEM_EVENT';
  return {
    id: String(raw.id || `${action}-${raw.timestamp || ''}-${raw.targetId || ''}`),
    timestamp: String(raw.timestamp || '—'),
    isToday: typeof raw.isToday === 'boolean' ? raw.isToday : true,
    actorEmail: String(raw.actorEmail || fallbackActor.actorEmail || DEFAULT_AUDIT_ACTOR.actorEmail),
    actorRole: String(raw.actorRole || fallbackActor.actorRole || DEFAULT_AUDIT_ACTOR.actorRole),
    ipAddress: String(raw.ipAddress || fallbackActor.ipAddress || '—'),
    action,
    targetEntity: String(raw.targetEntity || inferEntityByAction(action)),
    targetId: String(raw.targetId || '—'),
    summary: String(raw.summary || ''),
    oldValues: raw.oldValues !== undefined ? raw.oldValues : null,
    newValues: raw.newValues !== undefined ? raw.newValues : null,
  };
}

/**
 * Gộp log nội bộ (ưu tiên cao nhất) với các nguồn read-only từ store khác, khử trùng theo id và sort mới nhất trước.
 */
export function mergeAuditLogs(
  primaryLogs = [],
  externalBatches = [],
  fallbackActor = DEFAULT_AUDIT_ACTOR
) {
  const seenIds = new Set();
  const merged = [];

  const pushEntry = (item, excludeIds) => {
    if (!item) return;
    const rawId = item.id ? String(item.id) : '';
    if (rawId && excludeIds?.has(rawId)) return;

    const normalized = normalizeAuditLogEntry(item, fallbackActor);
    if (!normalized || seenIds.has(normalized.id)) return;
    seenIds.add(normalized.id);
    merged.push(normalized);
  };

  (primaryLogs || []).forEach((item) => pushEntry(item, null));
  (externalBatches || []).forEach((batch) => {
    const logs = Array.isArray(batch) ? batch : batch?.logs || [];
    const excludeIds = Array.isArray(batch) ? null : batch?.excludeIds || null;
    logs.forEach((item) => pushEntry(item, excludeIds));
  });

  return merged
    .map((item, idx) => ({ item, idx, sortKey: parseAuditTimestampKey(item.timestamp) }))
    .sort((a, b) => b.sortKey - a.sortKey || a.idx - b.idx)
    .map(({ item }) => item);
}

export function filterAuditLogs(logs = [], { keyword = '', action = '', targetEntity = '' } = {}) {
  const kw = String(keyword || '')
    .trim()
    .toLowerCase();
  const actionVal = String(action || '').trim();
  const entityVal = String(targetEntity || '').trim();

  return (logs || []).filter((log) => {
    const matchKw =
      !kw ||
      `${log.actorEmail} ${log.targetId} ${log.summary} ${log.action} ${log.targetEntity}`
        .toLowerCase()
        .includes(kw);
    const matchAction = !actionVal || log.action === actionVal;
    const matchEntity = !entityVal || log.targetEntity === entityVal;
    return matchKw && matchAction && matchEntity;
  });
}

export function computeAuditStats(logs = [], actionMeta = AUDIT_ACTION_META) {
  const list = logs || [];
  return {
    total: list.length,
    todayCount: list.filter((item) => item.isToday).length,
    sensitiveCount: list.filter((item) => Boolean(actionMeta[item.action]?.isSensitive)).length,
  };
}

export function formatAuditJson(value) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return 'null';
  }
}

export function buildAuditCsvContent(logs = []) {
  const header = [
    'Thoi_gian',
    'Email_nguoi_thuc_hien',
    'Vai_tro',
    'IP',
    'Hanh_dong',
    'Doi_tuong',
    'Ma_doi_tuong',
    'Mo_ta',
  ];

  const lines = (logs || []).map((log) =>
    [
      log.timestamp,
      log.actorEmail,
      log.actorRole,
      log.ipAddress,
      log.action,
      log.targetEntity,
      log.targetId,
      log.summary,
    ]
      .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
      .join(',')
  );

  return `\uFEFF${header.join(',')}\n${lines.join('\n')}`;
}

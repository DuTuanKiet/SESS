import { EVIDENCE_SCOPE_META } from '@/modules/administration/constants/adminConstants';

/**
 * Chuẩn hóa danh sách huy hiệu cuộc thi áp dụng cho một bản ghi danh mục.
 */
export function resolveCatalogCompetitionBadges(
  competitionIds,
  competitionByIdMap,
  { fallbackText = 'Tất cả cuộc thi', isGlobal = true } = {}
) {
  const ids = Array.isArray(competitionIds) ? competitionIds.filter(Boolean) : [];
  if (!ids.length) {
    if (isGlobal === false) {
      return {
        badges: [],
        emptyText: 'Chưa gắn cuộc thi',
        isWarningEmpty: true,
      };
    }
    return {
      badges: [],
      emptyText: fallbackText,
      isWarningEmpty: false,
    };
  }

  const badges = ids
    .map((cid) => competitionByIdMap?.get(cid))
    .filter(Boolean)
    .map((comp) => ({
      id: comp.id,
      code: comp.code,
      title: comp.title || comp.code,
    }));

  if (!badges.length) {
    return {
      badges: [],
      emptyText: fallbackText,
      isWarningEmpty: false,
    };
  }

  return {
    badges,
    emptyText: '',
    isWarningEmpty: false,
  };
}

export function normalizeCategoryFromApi(raw = {}) {
  const competitionIds = Array.isArray(raw.competitionIds)
    ? raw.competitionIds.map((c) => String(c?._id || c?.id || c)).filter(Boolean)
    : [];
  return {
    id: String(raw._id || raw.id || `cat-${Date.now()}`),
    code: String(raw.code || '').trim().toUpperCase(),
    name: String(raw.name || '').trim(),
    description: String(raw.description || '').trim(),
    competitionIds,
    isGlobal: raw.isGlobal ?? competitionIds.length === 0,
    isActive: raw.isActive !== false,
  };
}

export function normalizeEvidenceTypeFromApi(raw = {}) {
  const scope = EVIDENCE_SCOPE_META[raw.scope] ? raw.scope : 'ROUND';
  const competitionIds = Array.isArray(raw.competitionIds)
    ? raw.competitionIds.map((c) => String(c?._id || c?.id || c)).filter(Boolean)
    : [];
  return {
    id: String(raw._id || raw.id || `ev-${Date.now()}`),
    code: String(raw.code || '').trim(),
    name: String(raw.name || '').trim(),
    scope,
    requiredLabel: String(raw.requiredLabel || 'Tùy chọn').trim(),
    formats: String(raw.formats || '.pdf').trim(),
    maxSizeMb: Math.max(1, Number(raw.maxSizeMb) || 10),
    competitionIds,
    description: String(raw.description || '').trim(),
    isActive: raw.isActive !== false,
  };
}

export function normalizeFacultyFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `fac-${Date.now()}`),
    code: String(raw.code || '').trim().toUpperCase(),
    name: String(raw.name || '').trim(),
    contactEmail: String(raw.contactEmail || '').trim(),
    isActive: raw.isActive !== false,
  };
}

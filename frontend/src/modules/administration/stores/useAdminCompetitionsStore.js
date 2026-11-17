import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { adminService } from '@/modules/administration/services/adminService';
import { useToastStore } from '@/stores/toast';
import {
  COMPETITION_STATUS,
  ROUND_STATUS,
  STAGE_TYPES,
} from '@/modules/administration/constants/adminConstants';
import {
  BANNER_PRESETS,
  createInitialCompetitionsMockState,
} from '@/modules/administration/mocks/adminCompetitionsMockData';
import { useAdminCatalogsStore } from '@/modules/administration/stores/useAdminCatalogsStore';

const VALID_DETAIL_TABS = new Set(['overview', 'rounds', 'awards', 'projects']);

export function ddmmyyyyToIso(raw) {
  const str = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

export function isoToDdmmyyyy(raw) {
  const str = String(raw || '').trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function parsePrizeCashValue(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function calculateCompetitionPrizeSummary(comp) {
  if (!comp) return { totalCount: 0, totalValue: 0, formatted: 'Chưa thiết lập' };
  const awards = Array.isArray(comp.awards) ? comp.awards : [];
  if (awards.length) {
    let totalCount = 0;
    let totalValue = 0;
    awards.forEach((award) => {
      const qty = Number(award.quantity) || 1;
      totalCount += qty;
      totalValue += parsePrizeCashValue(award.cashAmount) * qty;
    });
    if (totalValue > 0) {
      return {
        totalCount,
        totalValue,
        formatted: `${totalValue.toLocaleString('vi-VN')} đ`,
      };
    }
    return {
      totalCount,
      totalValue: 0,
      formatted: `${totalCount} hạng mục`,
    };
  }
  if (comp.estimatedPrizePool) {
    return {
      totalCount: 0,
      totalValue: parsePrizeCashValue(comp.estimatedPrizePool),
      formatted: comp.estimatedPrizePool,
    };
  }
  return { totalCount: 0, totalValue: 0, formatted: 'Chưa thiết lập' };
}

export function getCompetitionBannerUrl(comp) {
  if (comp?.bannerUrl) return comp.bannerUrl;
  const preset = BANNER_PRESETS.find((item) => item.key === comp?.bannerTheme);
  return preset ? preset.url : BANNER_PRESETS[0].url;
}

export function getRoundSummaryLabel(comp) {
  const rounds = Array.isArray(comp?.rounds) ? comp.rounds : [];
  if (!rounds.length) return '0 vòng';
  const openRound = rounds.find((round) => round.status === 'OPEN');
  if (openRound) return `${rounds.length} vòng (Mở V${openRound.roundNumber})`;
  return `${rounds.length} vòng`;
}

function extractItems(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.competitions)) return payload.competitions;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function normalizeRoundFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id || `round-${raw.roundNumber || Date.now()}`),
    roundNumber: Number(raw.roundNumber) || 1,
    roundName: raw.roundName || raw.name || `Vòng ${raw.roundNumber || 1}`,
    stageType: raw.stageType || 'OTHER',
    opensAt: isoToDdmmyyyy(raw.opensAt || raw.submissionOpenAt) || '—',
    closesAt: isoToDdmmyyyy(raw.closesAt || raw.submissionCloseAt) || '—',
    scoringOpensAt:
      isoToDdmmyyyy(raw.scoringOpensAt || raw.scoringOpenAt || raw.opensAt || raw.submissionOpenAt) ||
      '—',
    scoringClosesAt:
      isoToDdmmyyyy(
        raw.scoringClosesAt || raw.scoringCloseAt || raw.closesAt || raw.submissionCloseAt
      ) || '—',
    rubricId: raw.rubricId?._id || raw.rubricId || '',
    rubricName: raw.rubricName || raw.rubricId?.name || 'Chưa gắn bộ tiêu chí',
    requiredEvidenceCodes: Array.isArray(raw.requiredEvidenceCodes)
      ? raw.requiredEvidenceCodes
      : [],
    requiredDocs: raw.requiredDocs || 'Chưa quy định',
    description: raw.description || '',
    status: ROUND_STATUS[raw.status] ? raw.status : 'UPCOMING',
  };
}

function normalizeCompetitionFromApi(raw = {}) {
  return {
    id: String(raw._id || raw.id),
    code: String(raw.code || '').toUpperCase(),
    title: raw.title || raw.name || 'Cuộc thi chưa đặt tên',
    level: raw.level || 'UNIVERSITY',
    hostFaculty: raw.hostFaculty || '',
    participatingFaculties: Array.isArray(raw.participatingFaculties)
      ? raw.participatingFaculties
      : [],
    bannerTheme: raw.bannerTheme || 'navy',
    bannerUrl: raw.bannerUrl || '',
    academicYear: raw.academicYear || '2026–2027',
    organizer: raw.organizer || 'CTUT',
    location: raw.location || '',
    maxTeamMembers: Number(raw.maxTeamMembers) || 5,
    estimatedPrizePool: raw.estimatedPrizePool || '',
    startDate: isoToDdmmyyyy(raw.startDate) || '—',
    endDate: isoToDdmmyyyy(raw.endDate) || '—',
    registrationDeadline: isoToDdmmyyyy(raw.registrationDeadline) || '',
    projectCount: Number(raw.projectCount) || 0,
    guidelineFile: raw.guidelineFile || '',
    guidelineFileData: raw.guidelineFileData || '',
    guidelineFileSize: raw.guidelineFileSize || '',
    description: raw.description || '',
    status: COMPETITION_STATUS[raw.status] ? raw.status : 'UPCOMING',
    rounds: Array.isArray(raw.rounds)
      ? raw.rounds.map(normalizeRoundFromApi).sort((a, b) => a.roundNumber - b.roundNumber)
      : [],
    awards: Array.isArray(raw.awards)
      ? raw.awards.map((a, idx) => ({
          id: String(a._id || a.id || `award-${idx + 1}`),
          rank: a.rank || '',
          quantity: Number(a.quantity) || 1,
          cashAmount: a.cashAmount || '—',
          perk: a.perk || '',
        }))
      : [],
  };
}

function toApiCompetitionPayload(payload) {
  return {
    code: payload.code,
    title: payload.title,
    level: payload.level,
    hostFaculty: payload.hostFaculty || null,
    participatingFaculties: payload.participatingFaculties,
    categoryIds: payload.categoryIds,
    bannerTheme: payload.bannerTheme,
    bannerUrl: payload.bannerUrl,
    academicYear: payload.academicYear,
    organizer: payload.organizer,
    location: payload.location,
    maxTeamMembers: payload.maxTeamMembers,
    estimatedPrizePool: payload.estimatedPrizePool,
    startDate: payload.startDateIso || undefined,
    endDate: payload.endDateIso || undefined,
    registrationDeadline: payload.regDeadlineIso || undefined,
    guidelineFile: payload.guidelineFile,
    guidelineFileSize: payload.guidelineFileSize,
    description: payload.description,
    seedDefaultRounds: Boolean(payload.seedDefaultRounds),
  };
}

function toApiRoundPayload(payload) {
  return {
    roundNumber: payload.roundNumber,
    roundName: payload.roundName,
    stageType: payload.stageType,
    status: payload.status,
    submissionOpenAt: payload.opensIso || undefined,
    submissionCloseAt: payload.closesIso || undefined,
    scoringOpenAt: payload.scoringOpensIso || payload.opensIso || undefined,
    scoringCloseAt: payload.scoringClosesIso || payload.closesIso || undefined,
    rubricName: payload.rubricName || undefined,
    requiredEvidenceCodes: payload.requiredEvidenceCodes || [],
    requiredDocs: payload.requiredDocs,
    description: payload.description,
  };
}

export const useAdminCompetitionsStore = defineStore('adminCompetitions', () => {
  const toastStore = useToastStore();
  const catalogsStore = useAdminCatalogsStore();

  // Mặc định chạy dữ liệu mẫu tĩnh; bật isLiveApiEnabled = true khi BE hoàn thiện API /admin/competitions
  const isLiveApiEnabled = ref(false);
  const rawState = ref(createInitialCompetitionsMockState());

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref('');

  const viewMode = ref('list');
  const selectedCompetitionId = ref(null);
  const detailTab = ref('overview');

  const filters = reactive({
    keyword: '',
    status: '',
    faculty: '',
  });

  const projectsPagination = reactive({
    page: 1,
    pageSize: 5,
  });

  const localAuditLogs = ref([]);

  const competitions = computed(() => rawState.value.competitions || []);
  const faculties = computed(() => catalogsStore.faculties);
  const activeFaculties = computed(() => catalogsStore.activeFaculties);
  const activeCategories = computed(() => catalogsStore.activeCategories);
  const rubricOptions = computed(() =>
    (rawState.value.rubrics || [])
      .filter((r) => r.status !== 'Deprecated')
      .map((r) => ({
        value: `${r.name} v${r.version}`,
        label: `${r.name} v${r.version}`,
      }))
  );

  const selectedCompetition = computed(() => {
    if (!selectedCompetitionId.value) return null;
    return competitions.value.find((c) => c.id === selectedCompetitionId.value) || null;
  });

  const filteredCompetitions = computed(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    const status = filters.status;
    const faculty = filters.faculty;

    return competitions.value.filter((comp) => {
      const facText = (comp.participatingFaculties || []).join(' ');
      const searchable = `${comp.code} ${comp.title} ${comp.hostFaculty || ''} ${
        comp.organizer || ''
      } ${facText}`.toLowerCase();
      const matchKeyword = !keyword || searchable.includes(keyword);
      const matchStatus = !status || comp.status === status;
      const matchFaculty =
        !faculty ||
        (Array.isArray(comp.participatingFaculties) &&
          comp.participatingFaculties.includes(faculty)) ||
        comp.hostFaculty === faculty;
      return matchKeyword && matchStatus && matchFaculty;
    });
  });

  const selectedCompetitionProjects = computed(() => {
    if (!selectedCompetition.value) return [];
    return getCompetitionProjects(selectedCompetition.value.id);
  });

  const paginatedCompetitionProjects = computed(() => {
    const items = selectedCompetitionProjects.value;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / projectsPagination.pageSize));
    const safePage = Math.min(Math.max(1, projectsPagination.page), totalPages);
    const startIndex = (safePage - 1) * projectsPagination.pageSize;
    return items.slice(startIndex, startIndex + projectsPagination.pageSize);
  });

  const selectedCompetitionCategories = computed(() => {
    if (!selectedCompetition.value) return [];
    return getCompetitionCategories(selectedCompetition.value.id, false);
  });

  const selectedCompetitionEvidenceTypes = computed(() => {
    if (!selectedCompetition.value) return [];
    return getCompetitionEvidenceTypes(selectedCompetition.value.id, false);
  });

  const selectedCompetitionPrizeSummary = computed(() =>
    calculateCompetitionPrizeSummary(selectedCompetition.value)
  );

  function getCompetitionProjects(compId) {
    return (rawState.value.projects || []).filter((p) => p.competitionId === compId);
  }

  function getCompetitionProjectsCount(comp) {
    if (!comp) return 0;
    const linkedCount = getCompetitionProjects(comp.id).length;
    return linkedCount || Number(comp.projectCount) || 0;
  }

  function getCompetitionCategories(compId, includeInactive = false) {
    return catalogsStore.getCompetitionCategories(compId, includeInactive);
  }

  function getCompetitionEvidenceTypes(compId, includeInactive = false) {
    return catalogsStore.getCompetitionEvidenceTypes(compId, includeInactive);
  }

  function formatCompetitionFacultiesSummary(comp) {
    const list = Array.isArray(comp?.participatingFaculties)
      ? comp.participatingFaculties.filter(Boolean)
      : [];
    const activeCount = activeFaculties.value.length;
    if (!list.length) {
      return comp?.hostFaculty ? `Khoa ${comp.hostFaculty}` : 'Chưa chọn khoa';
    }
    if (activeCount > 0 && list.length >= activeCount) {
      return `Toàn trường (${list.length} khoa)`;
    }
    if (list.length <= 2) return list.join(', ');
    return `${list[0]}, ${list[1]} +${list.length - 2} khoa`;
  }

  function appendLocalAudit(entry) {
    localAuditLogs.value.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }

  function syncCompetitionCategories(compId, selectedCatIds) {
    catalogsStore.syncCompetitionCategories(compId, selectedCatIds, competitions.value);
  }

  // Adapter sẵn sàng chuyển đổi sang Live API khi Backend hoàn thiện các route /admin/competitions
  async function fetchLiveCompetitionsData() {
    const [compsRes, rubricsRes, projectsRes, facRes, catRes, evRes] = await Promise.allSettled([
      adminService.listCompetitions({ limit: 100 }),
      adminService.listRubrics({ limit: 100 }),
      adminService.listAdminProjects({ limit: 100 }),
      adminService.listCatalogFaculties({ limit: 100 }),
      adminService.listCatalogCategories({ limit: 100 }),
      adminService.listCatalogEvidenceTypes({ limit: 100 }),
    ]);

    if (compsRes.status === 'rejected') {
      throw compsRes.reason;
    }

    const baseState = createInitialCompetitionsMockState();
    const apiComps = extractItems(compsRes.value);
    if (apiComps.length > 0) {
      baseState.competitions = apiComps.map(normalizeCompetitionFromApi);
    }

    if (rubricsRes.status === 'fulfilled') {
      const apiRubrics = extractItems(rubricsRes.value);
      if (apiRubrics.length > 0) {
        baseState.rubrics = apiRubrics.map((r) => ({
          id: String(r._id || r.id),
          name: r.name || 'Bộ tiêu chí',
          version: r.version ?? 1,
          status: r.status || 'Active',
        }));
      }
    }

    if (projectsRes.status === 'fulfilled') {
      const apiProjects = extractItems(projectsRes.value);
      if (apiProjects.length > 0) {
        baseState.projects = apiProjects.map((p) => ({
          id: String(p._id || p.id),
          competitionId: String(p.competitionId?._id || p.competitionId || ''),
          code: p.code || '—',
          title: p.title || p.name || 'Dự án chưa đặt tên',
          category: p.category || 'Chưa phân loại',
          faculty: p.faculty || p.leaderInfo?.faculty || 'Khác',
          level: p.level || 'FACULTY',
          status: p.status || 'DRAFT',
          currentRound: p.currentRound || '—',
          submittedAt: p.submittedAt ? isoToDdmmyyyy(p.submittedAt) : '—',
          ms: [
            (p.milestones || []).filter((m) => m.status === 'COMPLETED').length,
            (p.milestones || []).length,
          ],
          leaderInfo: p.leaderInfo || null,
          advisorInfo: p.advisorInfo || p.currentMentor || null,
          members: Array.isArray(p.members) ? p.members : [],
          objectives: p.objectives || '',
          abstract: p.abstract || '',
          problemStatement: p.problemStatement || '',
          solution: p.solution || '',
          businessModel: p.businessModel || '',
          attachmentUrl: p.attachmentUrl || null,
          milestones: p.milestones || [],
          submissionRounds: p.submissionRounds || null,
        }));
      }
    }

    const catalogPatch = {};
    if (facRes.status === 'fulfilled') {
      const apiFacs = extractItems(facRes.value);
      if (apiFacs.length > 0) catalogPatch.faculties = apiFacs;
    }
    if (catRes.status === 'fulfilled') {
      const apiCats = extractItems(catRes.value);
      if (apiCats.length > 0) catalogPatch.projectCategories = apiCats;
    }
    if (evRes.status === 'fulfilled') {
      const apiEvs = extractItems(evRes.value);
      if (apiEvs.length > 0) catalogPatch.evidenceTypes = apiEvs;
    }
    catalogsStore.replaceCatalogData(catalogPatch);

    rawState.value = baseState;
  }

  async function loadCompetitions({ useLiveApi = isLiveApiEnabled.value, silent = false } = {}) {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      if (useLiveApi) {
        await fetchLiveCompetitionsData();
      }
      if (!silent) {
        toastStore.add({
          type: 'success',
          message: useLiveApi
            ? 'Đã đồng bộ danh sách cuộc thi từ hệ thống.'
            : 'Đã làm mới danh sách cuộc thi.',
        });
      }
    } catch (error) {
      errorMessage.value = error?.message || 'Không thể tải danh sách cuộc thi.';
      toastStore.add({ type: 'error', message: errorMessage.value });
    } finally {
      isLoading.value = false;
    }
  }

  function selectCompetition(competitionId, initialTab = 'overview') {
    const target = competitions.value.find((c) => c.id === competitionId);
    if (!target) return false;
    selectedCompetitionId.value = target.id;
    viewMode.value = 'detail';
    detailTab.value = VALID_DETAIL_TABS.has(initialTab) ? initialTab : 'overview';
    projectsPagination.page = 1;
    return true;
  }

  function backToList() {
    viewMode.value = 'list';
    selectedCompetitionId.value = null;
  }

  function setDetailTab(tabKey) {
    if (!VALID_DETAIL_TABS.has(tabKey)) return;
    detailTab.value = tabKey;
  }

  function setProjectsPage(nextPage) {
    projectsPagination.page = Math.max(1, Number(nextPage) || 1);
  }

  function setProjectsPageSize(nextSize) {
    projectsPagination.pageSize = Math.max(1, Number(nextSize) || 5);
    projectsPagination.page = 1;
  }

  function resetFilters() {
    filters.keyword = '';
    filters.status = '';
    filters.faculty = '';
  }

  function validateCompetitionPayload(payload, editingComp = null) {
    const isEdit = Boolean(editingComp);
    const code = isEdit
      ? editingComp.code
      : String(payload.code || '')
          .trim()
          .toUpperCase();
    const title = String(payload.title || '').trim();
    const level = String(payload.level || 'UNIVERSITY');
    const hostFaculty = level === 'FACULTY' ? String(payload.hostFaculty || '').trim() : '';

    if (!code || !title) {
      return { error: 'Vui lòng nhập đầy đủ mã và tên cuộc thi.' };
    }
    if (!isEdit && competitions.value.some((c) => c.code.toUpperCase() === code)) {
      return { error: 'Mã cuộc thi này đã tồn tại.' };
    }
    if (level === 'FACULTY' && !hostFaculty) {
      return { error: 'Vui lòng chọn Khoa đăng cai cho cuộc thi cấp Khoa.' };
    }

    const participatingFaculties = Array.from(
      new Set((payload.participatingFaculties || []).map(String).filter(Boolean))
    );
    if (level === 'FACULTY' && hostFaculty && !participatingFaculties.includes(hostFaculty)) {
      participatingFaculties.unshift(hostFaculty);
    }
    if (!participatingFaculties.length) {
      return { error: 'Vui lòng chọn ít nhất một khoa tham gia cuộc thi.' };
    }

    const startIso = String(payload.startDateIso || '').trim();
    const endIso = String(payload.endDateIso || '').trim();
    const regIso = String(payload.regDeadlineIso || '').trim();
    if (!startIso || !endIso) {
      return { error: 'Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.' };
    }
    if (endIso < startIso) {
      return { error: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' };
    }
    if (regIso && regIso > endIso) {
      return { error: 'Hạn nộp hồ sơ không được sau ngày kết thúc cuộc thi.' };
    }

    return {
      data: {
        code,
        title,
        level,
        hostFaculty,
        participatingFaculties,
        bannerTheme: String(payload.bannerTheme || 'navy'),
        bannerUrl: String(payload.bannerUrl || '').trim() || BANNER_PRESETS[0].url,
        academicYear: String(payload.academicYear || '2026–2027').trim(),
        organizer: String(payload.organizer || 'CTUT').trim(),
        location: String(payload.location || '').trim(),
        maxTeamMembers: Math.min(20, Math.max(1, Number(payload.maxTeamMembers) || 5)),
        estimatedPrizePool: String(payload.estimatedPrizePool || '').trim(),
        startDate: isoToDdmmyyyy(startIso),
        endDate: isoToDdmmyyyy(endIso),
        registrationDeadline: regIso ? isoToDdmmyyyy(regIso) : '',
        startDateIso: startIso,
        endDateIso: endIso,
        regDeadlineIso: regIso,
        guidelineFile: String(payload.guidelineFile || '').trim(),
        guidelineFileData: String(payload.guidelineFileData || ''),
        guidelineFileSize: String(payload.guidelineFileSize || ''),
        description: String(payload.description || '').trim(),
        categoryIds: Array.isArray(payload.categoryIds) ? payload.categoryIds.map(String) : [],
        seedDefaultRounds: Boolean(payload.seedDefaultRounds),
      },
    };
  }

  async function createCompetition(payload) {
    const validated = validateCompetitionPayload(payload, null);
    if (validated.error) {
      toastStore.add({ type: 'warning', message: validated.error });
      return false;
    }

    const clean = validated.data;
    isSubmitting.value = true;
    try {
      let createdRecord = null;
      if (isLiveApiEnabled.value) {
        const res = await adminService.createCompetition(toApiCompetitionPayload(clean));
        createdRecord = normalizeCompetitionFromApi(res?.data || res);
      } else {
        const newId = `c-${Date.now()}`;
        const defaultRubric = rubricOptions.value[0]?.value || '';
        const defaultRounds = clean.seedDefaultRounds
          ? [
              {
                id: `${newId}-r1`,
                roundNumber: 1,
                roundName: 'Vòng 1 — Sơ khảo ý tưởng',
                stageType: 'PRELIM',
                opensAt: clean.startDate,
                closesAt: clean.registrationDeadline || clean.endDate,
                scoringOpensAt: clean.registrationDeadline || clean.startDate,
                scoringClosesAt: clean.endDate,
                rubricName: defaultRubric,
                requiredEvidenceCodes: ['proposalDoc'],
                requiredDocs: 'Tài liệu thuyết minh đề tài',
                description: 'Đánh giá tính mới, tính khả thi của đề xuất dự án.',
                status: 'UPCOMING',
              },
              {
                id: `${newId}-r2`,
                roundNumber: 2,
                roundName: 'Vòng 2 — Chung kết & Pitching',
                stageType: 'FINAL',
                opensAt: clean.startDate,
                closesAt: clean.endDate,
                scoringOpensAt: clean.endDate,
                scoringClosesAt: clean.endDate,
                rubricName: defaultRubric,
                requiredEvidenceCodes: ['reportFile', 'pitchDeck'],
                requiredDocs: 'Báo cáo dự án hoàn chỉnh, Slide trình bày (Pitch Deck)',
                description: 'Bảo vệ trực tiếp trước Hội đồng Giám khảo.',
                status: 'UPCOMING',
              },
            ]
          : [];

        createdRecord = {
          id: newId,
          code: clean.code,
          title: clean.title,
          level: clean.level,
          hostFaculty: clean.hostFaculty,
          participatingFaculties: clean.participatingFaculties,
          bannerTheme: clean.bannerTheme,
          bannerUrl: clean.bannerUrl,
          academicYear: clean.academicYear,
          organizer: clean.organizer,
          location: clean.location,
          maxTeamMembers: clean.maxTeamMembers,
          estimatedPrizePool: clean.estimatedPrizePool,
          startDate: clean.startDate,
          endDate: clean.endDate,
          registrationDeadline: clean.registrationDeadline,
          projectCount: 0,
          guidelineFile: clean.guidelineFile,
          guidelineFileData: clean.guidelineFileData,
          guidelineFileSize: clean.guidelineFileSize,
          description: clean.description,
          status: 'UPCOMING',
          rounds: defaultRounds,
          awards: [],
        };
      }

      rawState.value.competitions.unshift(createdRecord);
      syncCompetitionCategories(createdRecord.id, clean.categoryIds);
      selectCompetition(createdRecord.id, 'overview');

      appendLocalAudit({
        action: 'COMPETITION_CREATE',
        targetEntity: 'Competitions',
        targetId: createdRecord.code,
        summary: `Tạo mới cuộc thi «${createdRecord.title}» (${clean.participatingFaculties.length} khoa tham gia)`,
      });

      toastStore.add({
        type: 'success',
        message: `Đã tạo cuộc thi «${createdRecord.title}» thành công.`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể tạo cuộc thi mới.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updateCompetition(competitionId, payload) {
    const existing = competitions.value.find((c) => c.id === competitionId);
    if (!existing) return false;

    const validated = validateCompetitionPayload(payload, existing);
    if (validated.error) {
      toastStore.add({ type: 'warning', message: validated.error });
      return false;
    }

    const clean = validated.data;
    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        const res = await adminService.updateCompetition(
          competitionId,
          toApiCompetitionPayload(clean)
        );
        const updated = normalizeCompetitionFromApi(res?.data || res);
        Object.assign(existing, updated);
      } else {
        Object.assign(existing, {
          title: clean.title,
          level: clean.level,
          hostFaculty: clean.hostFaculty,
          participatingFaculties: clean.participatingFaculties,
          bannerTheme: clean.bannerTheme,
          bannerUrl: clean.bannerUrl,
          academicYear: clean.academicYear,
          organizer: clean.organizer,
          location: clean.location,
          maxTeamMembers: clean.maxTeamMembers,
          estimatedPrizePool: clean.estimatedPrizePool,
          startDate: clean.startDate,
          endDate: clean.endDate,
          registrationDeadline: clean.registrationDeadline,
          guidelineFile: clean.guidelineFile,
          guidelineFileData: clean.guidelineFileData,
          guidelineFileSize: clean.guidelineFileSize,
          description: clean.description,
        });
      }

      syncCompetitionCategories(existing.id, clean.categoryIds);
      appendLocalAudit({
        action: 'COMPETITION_UPDATE',
        targetEntity: 'Competitions',
        targetId: existing.code,
        summary: `Cập nhật thông tin cuộc thi ${existing.code} (${clean.participatingFaculties.length} khoa tham gia)`,
      });

      toastStore.add({
        type: 'success',
        message: `Đã cập nhật thông tin cuộc thi ${existing.code}.`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể cập nhật thông tin cuộc thi.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updateCompetitionStatus(competitionId, { status, note = '' }) {
    const existing = competitions.value.find((c) => c.id === competitionId);
    if (!existing || !COMPETITION_STATUS[status]) return false;

    isSubmitting.value = true;
    try {
      const cleanNote = String(note || '').trim();
      if (isLiveApiEnabled.value) {
        await adminService.updateCompetitionStatus(competitionId, { status, note: cleanNote });
      }
      existing.status = status;
      appendLocalAudit({
        action: 'COMPETITION_STATUS',
        targetEntity: 'Competitions',
        targetId: existing.code,
        summary: `Đổi trạng thái cuộc thi ${existing.code} sang ${COMPETITION_STATUS[status].label}`,
      });
      toastStore.add({
        type: 'success',
        message: `Đã chuyển ${existing.code} sang trạng thái ${COMPETITION_STATUS[status].label}.`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể cập nhật trạng thái cuộc thi.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveRound(competitionId, roundIndex, payload) {
    const comp = competitions.value.find((c) => c.id === competitionId);
    if (!comp) return false;

    const roundName = String(payload.roundName || '').trim();
    const roundNumber = Math.max(1, Number(payload.roundNumber) || 1);
    if (!roundName) {
      toastStore.add({ type: 'warning', message: 'Vui lòng nhập tên vòng thi.' });
      return false;
    }

    const isEditing = typeof roundIndex === 'number' && roundIndex >= 0 && comp.rounds[roundIndex];
    if (
      comp.rounds.some(
        (round, idx) => idx !== roundIndex && Number(round.roundNumber) === roundNumber
      )
    ) {
      toastStore.add({
        type: 'warning',
        message: `Thứ tự Vòng ${roundNumber} đã tồn tại trong cuộc thi này.`,
      });
      return false;
    }

    const opensIso = String(payload.opensIso || '').trim();
    const closesIso = String(payload.closesIso || '').trim();
    const scoringOpensIso = String(payload.scoringOpensIso || '').trim();
    const scoringClosesIso = String(payload.scoringClosesIso || '').trim();
    if (!opensIso || !closesIso) {
      toastStore.add({
        type: 'warning',
        message: 'Vui lòng chọn ngày mở và ngày đóng nhận bài.',
      });
      return false;
    }
    if (closesIso < opensIso) {
      toastStore.add({
        type: 'warning',
        message: 'Ngày đóng nhận bài phải lớn hơn hoặc bằng ngày mở nhận bài.',
      });
      return false;
    }
    if (scoringOpensIso && scoringClosesIso && scoringClosesIso < scoringOpensIso) {
      toastStore.add({
        type: 'warning',
        message: 'Ngày kết thúc chấm phải lớn hơn hoặc bằng ngày bắt đầu chấm.',
      });
      return false;
    }

    const requiredEvidenceCodes = Array.isArray(payload.requiredEvidenceCodes)
      ? payload.requiredEvidenceCodes.map(String)
      : [];
    const requiredDocs = requiredEvidenceCodes
      .map((code) => catalogsStore.evidenceTypes.find((e) => e.code === code)?.name || code)
      .join(', ');

    const roundItem = {
      id: isEditing ? comp.rounds[roundIndex].id : `${comp.id}-r-${Date.now()}`,
      roundNumber,
      roundName,
      stageType: STAGE_TYPES[payload.stageType] ? payload.stageType : 'PRELIM',
      opensAt: isoToDdmmyyyy(opensIso),
      closesAt: isoToDdmmyyyy(closesIso),
      scoringOpensAt: scoringOpensIso ? isoToDdmmyyyy(scoringOpensIso) : isoToDdmmyyyy(opensIso),
      scoringClosesAt: scoringClosesIso
        ? isoToDdmmyyyy(scoringClosesIso)
        : isoToDdmmyyyy(closesIso),
      rubricName: String(payload.rubricName || '').trim(),
      requiredEvidenceCodes,
      requiredDocs: requiredDocs || 'Chưa quy định',
      description: String(payload.description || '').trim(),
      status: ROUND_STATUS[payload.status] ? payload.status : 'UPCOMING',
    };

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        const apiBody = toApiRoundPayload({
          ...roundItem,
          opensIso,
          closesIso,
          scoringOpensIso,
          scoringClosesIso,
        });
        if (isEditing) {
          const res = await adminService.updateCompetitionRound(
            comp.id,
            comp.rounds[roundIndex].id,
            apiBody
          );
          Object.assign(roundItem, normalizeRoundFromApi(res?.data || roundItem));
        } else {
          const res = await adminService.createCompetitionRound(comp.id, apiBody);
          Object.assign(roundItem, normalizeRoundFromApi(res?.data || roundItem));
        }
      }

      if (isEditing) {
        comp.rounds[roundIndex] = roundItem;
      } else {
        comp.rounds.push(roundItem);
      }
      comp.rounds.sort((a, b) => Number(a.roundNumber) - Number(b.roundNumber));
      detailTab.value = 'rounds';

      appendLocalAudit({
        action: isEditing ? 'UPDATE_COMPETITION_ROUND' : 'CREATE_COMPETITION_ROUND',
        targetEntity: 'CompetitionRounds',
        targetId: `${comp.code} - V${roundNumber}`,
        summary: `${isEditing ? 'Cập nhật' : 'Thêm'} vòng thi «${roundName}»`,
      });

      toastStore.add({
        type: 'success',
        message: `${isEditing ? 'Đã cập nhật' : 'Đã thêm'} «${roundName}».`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể lưu thông tin vòng thi.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function deleteRound(competitionId, roundIndex) {
    const comp = competitions.value.find((c) => c.id === competitionId);
    const round = comp?.rounds?.[roundIndex];
    if (!comp || !round) return false;

    // Bảo toàn toàn vẹn dữ liệu chấm điểm: chặn xóa vòng đã phát sinh phiếu chấm
    const hasEvaluation = (rawState.value.evaluations || []).some(
      (ev) => ev.competitionId === comp.id && Number(ev.roundNumber) === Number(round.roundNumber)
    );
    if (hasEvaluation) {
      toastStore.add({
        type: 'warning',
        message: `Không thể xóa «${round.roundName}» vì vòng thi đã phát sinh phiếu chấm điểm.`,
      });
      return false;
    }

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        await adminService.deleteCompetitionRound(comp.id, round.id);
      }
      const [removed] = comp.rounds.splice(roundIndex, 1);
      appendLocalAudit({
        action: 'DELETE_COMPETITION_ROUND',
        targetEntity: 'CompetitionRounds',
        targetId: `${comp.code} - V${removed.roundNumber}`,
        summary: `Xóa vòng thi «${removed.roundName}» khỏi ${comp.code}`,
      });
      toastStore.add({
        type: 'success',
        message: `Đã xóa vòng thi «${removed.roundName}».`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể xóa vòng thi.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function saveAward(competitionId, awardIndex, payload) {
    const comp = competitions.value.find((c) => c.id === competitionId);
    if (!comp) return false;

    const rank = String(payload.rank || '').trim();
    if (!rank) {
      toastStore.add({ type: 'warning', message: 'Vui lòng nhập tên hạng giải.' });
      return false;
    }

    const isEditing =
      typeof awardIndex === 'number' && awardIndex >= 0 && comp.awards[awardIndex];
    const awardItem = {
      id: isEditing ? comp.awards[awardIndex].id : `${comp.id}-a-${Date.now()}`,
      rank,
      quantity: Math.max(1, Number(payload.quantity) || 1),
      cashAmount: String(payload.cashAmount || '').trim() || '—',
      perk: String(payload.perk || '').trim(),
    };

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        if (isEditing) {
          await adminService.updateCompetitionAward(
            comp.id,
            comp.awards[awardIndex].id,
            awardItem
          );
        } else {
          await adminService.createCompetitionAward(comp.id, awardItem);
        }
      }

      if (isEditing) {
        comp.awards[awardIndex] = awardItem;
      } else {
        comp.awards.push(awardItem);
      }
      detailTab.value = 'awards';

      appendLocalAudit({
        action: isEditing ? 'UPDATE_COMPETITION_AWARD' : 'CREATE_COMPETITION_AWARD',
        targetEntity: 'CompetitionAwards',
        targetId: comp.code,
        summary: `${isEditing ? 'Cập nhật' : 'Thêm'} hạng giải «${rank}» (${awardItem.quantity} giải) cho ${comp.code}`,
      });

      toastStore.add({
        type: 'success',
        message: `${isEditing ? 'Đã cập nhật' : 'Đã thêm'} «${rank}» vào cơ cấu giải thưởng.`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể lưu hạng giải thưởng.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function deleteAward(competitionId, awardIndex) {
    const comp = competitions.value.find((c) => c.id === competitionId);
    const award = comp?.awards?.[awardIndex];
    if (!comp || !award) return false;

    isSubmitting.value = true;
    try {
      if (isLiveApiEnabled.value) {
        await adminService.deleteCompetitionAward(comp.id, award.id);
      }
      const [removed] = comp.awards.splice(awardIndex, 1);
      appendLocalAudit({
        action: 'DELETE_COMPETITION_AWARD',
        targetEntity: 'CompetitionAwards',
        targetId: comp.code,
        summary: `Xóa hạng giải «${removed.rank}» khỏi ${comp.code}`,
      });
      toastStore.add({
        type: 'success',
        message: `Đã xóa hạng giải «${removed.rank}».`,
      });
      return true;
    } catch (error) {
      toastStore.add({
        type: 'error',
        message: error?.message || 'Không thể xóa hạng giải thưởng.',
      });
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  function syncCatalogRename({ kind, oldName, newName, oldCode, newCode } = {}) {
    if (kind === 'category' && oldName && newName && oldName !== newName) {
      (rawState.value.projects || []).forEach((proj) => {
        if (proj.category === oldName) proj.category = newName;
      });
      return;
    }

    if (kind === 'faculty' && oldName && newName && oldName !== newName) {
      (rawState.value.projects || []).forEach((proj) => {
        if (proj.faculty === oldName) proj.faculty = newName;
      });
      (rawState.value.competitions || []).forEach((comp) => {
        if (comp.hostFaculty === oldName) comp.hostFaculty = newName;
        if (Array.isArray(comp.participatingFaculties)) {
          comp.participatingFaculties = Array.from(
            new Set(comp.participatingFaculties.map((fname) => (fname === oldName ? newName : fname)))
          );
        }
      });
      if (filters.faculty === oldName) {
        filters.faculty = newName;
      }
      return;
    }

    if (kind === 'evidence') {
      (rawState.value.competitions || []).forEach((comp) => {
        (comp.rounds || []).forEach((round) => {
          if (!Array.isArray(round.requiredEvidenceCodes) || !round.requiredEvidenceCodes.length) {
            return;
          }
          if (oldCode && newCode && oldCode !== newCode) {
            round.requiredEvidenceCodes = round.requiredEvidenceCodes.map((code) =>
              code === oldCode ? newCode : code
            );
          }
          round.requiredDocs =
            round.requiredEvidenceCodes
              .map(
                (code) => catalogsStore.evidenceTypes.find((e) => e.code === code)?.name || code
              )
              .join(', ') || 'Chưa quy định';
        });
      });
    }
  }

  return {
    isLiveApiEnabled,
    isLoading,
    isSubmitting,
    errorMessage,
    viewMode,
    selectedCompetitionId,
    detailTab,
    filters,
    projectsPagination,
    localAuditLogs,
    competitions,
    faculties,
    activeFaculties,
    activeCategories,
    rubricOptions,
    selectedCompetition,
    filteredCompetitions,
    selectedCompetitionProjects,
    paginatedCompetitionProjects,
    selectedCompetitionCategories,
    selectedCompetitionEvidenceTypes,
    selectedCompetitionPrizeSummary,
    getCompetitionProjects,
    getCompetitionProjectsCount,
    getCompetitionCategories,
    getCompetitionEvidenceTypes,
    formatCompetitionFacultiesSummary,
    loadCompetitions,
    selectCompetition,
    backToList,
    setDetailTab,
    setProjectsPage,
    setProjectsPageSize,
    resetFilters,
    createCompetition,
    updateCompetition,
    updateCompetitionStatus,
    saveRound,
    deleteRound,
    saveAward,
    deleteAward,
    syncCatalogRename,
  };
});

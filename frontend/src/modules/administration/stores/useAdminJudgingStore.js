import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import {
  getRoundProjects as filterRoundProjects,
  isDuplicateEvaluation,
  paginateItems,
  summarizeCouncil,
} from '@/modules/administration/utils/judgingHelpers';

const TABLE_KEYS = ['councils', 'evaluations', 'emergencies', 'overrides'];
const PAGE_SIZE_OPTIONS = [5, 10, 20];

function createEmptyJudgingState() {
  return {
    competitions: [],
    projects: [],
    judges: [],
    rubrics: [],
    councils: [],
    evaluations: [],
    emergencies: [],
    overrides: [],
    auditLogs: [],
  };
}

function formatTodayDate(date = new Date()) {
  return new Intl.DateTimeFormat('vi-VN').format(date);
}

function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export const useAdminJudgingStore = defineStore('adminJudging', () => {
  const authStore = useAuthStore();
  const initialState = createEmptyJudgingState();
  const competitions = ref(initialState.competitions);
  const projects = ref(initialState.projects);
  const judges = ref(initialState.judges);
  const rubrics = ref(initialState.rubrics);
  const councils = ref(initialState.councils);
  const evaluations = ref(initialState.evaluations);
  const emergencies = ref(initialState.emergencies);
  const overrides = ref(initialState.overrides);
  const auditLogs = ref(initialState.auditLogs);

  const filters = ref({
    councilCompetitionId: '',
    assignmentsRoundKey: 'all',
  });
  const pages = ref({ councils: 1, evaluations: 1, emergencies: 1, overrides: 1 });
  const pageSizes = ref({ councils: 5, evaluations: 5, emergencies: 5, overrides: 5 });

  const roundOptions = computed(() =>
    competitions.value.flatMap((competition) =>
      (competition.rounds || []).map((round) => ({
        key: `${competition.id}:${round.roundNumber}`,
        competitionId: competition.id,
        roundNumber: Number(round.roundNumber),
        label: `${competition.code} · Vòng ${round.roundNumber} — ${round.roundName}`,
      }))
    )
  );
  const filteredCouncils = computed(() =>
    filters.value.councilCompetitionId
      ? councils.value.filter(
          (council) => council.competitionId === filters.value.councilCompetitionId
        )
      : councils.value
  );
  const filteredEvaluations = computed(() => {
    const key = filters.value.assignmentsRoundKey;
    if (!key || key === 'all') return evaluations.value;
    const [competitionId, roundNumber] = key.split(':');
    return evaluations.value.filter(
      (evaluation) =>
        evaluation.competitionId === competitionId &&
        Number(evaluation.roundNumber) === Number(roundNumber)
    );
  });
  const councilPagination = computed(() =>
    paginateItems(filteredCouncils.value, pages.value.councils, pageSizes.value.councils)
  );
  const evaluationPagination = computed(() =>
    paginateItems(filteredEvaluations.value, pages.value.evaluations, pageSizes.value.evaluations)
  );
  const emergencyPagination = computed(() =>
    paginateItems(emergencies.value, pages.value.emergencies, pageSizes.value.emergencies)
  );
  const overridePagination = computed(() =>
    paginateItems(overrides.value, pages.value.overrides, pageSizes.value.overrides)
  );
  const evaluationCounts = computed(() => ({
    total: filteredEvaluations.value.length,
    submitted: filteredEvaluations.value.filter((item) => item.status === 'SUBMITTED').length,
    draft: filteredEvaluations.value.filter((item) => item.status === 'DRAFT').length,
  }));
  const pendingEmergencyCount = computed(
    () => emergencies.value.filter((item) => item.status === 'PENDING').length
  );
  const activeOverrideCount = computed(
    () => overrides.value.filter((item) => item.status === 'ACTIVE').length
  );
  const judgingBadgeCount = computed(
    () => pendingEmergencyCount.value + activeOverrideCount.value
  );

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addAuditLog(action, targetId, summary) {
    auditLogs.value.unshift({
      id: createId('audit'),
      timestamp: formatTimestamp(),
      isToday: true,
      action,
      targetId,
      summary,
    });
  }

  function getTableItems(tableKey) {
    if (tableKey === 'councils') return filteredCouncils.value;
    if (tableKey === 'evaluations') return filteredEvaluations.value;
    if (tableKey === 'emergencies') return emergencies.value;
    if (tableKey === 'overrides') return overrides.value;
    return [];
  }

  function setFilter(key, value) {
    if (key === 'councilCompetitionId') {
      const isValid = !value || competitions.value.some((item) => item.id === value);
      if (!isValid) return false;
      filters.value.councilCompetitionId = value;
      pages.value.councils = 1;
      return true;
    }

    if (key === 'assignmentsRoundKey') {
      const isValid = value === 'all' || roundOptions.value.some((item) => item.key === value);
      if (!isValid) return false;
      filters.value.assignmentsRoundKey = value;
      pages.value.evaluations = 1;
      return true;
    }

    return false;
  }

  function setPage(tableKey, page) {
    if (!TABLE_KEYS.includes(tableKey)) return false;
    const totalPages = Math.max(1, Math.ceil(getTableItems(tableKey).length / pageSizes.value[tableKey]));
    pages.value[tableKey] = Math.min(Math.max(1, Number(page) || 1), totalPages);
    return true;
  }

  function setPageSize(tableKey, pageSize) {
    if (!TABLE_KEYS.includes(tableKey) || !PAGE_SIZE_OPTIONS.includes(Number(pageSize))) return false;
    pageSizes.value[tableKey] = Number(pageSize);
    pages.value[tableKey] = 1;
    return true;
  }

  function getProjectByIdOrCode(projectIdOrCode) {
    return projects.value.find(
      (project) => project.id === projectIdOrCode || project.code === projectIdOrCode
    );
  }

  function getJudgeByEmail(email) {
    return judges.value.find((judge) => judge.email === email);
  }

  function getRoundProjects(competitionId, roundNumber) {
    return filterRoundProjects(projects.value, competitionId, roundNumber);
  }

  function getCouncilSummary(councilId) {
    const council = councils.value.find((item) => item.id === councilId);
    return summarizeCouncil(council, evaluations.value, projects.value);
  }

  function getRoundContext(roundKey) {
    if (!roundKey || roundKey === 'all') return null;
    const [competitionId, roundNumber] = roundKey.split(':');
    return { competitionId, roundNumber: Number(roundNumber) };
  }

  function saveCouncil(councilId, draft) {
    const name = String(draft?.name || '').trim();
    const decisionNumber = String(draft?.decisionNumber || '').trim().toUpperCase();
    const competitionId = String(draft?.competitionId || '');
    const roundNumber = Number(draft?.roundNumber);
    const chairEmail = String(draft?.chairEmail || '');
    const secretaryEmail = String(draft?.secretaryEmail || '');

    if (!name || !decisionNumber || !competitionId || !roundNumber || !chairEmail || !secretaryEmail) {
      return { ok: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc của hội đồng.' };
    }
    if (chairEmail === secretaryEmail) {
      return { ok: false, message: 'Chủ tịch và Thư ký hội đồng phải là hai người khác nhau.' };
    }
    const competition = competitions.value.find((item) => item.id === competitionId);
    if (!competition) {
      return { ok: false, message: 'Cuộc thi đã chọn không còn tồn tại.' };
    }
    if (!competition.rounds?.some((item) => Number(item.roundNumber) === roundNumber)) {
      return { ok: false, message: 'Vòng thi đã chọn không còn tồn tại trong cuộc thi.' };
    }
    if (!getJudgeByEmail(chairEmail) || !getJudgeByEmail(secretaryEmail)) {
      return { ok: false, message: 'Vui lòng chọn giám khảo có trong danh sách.' };
    }

    const memberEmails = [...new Set([chairEmail, secretaryEmail, ...(draft.memberEmails || [])])]
      .filter((email) => Boolean(getJudgeByEmail(email)));
    const existingCouncil = councils.value.find((item) => item.id === councilId);
    if (councilId && !existingCouncil) {
      return { ok: false, message: 'Hội đồng cần chỉnh sửa không còn tồn tại.' };
    }
    const savedCouncil = {
      ...(existingCouncil || {}),
      id: existingCouncil?.id || createId('council'),
      competitionId,
      roundNumber,
      name,
      decisionNumber,
      chairEmail,
      secretaryEmail,
      memberEmails,
      status: existingCouncil?.status || 'ACTIVE',
      note: String(draft.note || '').trim(),
      createdAt: existingCouncil?.createdAt || formatTodayDate(),
    };

    if (existingCouncil) {
      Object.assign(existingCouncil, savedCouncil);
      addAuditLog('UPDATE_COUNCIL', savedCouncil.id, `Cập nhật hội đồng «${name}».`);
    } else {
      councils.value.unshift(savedCouncil);
      addAuditLog('CREATE_COUNCIL', savedCouncil.id, `Thành lập hội đồng «${name}».`);
    }

    return { ok: true, council: savedCouncil };
  }

  function deleteCouncil(councilId) {
    const index = councils.value.findIndex((item) => item.id === councilId);
    if (index < 0) return false;
    const [removedCouncil] = councils.value.splice(index, 1);
    addAuditLog('DELETE_COUNCIL', removedCouncil.id, `Xóa hội đồng «${removedCouncil.name}».`);
    setPage('councils', pages.value.councils);
    return true;
  }

  function assignRound(payload) {
    const competitionId = String(payload?.competitionId || '');
    const roundNumber = Number(payload?.roundNumber);
    const council = councils.value.find(
      (item) =>
        item.id === payload?.councilId &&
        item.competitionId === competitionId &&
        Number(item.roundNumber) === roundNumber
    );
    const judgeEmails = [...new Set(payload?.judgeEmails || [])];
    const projectIds = [...new Set(payload?.projectIds || [])];
    const validRound = competitions.value
      .find((item) => item.id === competitionId)
      ?.rounds?.some((item) => Number(item.roundNumber) === roundNumber);

    if (!validRound || !council || !judgeEmails.length || !projectIds.length) {
      return { ok: false, message: 'Chọn cuộc thi, vòng, hội đồng, giám khảo và dự án trước khi lưu.' };
    }

    const availableJudges = new Set(council.memberEmails || []);
    const selectedJudges = judgeEmails.filter(
      (email) => availableJudges.has(email) && Boolean(getJudgeByEmail(email))
    );
    const availableProjects = new Set(
      getRoundProjects(competitionId, roundNumber).map((project) => project.id)
    );
    const selectedProjects = projectIds
      .filter((id) => availableProjects.has(id))
      .map((id) => getProjectByIdOrCode(id));
    const rubric = rubrics.value.find((item) => item.id === payload.rubricId);

    if (
      !selectedJudges.length ||
      selectedJudges.length !== judgeEmails.length ||
      !selectedProjects.length ||
      selectedProjects.length !== projectIds.length ||
      !rubric
    ) {
      return { ok: false, message: 'Không còn giám khảo, dự án hoặc bộ tiêu chí phù hợp.' };
    }

    let createdCount = 0;
    let duplicateCount = 0;
    selectedProjects.forEach((project) => {
      selectedJudges.forEach((judgeEmail) => {
        const candidate = { competitionId, roundNumber, projectId: project.id, judgeEmail };
        if (isDuplicateEvaluation(evaluations.value, candidate)) {
          duplicateCount += 1;
          return;
        }

        const judge = getJudgeByEmail(judgeEmail);
        evaluations.value.unshift({
          id: createId('evaluation'),
          ...candidate,
          project: project.code,
          judge: judge.name,
          rubricId: rubric.id,
          rubric: `${rubric.name} v${rubric.version}`,
          status: 'DRAFT',
          score: null,
        });
        createdCount += 1;
      });
    });

    filters.value.assignmentsRoundKey = `${competitionId}:${roundNumber}`;
    pages.value.evaluations = 1;
    if (createdCount) {
      addAuditLog(
        'ASSIGN_ROUND',
        council.id,
        `Tạo ${createdCount} phiếu chấm cho ${projectIds.length} dự án.`
      );
    }

    return { ok: true, createdCount, duplicateCount };
  }

  function createEmergency(draft) {
    const project = getProjectByIdOrCode(draft?.projectId);
    const originalJudge = getJudgeByEmail(draft?.originalJudgeEmail);
    const replacementJudge = getJudgeByEmail(draft?.replacementJudgeEmail);
    const competitionId = String(draft?.competitionId || project?.competitionId || '');
    const roundNumber = Number(draft?.roundNumber);
    const isValidRound = competitions.value
      .find((item) => item.id === competitionId)
      ?.rounds?.some((item) => Number(item.roundNumber) === roundNumber);
    const isProjectInRound = getRoundProjects(competitionId, roundNumber).some(
      (item) => item.id === project?.id
    );
    const reason = String(draft?.reason || '').trim();

    if (
      !project ||
      !originalJudge ||
      !replacementJudge ||
      project.competitionId !== competitionId ||
      !isValidRound ||
      !isProjectInRound
    ) {
      return { ok: false, message: 'Vui lòng chọn dự án và hai giám khảo hợp lệ.' };
    }
    if (originalJudge.email === replacementJudge.email) {
      return { ok: false, message: 'Giám khảo thay thế phải khác giám khảo hiện tại.' };
    }
    if (reason.length < 5) {
      return { ok: false, message: 'Lý do điều chuyển cần có ít nhất 5 ký tự.' };
    }

    const emergency = {
      id: createId('emergency'),
      competitionId,
      roundNumber,
      projectId: project.id,
      project: project.code,
      fromEmail: originalJudge.email,
      toEmail: replacementJudge.email,
      from: originalJudge.name,
      to: replacementJudge.name,
      reason,
      date: formatTodayDate(),
      status: 'PENDING',
    };
    emergencies.value.unshift(emergency);
    addAuditLog('CREATE_EMERGENCY', emergency.id, `Tạo lệnh điều chuyển giám khảo ${project.code}.`);
    return { ok: true, emergency };
  }

  function completeEmergency(emergencyId) {
    const emergency = emergencies.value.find((item) => item.id === emergencyId);
    if (!emergency || emergency.status !== 'PENDING') return false;

    evaluations.value.forEach((evaluation) => {
      if (
        evaluation.projectId === emergency.projectId &&
        evaluation.competitionId === emergency.competitionId &&
        Number(evaluation.roundNumber) === Number(emergency.roundNumber) &&
        evaluation.judgeEmail === emergency.fromEmail &&
        evaluation.status === 'DRAFT'
      ) {
        evaluation.judgeEmail = emergency.toEmail;
        evaluation.judge = emergency.to;
      }
    });
    emergency.status = 'COMPLETED';
    addAuditLog('COMPLETE_EMERGENCY', emergency.id, `Hoàn tất điều chuyển ${emergency.project}.`);
    return true;
  }

  function createOverride(draft) {
    const project = getProjectByIdOrCode(draft?.projectId);
    const competitionId = String(draft?.competitionId || project?.competitionId || '');
    const roundNumber = Number(draft?.roundNumber);
    const isValidRound = competitions.value
      .find((item) => item.id === competitionId)
      ?.rounds?.some((item) => Number(item.roundNumber) === roundNumber);
    const isProjectInRound = getRoundProjects(competitionId, roundNumber).some(
      (item) => item.id === project?.id
    );
    const hasEmptyScore =
      String(draft?.originalScore ?? '').trim() === '' || String(draft?.newScore ?? '').trim() === '';
    const originalScore = Number(draft?.originalScore);
    const newScore = Number(draft?.newScore);
    const reason = String(draft?.reason || '').trim();

    if (
      !project ||
      project.competitionId !== competitionId ||
      !isValidRound ||
      !isProjectInRound ||
      hasEmptyScore ||
      !Number.isFinite(originalScore) ||
      !Number.isFinite(newScore)
    ) {
      return { ok: false, message: 'Vui lòng chọn dự án và nhập điểm hợp lệ.' };
    }
    if (originalScore < 0 || originalScore > 10 || newScore < 0 || newScore > 10) {
      return { ok: false, message: 'Điểm phải nằm trong khoảng 0–10.' };
    }
    if (reason.length < 5) {
      return { ok: false, message: 'Lý do điều chỉnh cần có ít nhất 5 ký tự.' };
    }

    const override = {
      id: createId('override'),
      competitionId,
      roundNumber,
      projectId: project.id,
      project: project.code,
      criterion: 'Tổng điểm đánh giá',
      from: originalScore,
      to: newScore,
      reason,
      by:
        authStore.user?.fullName ||
        authStore.user?.name ||
        authStore.user?.email ||
        'Quản trị viên',
      date: formatTodayDate(),
      status: 'ACTIVE',
    };
    overrides.value.unshift(override);
    addAuditLog('SCORE_OVERRIDE', override.id, `Điều chỉnh điểm ${project.code}: ${originalScore} → ${newScore}.`);
    return { ok: true, override };
  }

  function revokeRecord(kind, recordId, reason) {
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 5) {
      return { ok: false, message: 'Lý do thu hồi cần có ít nhất 5 ký tự.' };
    }

    if (kind === 'override') {
      const override = overrides.value.find((item) => item.id === recordId);
      if (!override || override.status !== 'ACTIVE') {
        return { ok: false, message: 'Chỉ có thể thu hồi điều chỉnh đang còn hiệu lực.' };
      }
      override.status = 'REVOKED';
      addAuditLog('REVOKE_OVERRIDE', override.id, `Thu hồi điều chỉnh điểm ${override.project}.`);
      return { ok: true };
    }

    if (kind === 'emergency') {
      const index = emergencies.value.findIndex(
        (item) => item.id === recordId && item.status === 'PENDING'
      );
      if (index < 0) return { ok: false, message: 'Lệnh không còn ở trạng thái chờ xử lý.' };
      const [emergency] = emergencies.value.splice(index, 1);
      addAuditLog('REVOKE_EMERGENCY', emergency.id, `Thu hồi lệnh điều chuyển ${emergency.project}.`);
      setPage('emergencies', pages.value.emergencies);
      return { ok: true };
    }

    return { ok: false, message: 'Loại bản ghi không hợp lệ.' };
  }

  function runLegacyCheck(limit) {
    const count = Number(limit);
    if (!Number.isInteger(count) || count < 0 || count > 5000) {
      return { ok: false, message: 'Số lượng cần là số nguyên trong khoảng 0–5.000.' };
    }

    return {
      ok: true,
      checkedCount: Math.min(count, evaluations.value.length),
      remainingCount: Math.max(0, count - evaluations.value.length),
    };
  }

  return {
    competitions,
    projects,
    judges,
    rubrics,
    councils,
    evaluations,
    emergencies,
    overrides,
    auditLogs,
    filters,
    pages,
    pageSizes,
    roundOptions,
    filteredCouncils,
    filteredEvaluations,
    councilPagination,
    evaluationPagination,
    emergencyPagination,
    overridePagination,
    evaluationCounts,
    pendingEmergencyCount,
    activeOverrideCount,
    judgingBadgeCount,
    getProjectByIdOrCode,
    getJudgeByEmail,
    getRoundProjects,
    getRoundContext,
    getCouncilSummary,
    setFilter,
    setPage,
    setPageSize,
    saveCouncil,
    deleteCouncil,
    assignRound,
    createEmergency,
    completeEmergency,
    createOverride,
    revokeRecord,
    runLegacyCheck,
  };
});

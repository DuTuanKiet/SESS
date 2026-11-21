export function getRoundProjects(projects, competitionId, roundNumber) {
  const competitionProjects = (projects || []).filter(
    (project) => project.competitionId === competitionId
  );
  const round = Number(roundNumber);
  let roundProjects = competitionProjects.filter((project) => {
    if (round === 1) return project.status !== 'CANCELLED';
    if (round === 2) {
      return /Vòng 2|Vòng 3|Bán kết|Chung kết/i.test(project.currentRound || '');
    }
    if (round === 3) return /Vòng 3|Chung kết/i.test(project.currentRound || '');
    return true;
  });

  if (!roundProjects.length) roundProjects = competitionProjects;
  return roundProjects;
}

export function isDuplicateEvaluation(evaluations, candidate) {
  return (evaluations || []).some(
    (evaluation) =>
      evaluation.competitionId === candidate.competitionId &&
      Number(evaluation.roundNumber) === Number(candidate.roundNumber) &&
      evaluation.projectId === candidate.projectId &&
      evaluation.judgeEmail === candidate.judgeEmail
  );
}

export function summarizeCouncil(council, evaluations, projects) {
  if (!council) return { projects: [], submittedCount: 0, totalCount: 0, averageScore: null };

  const councilEvaluations = (evaluations || []).filter(
    (evaluation) =>
      evaluation.competitionId === council.competitionId &&
      Number(evaluation.roundNumber) === Number(council.roundNumber)
  );
  const projectIds = [...new Set(councilEvaluations.map((evaluation) => evaluation.projectId))];
  const projectRows = projectIds.map((projectId) => {
    const project = (projects || []).find((item) => item.id === projectId);
    const projectEvaluations = councilEvaluations.filter((item) => item.projectId === projectId);
    const scores = projectEvaluations
      .filter((item) => item.score !== null && item.score !== undefined)
      .map((item) => Number(item.score))
      .filter(Number.isFinite);

    return {
      project,
      evaluations: projectEvaluations,
      submittedCount: projectEvaluations.filter((item) => item.status === 'SUBMITTED').length,
      totalCount: projectEvaluations.length,
      averageScore: scores.length
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
        : null,
    };
  });

  const submittedCount = councilEvaluations.filter((item) => item.status === 'SUBMITTED').length;
  const scores = councilEvaluations
    .filter((item) => item.score !== null && item.score !== undefined)
    .map((item) => Number(item.score))
    .filter(Number.isFinite);

  return {
    projects: projectRows,
    submittedCount,
    totalCount: councilEvaluations.length,
    averageScore: scores.length
      ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
      : null,
  };
}

export function buildEvaluationSummary(evaluation, rubric) {
  if (!evaluation || evaluation.status !== 'SUBMITTED') {
    return [];
  }

  const rawScores = Array.isArray(evaluation.scores) ? evaluation.scores : [];
  if (!rawScores.length) {
    return [];
  }

  const scoreMap = new Map(
    rawScores.map((item) => [String(item.criterionId || item.id || ''), item])
  );
  const criteria = rubric?.criteria || [];

  return criteria
    .map((criterion) => {
      const matched = scoreMap.get(String(criterion.id || criterion._id || ''));
      if (!matched || !Number.isFinite(Number(matched.score))) return null;
      const score = Number(matched.score);
      return {
        id: criterion.id || criterion._id,
        name: criterion.name,
        weight: criterion.weight,
        score: Number(score.toFixed(1)),
        weightedScore: Number(((score * Number(criterion.weight || 0)) / 100).toFixed(2)),
        comment: matched.comment || '',
      };
    })
    .filter(Boolean);
}

export function paginateItems(items, page, pageSize) {
  const total = (items || []).length;
  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    items: (items || []).slice(start, start + safePageSize),
  };
}

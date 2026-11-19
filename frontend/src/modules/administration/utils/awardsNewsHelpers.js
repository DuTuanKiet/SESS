export function filterRewardClaims(claims = [], { keyword = '', status = '' } = {}) {
  const kw = String(keyword || '')
    .trim()
    .toLowerCase();
  const statusVal = String(status || '').trim();

  return (claims || []).filter((item) => {
    const matchKw =
      !kw ||
      `${item.projectCode} ${item.submittedBy} ${item.accountNumber} ${item.bankName}`
        .toLowerCase()
        .includes(kw);
    const matchStatus = !statusVal || item.status === statusVal;
    return matchKw && matchStatus;
  });
}

export function getVotingCampaignDisplayStatus(campaign) {
  if (!campaign) return 'DRAFT';
  if (campaign.isPublic) return 'PUBLIC';
  return campaign.status === 'CLOSED' ? 'CLOSED' : 'DRAFT';
}

export function filterVotingCampaigns(
  campaigns = [],
  { keyword = '', status = '', competitionId = '' } = {}
) {
  const kw = String(keyword || '')
    .trim()
    .toLowerCase();
  const statusVal = String(status || '').trim();
  const compVal = String(competitionId || '').trim();

  return (campaigns || []).filter((vc) => {
    const projectCodes = (vc.projects || []).map((p) => p.projectCode).join(' ');
    const matchKw =
      !kw ||
      `${vc.title} ${vc.competitionTitle} ${vc.description || ''} ${projectCodes}`
        .toLowerCase()
        .includes(kw);

    let matchStatus = true;
    if (statusVal === 'PUBLIC') matchStatus = Boolean(vc.isPublic);
    else if (statusVal === 'DRAFT') matchStatus = !vc.isPublic && vc.status !== 'CLOSED';
    else if (statusVal === 'CLOSED') matchStatus = !vc.isPublic && vc.status === 'CLOSED';
    else if (statusVal === 'WATCH') {
      matchStatus = (vc.projects || []).some((p) => p.anomalyStatus === 'WATCH' && !p.isLocked);
    }

    const matchComp = !compVal || vc.competitionId === compVal;
    return matchKw && matchStatus && matchComp;
  });
}

export function computeVotingKpis(campaigns = []) {
  const list = campaigns || [];
  const publicVotes = list.flatMap((vc) => vc.projects || []);

  return {
    totalCampaigns: list.length,
    activeCampaigns: list.filter((vc) => vc.isPublic).length,
    totalVoters: list.reduce((sum, vc) => sum + (Number(vc.totalVoters) || 0), 0),
    total24h: list.reduce((sum, vc) => sum + (Number(vc.votes24h) || 0), 0),
    alertVotes: publicVotes.filter((v) => v.anomalyStatus === 'WATCH' && !v.isLocked).length,
  };
}

/**
 * Xếp hạng và tính phần trăm trên tổng phiếu toàn cuộc bình chọn trước khi lọc từ khóa để giữ đúng thứ hạng #rank.
 */
export function sortAndFilterCampaignProjects(campaign, keyword = '', projectsLookup = []) {
  if (!campaign) {
    return { totalVotes: 0, hasWatch: false, watchCount: 0, rows: [] };
  }

  const projectByCode = new Map(
    (projectsLookup || []).filter((p) => p?.code).map((p) => [p.code, p])
  );
  const allProjects = [...(campaign.projects || [])].sort(
    (a, b) => (Number(b.totalVotes) || 0) - (Number(a.totalVotes) || 0)
  );
  const totalVotes = allProjects.reduce((sum, p) => sum + (Number(p.totalVotes) || 0), 0);
  const watchCount = allProjects.filter(
    (p) => p.anomalyStatus === 'WATCH' && !p.isLocked
  ).length;
  const kw = String(keyword || '')
    .trim()
    .toLowerCase();

  const ranked = allProjects.map((item, idx) => {
    const project = projectByCode.get(item.projectCode) || null;
    const votes = Number(item.totalVotes) || 0;
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return {
      ...item,
      rank: idx + 1,
      percent,
      project,
      projectId: project?.id || '',
      projectTitle: project?.title || item.projectTitle || item.projectCode,
      faculty: project?.faculty || 'Khoa',
      leaderName: project?.leaderInfo?.name || '',
    };
  });

  const rows = kw
    ? ranked.filter((row) =>
        `${row.projectCode} ${row.competitionTitle} ${row.projectTitle} ${row.leaderName}`
          .toLowerCase()
          .includes(kw)
      )
    : ranked;

  return {
    totalVotes,
    hasWatch: watchCount > 0,
    watchCount,
    rows,
  };
}

export function getCampaignProjectCandidates(competitions = [], projects = [], competitionId = '') {
  const comp = (competitions || []).find((c) => c.id === competitionId);
  const matched = (projects || []).filter(
    (p) => p.competitionId === competitionId || (comp && p.competitionTitle === comp.title)
  );
  return matched.length ? matched : (projects || []).slice(0, 5);
}

export function filterNewsItems(newsItems = [], { keyword = '', category = '' } = {}) {
  const kw = String(keyword || '')
    .trim()
    .toLowerCase();
  const catVal = String(category || '').trim();

  return (newsItems || []).filter((item) => {
    const matchKw = !kw || `${item.title} ${item.summary || ''}`.toLowerCase().includes(kw);
    const matchCat = !catVal || item.category === catVal;
    return matchKw && matchCat;
  });
}

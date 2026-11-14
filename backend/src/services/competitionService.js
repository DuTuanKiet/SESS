const EvaluationRound = require('../models/EvaluationRound');
const Project = require('../models/Project');
const ApiError = require('../utils/apiError');

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('vi-VN');
}

function toStatus(round) {
  if (round.status === 'CLOSED' || round.isPublished === false) return 'ended';
  const now = Date.now();
  const open = round.submissionOpenAt ? new Date(round.submissionOpenAt).getTime() : null;
  const close = round.submissionCloseAt ? new Date(round.submissionCloseAt).getTime() : null;
  if (open && now < open) return 'upcoming';
  if (close && now > close) return 'ended';
  return 'ongoing';
}

function toLevel(round) {
  const t = String(round.stageType || 'OTHER').toUpperCase();
  if (t === 'PRELIM') return 'faculty';
  if (t === 'SEMI') return 'university';
  if (t === 'FINAL') return 'ministry';
  return 'university';
}

async function countProjectsForRound(roundId) {
  try {
    return await Project.countDocuments({ evaluationRoundId: roundId });
  } catch {
    return 0;
  }
}

const competitionService = {
  /**
   * GET /api/v1/competitions
   * Danh sách "cuộc thi/đợt đánh giá" đã publish (public) từ EvaluationRound.
   */
  list: async (query = {}) => {
    const filter = { isPublished: true, isActive: true };
    if (query.status) filter.status = query.status;
    if (query.stageType) filter.stageType = query.stageType;

    const rounds = await EvaluationRound.find(filter).sort({ roundNumber: -1, createdAt: -1 }).lean();
    const items = [];
    for (const r of rounds) {
      const teamCount = await countProjectsForRound(r._id);
      items.push({
        id: String(r._id),
        title: r.roundName,
        description: r.description || '',
        status: toStatus(r),
        level: toLevel(r),
        teamCount,
        milestones: {
          proposal: fmtDate(r.submissionOpenAt),
          semifinal: fmtDate(r.submissionCloseAt),
          final: fmtDate(r.scoringCloseAt || r.scoringOpenAt),
        },
        stageType: r.stageType,
        roundNumber: r.roundNumber,
      });
    }
    return items;
  },

  /**
   * GET /api/v1/competitions/stats
   * Thống kê thực tế dựa trên EvaluationRound đã publish.
   */
  getStats: async () => {
    const rounds = await EvaluationRound.find({ isPublished: true, isActive: true }).lean();
    const statuses = rounds.map((r) => toStatus(r));
    const ongoing = statuses.filter((s) => s === 'ongoing').length;
    const upcoming = statuses.filter((s) => s === 'upcoming').length;
    return {
      total: rounds.length,
      ongoing,
      upcoming,
      ended: statuses.filter((s) => s === 'ended').length,
    };
  },

  /**
   * GET /api/v1/competitions/:id
   */
  getById: async (id) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) throw ApiError.notFound('Khong tim thay cuoc thi', 'COMPETITION_NOT_FOUND');
    const r = await EvaluationRound.findOne({ _id: id, isPublished: true, isActive: true }).lean();
    if (!r) throw ApiError.notFound('Khong tim thay cuoc thi', 'COMPETITION_NOT_FOUND');
    const teamCount = await countProjectsForRound(r._id);
    return {
      id: String(r._id),
      title: r.roundName,
      description: r.description || '',
      status: toStatus(r),
      level: toLevel(r),
      teamCount,
      milestones: {
        proposal: fmtDate(r.submissionOpenAt),
        semifinal: fmtDate(r.submissionCloseAt),
        final: fmtDate(r.scoringCloseAt || r.scoringOpenAt),
      },
      stageType: r.stageType,
      roundNumber: r.roundNumber,
    };
  },
};

module.exports = { list: competitionService.list, getStats: competitionService.getStats, getById: competitionService.getById };
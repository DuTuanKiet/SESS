const MentorAssignment = require('../models/MentorAssignment');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { ASSIGNMENT_STATUS } = require('../utils/constants');

async function assertNoJudgeConflictOfInterest({ projectId, judgeId, req, actor, logAudit } = {}) {
  const [project, judge] = await Promise.all([
    Project.findById(projectId).lean(),
    User.findById(judgeId).lean(),
  ]);
  if (!project) throw ApiError.notFound('Khong tim thay du an', 'PROJECT_NOT_FOUND');
  if (!judge) throw ApiError.notFound('Khong tim thay tai khoan giam khao', 'USER_NOT_FOUND');

  const activeMentor = await MentorAssignment.findOne({
    projectId,
    mentorId: judgeId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).lean();

  if (activeMentor) {
    if (typeof logAudit === 'function') {
      await logAudit({
        actor,
        action: 'COI_BLOCKED',
        targetEntity: 'Projects',
        targetId: projectId,
        newValues: { projectId, judgeId, reason: 'ACTIVE_MENTOR_OF_PROJECT' },
        req,
      }).catch(() => {});
    }
    throw ApiError.badRequest(
      'Xung dot loi ich (COI): Giam khao dang la mentor active cua du an nay, khong duoc phan cong cham diem.',
      'JUDGE_CONFLICT_OF_INTEREST',
      { reason: 'ACTIVE_MENTOR_OF_PROJECT', projectId, judgeId }
    );
  }

  // Heuristic: same email as project advisor/contact if present in project metadata (best-effort, non-blocking schema dependency)
  const advisorEmails = [project.advisorEmail, project.mentorEmail, project.ownerAdvisorEmail]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase().trim());
  if (judge.email && advisorEmails.includes(String(judge.email).toLowerCase().trim())) {
    throw ApiError.badRequest(
      'Xung dot loi ich (COI): Giam khao trung voi giang vien huong dan/co van cua du an.',
      'JUDGE_CONFLICT_OF_INTEREST',
      { reason: 'ADVISOR_EMAIL_MATCH', projectId, judgeId }
    );
  }

  return true;
}

module.exports = { assertNoJudgeConflictOfInterest };

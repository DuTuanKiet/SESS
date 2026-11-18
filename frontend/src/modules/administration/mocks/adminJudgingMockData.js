import { createInitialCompetitionsMockState } from '@/modules/administration/mocks/adminCompetitionsMockData';
import { createInitialRubricsMockState } from '@/modules/administration/mocks/adminRubricsMockData';
import { createInitialUsersMockState } from '@/modules/administration/mocks/adminUsersMockData';

/** Tạo một bộ dữ liệu judging gọn, dùng lookup đã có và chỉ giữ một dự án mẫu. */
export function createInitialJudgingMockState() {
  const competitionState = createInitialCompetitionsMockState();
  const userState = createInitialUsersMockState();
  const competition = competitionState.competitions[0];
  const project = competitionState.projects.find((item) => item.competitionId === competition?.id);
  const judges = userState.judges.slice(0, 3);
  const rubric = createInitialRubricsMockState()[0];

  return {
    competitions: competition ? [competition] : [],
    projects: project ? [project] : [],
    judges,
    rubrics: rubric ? [rubric] : [],
    councils: [
      {
        id: 'council-1',
        competitionId: competition?.id || '',
        roundNumber: 1,
        name: 'Hội đồng Giám khảo Vòng 1 — Sơ khảo',
        decisionNumber: '158/QĐ-ĐHKTCN',
        createdAt: '02/11/2026',
        chairEmail: judges[0]?.email || '',
        secretaryEmail: judges[1]?.email || '',
        memberEmails: judges.map((judge) => judge.email),
        status: 'ACTIVE',
        note: 'Đánh giá hồ sơ vòng sơ khảo.',
      },
    ],
    evaluations: [
      {
        id: 'evaluation-1',
        competitionId: competition?.id || '',
        roundNumber: 1,
        projectId: project?.id || '',
        project: project?.code || '',
        judgeEmail: judges[0]?.email || '',
        judge: judges[0]?.name || '',
        rubricId: rubric?.id || '',
        rubric: rubric ? `${rubric.name} v${rubric.version}` : '',
        status: 'SUBMITTED',
        score: 8.2,
      },
      {
        id: 'evaluation-2',
        competitionId: competition?.id || '',
        roundNumber: 1,
        projectId: project?.id || '',
        project: project?.code || '',
        judgeEmail: judges[1]?.email || '',
        judge: judges[1]?.name || '',
        rubricId: rubric?.id || '',
        rubric: rubric ? `${rubric.name} v${rubric.version}` : '',
        status: 'DRAFT',
        score: null,
      },
    ],
    emergencies: [
      {
        id: 'emergency-1',
        competitionId: competition?.id || '',
        roundNumber: 1,
        projectId: project?.id || '',
        project: project?.code || '',
        fromEmail: judges[1]?.email || '',
        toEmail: judges[2]?.email || '',
        from: judges[1]?.name || '',
        to: judges[2]?.name || '',
        reason: 'Giám khảo có lịch công tác đột xuất.',
        date: '11/11/2026',
        status: 'PENDING',
      },
    ],
    overrides: [
      {
        id: 'override-1',
        competitionId: competition?.id || '',
        roundNumber: 1,
        projectId: project?.id || '',
        project: project?.code || '',
        criterion: 'Tổng điểm đánh giá',
        from: 7,
        to: 8,
        reason: 'Đối chiếu biên bản chấm và xác nhận lại tổng điểm.',
        by: 'Nguyễn Văn Quản',
        date: '12/11/2026',
        status: 'ACTIVE',
      },
    ],
    auditLogs: [],
  };
}

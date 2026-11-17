import { BASE_PROJECTS } from '@/modules/administration/mocks/adminCompetitionsMockData';

const BASE_CANCELLATIONS = [
  {
    id: 'cr-1',
    project: 'SESS-2026-005',
    by: 'Phan Thị Yến',
    reason: 'Nhóm không đủ kinh phí chế tạo mẫu thử',
    file: 'bien-ban-hop-nhom.pdf',
    date: '09/11/2026',
    status: 'PENDING',
    reviewNote: '',
  },
  {
    id: 'cr-2',
    project: 'SESS-2026-006',
    by: 'Mai Anh Thư',
    reason: 'Thành viên chuyển trường giữa kỳ',
    file: 'don-xin-huy.pdf',
    date: '08/11/2026',
    status: 'PENDING',
    reviewNote: '',
  },
];

const BASE_CHANGE_REQUESTS = [
  {
    id: 'mc-1',
    project: 'SESS-2026-001',
    type: 'ADD',
    student: 'Nguyễn Bảo Ngọc',
    reason: 'Bổ sung thành viên mảng marketing',
    date: '10/11/2026',
    status: 'PENDING',
    responseReason: '',
  },
  {
    id: 'mc-2',
    project: 'SESS-2026-003',
    type: 'REMOVE',
    student: 'Đặng Văn Lực',
    reason: 'Xin rời nhóm do trùng lịch thực tập',
    date: '11/11/2026',
    status: 'PENDING',
    responseReason: '',
  },
  {
    id: 'mc-3',
    project: 'SESS-2026-002',
    type: 'REMOVE',
    student: 'Võ Hoàng Nam',
    reason: 'Không tham gia hoạt động nhóm',
    date: '11/11/2026',
    status: 'PENDING',
    responseReason: '',
  },
];

export function createInitialProjectsMockState() {
  return structuredClone({
    projects: BASE_PROJECTS,
    cancellations: BASE_CANCELLATIONS,
    changeRequests: BASE_CHANGE_REQUESTS,
  });
}

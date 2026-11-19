import { createInitialCompetitionsMockState } from '@/modules/administration/mocks/adminCompetitionsMockData';

const BASE_REWARD_CLAIMS = [
  {
    id: 'rc1',
    projectCode: 'SESS-2025-014',
    awardRank: 'Giải Nhất',
    prizeAmount: '12.000.000 đ',
    submittedBy: 'Lê Minh Thư',
    bankName: 'Vietcombank CN Cần Thơ',
    accountNumber: '0111000482911',
    accountHolder: 'LE MINH THU',
    taxCode: '8429104821',
    idCardNumber: '092204001829',
    submittedAt: '24/12/2025',
    status: 'PAID',
    note: 'Đã chuyển khoản đợt 1 theo Quyết định 412/QĐ-ĐHKTCN',
  },
  {
    id: 'rc2',
    projectCode: 'SESS-2025-019',
    awardRank: 'Giải Nhì',
    prizeAmount: '7.000.000 đ',
    submittedBy: 'Trần Quốc Huy',
    bankName: 'BIDV Tây Đô',
    accountNumber: '7411000918274',
    accountHolder: 'TRAN QUOC HUY',
    taxCode: '8429109934',
    idCardNumber: '092204003912',
    submittedAt: '25/12/2025',
    status: 'APPROVED',
    note: 'Hồ sơ hợp lệ, chờ phòng Kế hoạch - Tài chính giải ngân',
  },
  {
    id: 'rc3',
    projectCode: 'SESS-2026-004',
    awardRank: 'Đề xuất Giải Nhất (Dự kiến)',
    prizeAmount: '15.000.000 đ',
    submittedBy: 'Lâm Ngọc Trâm',
    bankName: 'ACB Cần Thơ',
    accountNumber: '198420189',
    accountHolder: 'LAM NGOC TRAM',
    taxCode: '',
    idCardNumber: '092305008811',
    submittedAt: '12/11/2026',
    status: 'PENDING',
    note: 'Sinh viên vừa gửi trước hồ sơ ngân hàng để đối chiếu',
  },
];

const BASE_VOTING_CAMPAIGNS = [
  {
    id: 'vc1',
    title: 'Bình chọn Dự án Khởi nghiệp Sáng tạo được Yêu thích nhất 2026',
    competitionId: 'c1',
    competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2026',
    startDate: '01/11/2026 08:00',
    endDate: '25/11/2026 23:59',
    isPublic: true,
    status: 'ACTIVE',
    description:
      'Cổng bình chọn trực tuyến mở cho sinh viên, giảng viên và công chúng bình chọn các ý tưởng khởi nghiệp tiềm năng nhất vòng Sơ khảo.',
    totalVoters: 1105,
    votes24h: 181,
    projects: [
      {
        id: 'pv1',
        projectCode: 'SESS-2026-002',
        competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2026',
        totalVotes: 428,
        votes24h: 34,
        anomalyStatus: 'NORMAL',
        anomalyNote: 'Tăng trưởng bình thường từ sinh viên nội bộ',
        isLocked: false,
      },
      {
        id: 'pv2',
        projectCode: 'SESS-2026-004',
        competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2026',
        totalVotes: 392,
        votes24h: 29,
        anomalyStatus: 'NORMAL',
        anomalyNote: 'Không phát hiện IP trùng lặp bất thường',
        isLocked: false,
      },
      {
        id: 'pv3',
        projectCode: 'SESS-2026-001',
        competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2026',
        totalVotes: 285,
        votes24h: 118,
        anomalyStatus: 'WATCH',
        anomalyNote: 'Ghi nhận 42 lượt vote từ cùng dải IP ký túc xá trong 1 giờ',
        isLocked: false,
      },
    ],
  },
  {
    id: 'vc2',
    title: 'Bình chọn Giải thưởng Công nghệ Số Tiên phong CNTT 2026',
    competitionId: 'c2',
    competitionTitle: 'Tìm kiếm Ý tưởng Công nghệ Số Khoa CNTT 2026',
    startDate: '08/11/2026 09:00',
    endDate: '30/11/2026 17:00',
    isPublic: true,
    status: 'ACTIVE',
    description:
      'Bình chọn đề tài ứng dụng trí tuệ nhân tạo và chuyển đổi số xuất sắc do Khoa CNTT bảo trợ.',
    totalVoters: 489,
    votes24h: 42,
    projects: [
      {
        id: 'pv4',
        projectCode: 'CNTT-2026-002',
        competitionTitle: 'Tìm kiếm Ý tưởng Công nghệ Số Khoa CNTT 2026',
        totalVotes: 325,
        votes24h: 30,
        anomalyStatus: 'NORMAL',
        anomalyNote: 'Bình chọn hợp lệ từ sinh viên CTUT',
        isLocked: false,
      },
      {
        id: 'pv5',
        projectCode: 'CNTT-2026-001',
        competitionTitle: 'Tìm kiếm Ý tưởng Công nghệ Số Khoa CNTT 2026',
        totalVotes: 164,
        votes24h: 12,
        anomalyStatus: 'NORMAL',
        anomalyNote: 'Tăng trưởng ổn định',
        isLocked: false,
      },
    ],
  },
  {
    id: 'vc3',
    title: 'Bình chọn Thiết kế Robot & Giải pháp Tự động hóa Ưu tú',
    competitionId: 'c3',
    competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2025',
    startDate: '22/11/2026 08:00',
    endDate: '15/12/2026 18:00',
    isPublic: false,
    status: 'DRAFT',
    description:
      'Đợt bình chọn video trình diễn và poster kỹ thuật của các đội thi trước thềm vòng chung kết.',
    totalVoters: 0,
    votes24h: 0,
    projects: [
      {
        id: 'pv6',
        projectCode: 'SESS-2026-003',
        competitionTitle: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2025',
        totalVotes: 0,
        votes24h: 0,
        anomalyStatus: 'NORMAL',
        anomalyNote: 'Chưa mở bình chọn',
        isLocked: false,
      },
    ],
  },
];

const BASE_NEWS_ITEMS = [
  {
    id: 'nw1',
    title: 'Phát động Cuộc thi Khởi nghiệp Sáng tạo CTUT năm học 2026–2027',
    category: 'Thông báo',
    publishedAt: '01/11/2026',
    isPinned: true,
    status: 'PUBLISHED',
    summary:
      'Thông báo mở cổng đăng ký đề tài cho toàn thể sinh viên chính quy tất cả các khoa.',
  },
  {
    id: 'nw2',
    title: 'Hướng dẫn quy cách nộp Tài liệu thuyết minh và Poster Vòng Sơ khảo',
    category: 'Thể lệ',
    publishedAt: '04/11/2026',
    isPinned: true,
    status: 'PUBLISHED',
    summary: 'Quy định dung lượng tệp PDF/DOCX <= 10MB, mã biên nhận số và hạn nộp vòng 1.',
  },
  {
    id: 'nw3',
    title: 'Workshop: Hoàn thiện Mô hình kinh doanh (BMC) trước Hội đồng Giám khảo',
    category: 'Sự kiện',
    publishedAt: '09/11/2026',
    isPinned: false,
    status: 'PUBLISHED',
    summary: 'Chương trình tập huấn dành cho 35 nhóm dự án đã vượt qua vòng kiểm tra hồ sơ.',
  },
  {
    id: 'nw4',
    title: 'Dự thảo danh sách đề cử dự án tiêu biểu tham dự SV_STARTUP Khu vực',
    category: 'Vinh danh',
    publishedAt: '12/11/2026',
    isPinned: false,
    status: 'DRAFT',
    summary: 'Bản nháp tổng hợp thành tích các dự án đạt giải cao mùa giải trước và vòng hiện tại.',
  },
];

/**
 * Tạo bộ dữ liệu mock gọn cho Trao giải, Bình chọn & Tin tức, tái sử dụng danh sách cuộc thi & dự án sẵn có.
 */
export function createInitialAwardsNewsMockState() {
  const competitionState = createInitialCompetitionsMockState();

  return structuredClone({
    competitions: competitionState.competitions || [],
    projects: competitionState.projects || [],
    rewardClaims: BASE_REWARD_CLAIMS,
    votingCampaigns: BASE_VOTING_CAMPAIGNS,
    newsItems: BASE_NEWS_ITEMS,
  });
}

import {
  BASE_EVIDENCE_TYPES,
  BASE_FACULTIES,
  BASE_PROJECT_CATEGORIES,
} from '@/modules/administration/mocks/adminCatalogsMockData';

export function buildSvgBannerDataUri(
  startHex,
  endHex,
  accentHex,
  patternLabel = 'SESS CTUT'
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${startHex}"/>
        <stop offset="100%" stop-color="${endHex}"/>
      </linearGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="260" fill="url(#g)"/>
    <rect width="800" height="260" fill="url(#grid)"/>
    <circle cx="690" cy="40" r="140" fill="${accentHex}" fill-opacity="0.22"/>
    <circle cx="740" cy="210" r="95" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="110" cy="220" r="110" fill="${accentHex}" fill-opacity="0.14"/>
    <text x="760" y="232" text-anchor="end" fill="#ffffff" fill-opacity="0.18" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="3">${patternLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const BANNER_PRESETS = [
  {
    key: 'navy',
    label: 'Xanh CTUT',
    url: buildSvgBannerDataUri('#0B1F4B', '#1E56D9', '#60A5FA', 'SESS CTUT'),
  },
  {
    key: 'indigo',
    label: 'Công nghệ & AI',
    url: buildSvgBannerDataUri('#1E1B4B', '#2563EB', '#38BDF8', 'TECH & AI'),
  },
  {
    key: 'emerald',
    label: 'Khởi nghiệp Xanh',
    url: buildSvgBannerDataUri('#064E3B', '#0D9488', '#34D399', 'INNOVATION'),
  },
  {
    key: 'slate',
    label: 'Lưu trữ',
    url: buildSvgBannerDataUri('#0F172A', '#334155', '#94A3B8', 'ARCHIVE'),
  },
];

const BASE_RUBRICS = [
  { id: 'r1', name: 'Tiêu chí Vòng Sơ khảo', version: 2, status: 'Active' },
  { id: 'r2', name: 'Tiêu chí Vòng Chung kết', version: 1, status: 'Draft' },
  { id: 'r3', name: 'Tiêu chí Vòng Sơ khảo', version: 1, status: 'Deprecated' },
];

const BASE_COMPETITIONS = [
  {
    id: 'c1',
    code: 'CTUT-STARTUP-2026',
    title: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2026',
    level: 'UNIVERSITY',
    hostFaculty: '',
    participatingFaculties: [
      'Công nghệ thông tin',
      'Kinh tế',
      'Kỹ thuật cơ khí',
      'Điện - Điện tử',
      'Công nghệ hóa học',
    ],
    bannerTheme: 'navy',
    bannerUrl: BANNER_PRESETS[0].url,
    academicYear: '2026–2027',
    organizer: 'Đoàn Thanh niên & Trung tâm Khởi nghiệp CTUT',
    location: 'Hội trường Khu A CTUT & Cổng trực tuyến SESS',
    maxTeamMembers: 5,
    estimatedPrizePool: '46.000.000 đ',
    startDate: '01/10/2026',
    endDate: '20/12/2026',
    registrationDeadline: '15/11/2026',
    projectCount: 6,
    guidelineFile: '158-TB-DHKTCN-CTUT-Startup-2026.pdf',
    guidelineFileData: '',
    guidelineFileSize: '',
    description:
      'Sân chơi học thuật thường niên tìm kiếm và ươm tạo các ý tưởng, dự án khởi nghiệp sáng tạo gắn với chuyển đổi số và phát triển bền vững vùng ĐBSCL.',
    status: 'ACTIVE',
    rounds: [
      {
        id: 'c1-r1',
        roundNumber: 1,
        roundName: 'Vòng 1 — Sơ khảo ý tưởng',
        stageType: 'PRELIM',
        opensAt: '01/10/2026',
        closesAt: '20/11/2026',
        scoringOpensAt: '21/11/2026',
        scoringClosesAt: '25/11/2026',
        rubricName: 'Tiêu chí Vòng Sơ khảo v2',
        requiredEvidenceCodes: ['proposalDoc', 'reportFile'],
        requiredDocs: 'Tài liệu thuyết minh đề tài, Báo cáo dự án hoàn chỉnh',
        description: 'Thẩm định tính mới, tính khả thi và định hướng thị trường của ý tưởng.',
        status: 'OPEN',
      },
      {
        id: 'c1-r2',
        roundNumber: 2,
        roundName: 'Vòng 2 — Bán kết & Sản phẩm mẫu',
        stageType: 'SEMI',
        opensAt: '22/11/2026',
        closesAt: '08/12/2026',
        scoringOpensAt: '09/12/2026',
        scoringClosesAt: '12/12/2026',
        rubricName: 'Tiêu chí Vòng Chung kết v1',
        requiredEvidenceCodes: ['reportFile', 'pitchDeck', 'demoVideo'],
        requiredDocs: 'Báo cáo dự án hoàn chỉnh, Slide trình bày (Pitch Deck), Video demo',
        description: 'Đánh giá nguyên mẫu MVP và minh chứng khảo sát khách hàng thực tế.',
        status: 'UPCOMING',
      },
      {
        id: 'c1-r3',
        roundNumber: 3,
        roundName: 'Vòng 3 — Chung kết Pitching',
        stageType: 'FINAL',
        opensAt: '18/12/2026',
        closesAt: '20/12/2026',
        scoringOpensAt: '20/12/2026',
        scoringClosesAt: '20/12/2026',
        rubricName: 'Tiêu chí Vòng Chung kết v1',
        requiredEvidenceCodes: ['pitchDeck', 'poster', 'productImages'],
        requiredDocs: 'Slide trình bày (Pitch Deck), Poster dự án (A0/A1), Hình ảnh sản phẩm',
        description: 'Bảo vệ trực tiếp trước Hội đồng Giám khảo và đại diện doanh nghiệp.',
        status: 'UPCOMING',
      },
    ],
    awards: [
      {
        id: 'c1-a1',
        rank: 'Giải Nhất',
        quantity: 1,
        cashAmount: '15.000.000 đ',
        perk: 'Giấy khen Hiệu trưởng & Đề cử thi cấp Khu vực',
      },
      {
        id: 'c1-a2',
        rank: 'Giải Nhì',
        quantity: 2,
        cashAmount: '8.000.000 đ',
        perk: 'Giấy khen Hiệu trưởng & Gói ươm tạo doanh nghiệp',
      },
      {
        id: 'c1-a3',
        rank: 'Giải Ba',
        quantity: 3,
        cashAmount: '5.000.000 đ',
        perk: 'Giấy chứng nhận & Hỗ trợ cố vấn chuyên sâu',
      },
    ],
  },
  {
    id: 'c2',
    code: 'CNTT-IDEA-2026',
    title: 'Tìm kiếm Ý tưởng Công nghệ Số Khoa CNTT 2026',
    level: 'FACULTY',
    hostFaculty: 'Công nghệ thông tin',
    participatingFaculties: ['Công nghệ thông tin', 'Điện - Điện tử'],
    bannerTheme: 'indigo',
    bannerUrl: BANNER_PRESETS[1].url,
    academicYear: '2026–2027',
    organizer: 'Khoa Công nghệ thông tin',
    location: 'Phòng Lab Công nghệ số Tòa C & GitHub Classroom',
    maxTeamMembers: 4,
    estimatedPrizePool: '6.000.000 đ',
    startDate: '01/12/2026',
    endDate: '25/01/2027',
    registrationDeadline: '20/12/2026',
    projectCount: 2,
    guidelineFile: 'the-le-cntt-idea-2026.pdf',
    guidelineFileData: '',
    guidelineFileSize: '',
    description:
      'Cuộc thi cấp Khoa tuyển chọn các giải pháp AI, IoT và phần mềm ứng dụng phục vụ nông nghiệp thông minh và đô thị số.',
    status: 'UPCOMING',
    rounds: [
      {
        id: 'c2-r1',
        roundNumber: 1,
        roundName: 'Vòng Sơ duyệt cấp Khoa',
        stageType: 'PRELIM',
        opensAt: '21/12/2026',
        closesAt: '10/01/2027',
        scoringOpensAt: '11/01/2027',
        scoringClosesAt: '18/01/2027',
        rubricName: 'Tiêu chí Vòng Sơ khảo v2',
        requiredEvidenceCodes: ['proposalDoc', 'sourceCode', 'demoVideo'],
        requiredDocs: 'Tài liệu thuyết minh đề tài, Mã nguồn / Kho lưu trữ kỹ thuật, Video demo',
        description: 'Đánh giá kiến trúc kỹ thuật, mã nguồn và demo trực tiếp sản phẩm.',
        status: 'UPCOMING',
      },
    ],
    awards: [
      {
        id: 'c2-a1',
        rank: 'Giải Xuất sắc',
        quantity: 1,
        cashAmount: '6.000.000 đ',
        perk: 'Đặc cách vào Bán kết cấp Trường',
      },
    ],
  },
  {
    id: 'c3',
    code: 'CTUT-STARTUP-2025',
    title: 'Cuộc thi Ý tưởng Khởi nghiệp Sinh viên CTUT 2025',
    level: 'UNIVERSITY',
    hostFaculty: '',
    participatingFaculties: [
      'Công nghệ thông tin',
      'Kinh tế',
      'Kỹ thuật cơ khí',
      'Điện - Điện tử',
      'Công nghệ hóa học',
    ],
    bannerTheme: 'slate',
    bannerUrl: BANNER_PRESETS[3].url,
    academicYear: '2025–2026',
    organizer: 'Trường Đại học Kỹ thuật - Công nghệ Cần Thơ',
    location: 'Hội trường Khu A CTUT',
    maxTeamMembers: 5,
    estimatedPrizePool: '26.000.000 đ',
    startDate: '15/09/2025',
    endDate: '22/12/2025',
    registrationDeadline: '30/10/2025',
    projectCount: 2,
    guidelineFile: '158-TB-DHKTCN-CTUTSTARTUP2025.pdf',
    guidelineFileData: '',
    guidelineFileSize: '',
    description:
      'Mùa giải năm học 2025–2026 đã hoàn tất chấm chung kết, trao giải và lưu trữ hồ sơ dự án.',
    status: 'CLOSED',
    rounds: [
      {
        id: 'c3-r1',
        roundNumber: 1,
        roundName: 'Vòng 1 — Sơ khảo ý tưởng',
        stageType: 'PRELIM',
        opensAt: '01/11/2025',
        closesAt: '15/11/2025',
        scoringOpensAt: '16/11/2025',
        scoringClosesAt: '22/11/2025',
        rubricName: 'Tiêu chí Vòng Sơ khảo v1',
        requiredEvidenceCodes: ['proposalDoc'],
        requiredDocs: 'Tài liệu thuyết minh đề tài',
        description: 'Sơ duyệt đề xuất ý tưởng toàn trường.',
        status: 'CLOSED',
      },
      {
        id: 'c3-r2',
        roundNumber: 2,
        roundName: 'Vòng 2 — Chung kết cấp Trường',
        stageType: 'FINAL',
        opensAt: '15/12/2025',
        closesAt: '20/12/2025',
        scoringOpensAt: '20/12/2025',
        scoringClosesAt: '21/12/2025',
        rubricName: 'Tiêu chí Vòng Chung kết v1',
        requiredEvidenceCodes: ['reportFile', 'pitchDeck'],
        requiredDocs: 'Báo cáo dự án hoàn chỉnh, Slide trình bày (Pitch Deck)',
        description: 'Chung kết xếp hạng và xét đề cử SV_STARTUP.',
        status: 'CLOSED',
      },
    ],
    awards: [
      {
        id: 'c3-a1',
        rank: 'Giải Nhất',
        quantity: 1,
        cashAmount: '12.000.000 đ',
        perk: 'Đề cử SV_STARTUP Quốc gia',
      },
      {
        id: 'c3-a2',
        rank: 'Giải Nhì',
        quantity: 2,
        cashAmount: '7.000.000 đ',
        perk: 'Giấy khen Hiệu trưởng',
      },
    ],
  },
];

export const BASE_PROJECTS = [
  {
    id: 'p1',
    competitionId: 'c1',
    code: 'SESS-2026-001',
    title: 'Nền tảng kết nối nông sản sạch ĐBSCL',
    category: 'Nông nghiệp công nghệ cao',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'SUBMITTED',
    currentRound: 'Vòng 1 — Sơ khảo ý tưởng',
    submittedAt: '11/11/2026 15:40',
    ms: [1, 4],
    leaderInfo: {
      name: 'Trần Minh Khoa',
      studentId: '2311001',
      className: 'KTPM K23A',
      email: '2311001@student.ctuet.edu.vn',
      phone: '0912345001',
    },
    advisorInfo: null,
    members: ['Trần Minh Khoa (Trưởng nhóm)', 'Lê Thu Hà', 'Phạm Quốc Bảo'],
    objectives:
      'Xây dựng sàn B2B2C kết nối trực tiếp hợp tác xã vùng ĐBSCL với bếp ăn trường học và chuỗi cửa hàng nông sản sạch tại Cần Thơ, giảm tối thiểu 2 khâu trung gian.',
    abstract:
      'Hệ thống hỗ trợ truy xuất nguồn gốc qua mã QR, quản lý lô thu hoạch theo mùa vụ và đặt hàng định kỳ minh bạch giá tại vườn cho nông hộ.',
    problemStatement:
      'Nông dân ĐBSCL thường bị ép giá vào cao điểm thu hoạch do thiếu đầu ra ổn định, trong khi người tiêu dùng đô thị khó kiểm chứng nhật ký canh tác VietGAP.',
    solution:
      'Ứng dụng web & mobile tích hợp QR truy xuất nguồn gốc, dự báo sản lượng theo vùng trồng và điều phối gom đơn liên tuyến Cần Thơ – Hậu Giang – Vĩnh Long.',
    businessModel:
      'Thu phí giao dịch 3,5% trên đơn hàng B2B thành công và gói phần mềm quản lý mùa vụ 199.000 đ/tháng cho hợp tác xã quy mô trên 20 hộ.',
    attachmentUrl: {
      name: 'Thuyet-minh-SESS-2026-001.pdf',
      format: 'PDF',
      sizeText: '3.4 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-001-proposal.pdf',
    },
    milestones: [
      {
        title: 'Khảo sát 15 hợp tác xã & Phỏng vấn khách hàng',
        dueDate: '10/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'bien-ban-khao-sat-htx.pdf',
          note: 'Đã khảo sát 15/15 HTX tại Phong Điền và Bình Thủy',
        },
      },
      {
        title: 'Hoàn thiện nguyên mẫu giao diện (Figma) & Luồng QR',
        dueDate: '22/11/2026',
        status: 'IN_PROGRESS',
        evidence: null,
      },
    ],
    submissionRounds: {
      roundName: 'Vòng 1 — Sơ khảo ý tưởng',
      receiptHash: 'SESS-RC-2026-9A84F2',
      submittedAt: '11/11/2026 15:40',
      items: {
        reportFile: { name: 'Bao-cao-SESS-2026-001.docx', sizeText: '4.2 MB' },
        poster: { name: 'Poster-A1-NongSanDBSCl.pdf', sizeText: '8.7 MB' },
        pitchDeck: { name: 'PitchDeck-SESS-2026-001.pdf', sizeText: '6.1 MB' },
        demoVideo: null,
      },
    },
  },
  {
    id: 'p2',
    competitionId: 'c1',
    code: 'SESS-2026-002',
    title: 'Ứng dụng AI nhận diện bệnh lúa',
    category: 'Công nghệ thông tin & AI',
    faculty: 'Kỹ thuật cơ khí',
    level: 'FACULTY',
    status: 'UNDER_MENTORSHIP',
    currentRound: 'Vòng 1 — Sơ khảo ý tưởng',
    submittedAt: '08/11/2026 09:30',
    ms: [2, 5],
    needsAdminReview: true,
    leaderInfo: {
      name: 'Ngô Thanh Tâm',
      studentId: '2311033',
      className: 'CKĐT K23A',
      email: '2311033@student.ctuet.edu.vn',
      phone: '0912345033',
    },
    advisorInfo: {
      name: 'TS. Lê Văn Hùng',
      email: 'lvhung@ctuet.edu.vn',
      unit: 'Khoa CNTT',
      phone: '0907112233',
    },
    members: ['Ngô Thanh Tâm (Trưởng nhóm)', 'Võ Hoàng Nam'],
    objectives:
      'Phát hiện sớm 5 loại bệnh phổ biến trên lá lúa (đạo ôn, bạc lá, khô vằn, đốm nâu, rầy nâu) trực tiếp qua camera điện thoại ngay tại ruộng không cần mạng Internet.',
    abstract:
      'Sử dụng mô hình Computer Vision tối ưu hóa (MobileNetV3) chạy offline trên Android kèm khuyến cáo liều lượng xử lý theo chuẩn Viện Lúa ĐBSCL.',
    problemStatement:
      'Nông dân thường phát hiện bệnh trễ hoặc phun thuốc theo cảm tính gây tốn chi phí 18–25% và tồn dư hóa chất.',
    solution:
      'Thu thập bộ ảnh 12.000 mẫu lá lúa tại Ô Môn & Thới Lai, nén mô hình xuống dưới 28MB để suy luận trong 0.4 giây trên smartphone phổ thông.',
    businessModel:
      'Cung cấp miễn phí cho hộ cá thể; thu phí API tích hợp & bản đồ dịch hại theo thời gian thực cho doanh nghiệp vật tư nông nghiệp.',
    attachmentUrl: {
      name: 'Thuyet-minh-AI-Benh-Lua.pdf',
      format: 'PDF',
      sizeText: '5.1 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-002-proposal.pdf',
    },
    milestones: [
      {
        title: 'Thu thập & gán nhãn 12.000 ảnh bệnh lá lúa',
        dueDate: '05/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'bao-cao-dataset-v1.pdf',
          note: 'Độ chính xác F1-score đạt 91.4% trên tập kiểm thử',
        },
      },
      {
        title: 'Huấn luyện mô hình MobileNetV3 & Đóng gói APK',
        dueDate: '18/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'demo-app-android-v1.mp4',
          note: 'Kiểm thử thực tế ngoài đồng tại Cờ Đỏ',
        },
      },
    ],
    submissionRounds: {
      roundName: 'Vòng 1 — Sơ khảo ý tưởng',
      receiptHash: 'SESS-RC-2026-7C31D9',
      submittedAt: '08/11/2026 09:30',
      items: {
        reportFile: { name: 'Bao-cao-ky-thuat-RiceAI.pdf', sizeText: '6.8 MB' },
        poster: { name: 'Poster-RiceAI-A0.png', sizeText: '11.2 MB' },
        pitchDeck: { name: 'Slide-RiceAI-V1.pptx', sizeText: '9.4 MB' },
        demoVideo: { name: 'Video-Demo-RiceAI.mp4', sizeText: '42.5 MB' },
      },
    },
  },
  {
    id: 'p3',
    competitionId: 'c1',
    code: 'SESS-2026-003',
    title: 'Hệ thống quản lý nhà trọ thông minh',
    category: 'Tự động hóa & IoT',
    faculty: 'Công nghệ thông tin',
    level: 'UNIVERSITY',
    status: 'IN_REVIEW',
    currentRound: 'Vòng 2 — Bán kết',
    submittedAt: '10/11/2026 20:15',
    ms: [2, 4],
    leaderInfo: {
      name: 'Huỳnh Gia Hân',
      studentId: '2311082',
      className: 'HTTT K23A',
      email: '2311082@student.ctuet.edu.vn',
      phone: '0912345082',
    },
    advisorInfo: null,
    members: ['Huỳnh Gia Hân (Trưởng nhóm)', 'Đặng Văn Lực'],
    objectives:
      'Số hóa hoàn toàn quy trình ghi chỉ số điện nước, tạm trú VNeID và thanh toán hóa đơn tự động qua VietQR cho chủ nhà trọ quy mô 10–100 phòng.',
    abstract:
      'Kết hợp thiết bị đọc công tơ IoT giá rẻ (ESP32) và cổng quản lý SaaS giúp chủ trọ đối soát hóa đơn, cảnh báo sự cố điện và nhắc đóng tiền tự động.',
    problemStatement:
      'Chủ nhà trọ gần khu đại học tại Cần Thơ vẫn ghi sổ tay, dễ sai lệch chỉ số điện nước và tốn 4–6 giờ tổng hợp cuối tháng.',
    solution:
      'Cảm biến xung kWh/m³ gắn ngoài không cắt dây điện hiện hữu, đồng bộ lên dashboard và gửi phiếu thu QR tự động qua Zalo OA.',
    businessModel:
      'Thuê bao 12.000 đ/phòng/tháng (tối thiểu 150.000 đ/khu trọ) + bán bộ kit IoT đọc công tơ giá 450.000 đ/cụm 4 phòng.',
    attachmentUrl: {
      name: 'Ho-so-thuyet-minh-SmartStay.pdf',
      format: 'PDF',
      sizeText: '2.9 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-003-proposal.pdf',
    },
    milestones: [
      {
        title: 'Thử nghiệm phần cứng ESP32 tại 12 phòng trọ Ninh Kiều',
        dueDate: '09/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'nhat-ky-thu-nghiem-esp32.pdf',
          note: 'Sai số đo dưới 0.8% so với công tơ chuẩn',
        },
      },
    ],
    submissionRounds: {
      roundName: 'Vòng 1 — Sơ khảo ý tưởng',
      receiptHash: 'SESS-RC-2026-4E19A1',
      submittedAt: '10/11/2026 20:15',
      items: {
        reportFile: { name: 'Bao-cao-SmartStay-v2.pdf', sizeText: '5.5 MB' },
        poster: { name: 'Poster-SmartStay.pdf', sizeText: '7.4 MB' },
        pitchDeck: null,
        demoVideo: null,
      },
    },
  },
  {
    id: 'p4',
    competitionId: 'c1',
    code: 'SESS-2026-004',
    title: 'Bao bì sinh học từ vỏ trấu',
    category: 'Năng lượng & Môi trường',
    faculty: 'Công nghệ hóa học',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    currentRound: 'Vòng 3 — Chung kết cấp Trường',
    submittedAt: '12/11/2026 11:00',
    ms: [6, 6],
    leaderInfo: {
      name: 'Lâm Ngọc Trâm',
      studentId: '2311156',
      className: 'CNHH K23A',
      email: '2311156@student.ctuet.edu.vn',
      phone: '0912345156',
    },
    advisorInfo: {
      name: 'ThS. Phạm Thị Lan',
      email: 'ptlan@ctuet.edu.vn',
      unit: 'Khoa Công nghệ hóa học',
      phone: '0909667788',
    },
    members: ['Lâm Ngọc Trâm (Trưởng nhóm)', 'Châu Minh Đức'],
    objectives:
      'Tái chế phụ phẩm vỏ trấu tại các nhà máy xay xát ở Thốt Nốt thành khay, hộp đựng thực phẩm phân hủy sinh học hoàn toàn trong 45 ngày.',
    abstract:
      'Quy trình ép nhiệt cellulose vỏ trấu kết hợp chất kết dính tinh bột biến tính đạt tiêu chuẩn an toàn tiếp xúc thực phẩm QCVN 12-1.',
    problemStatement:
      'Mỗi năm ĐBSCL thải ra hàng triệu tấn trấu trong khi hộp xốp EPS gây ô nhiễm nghiêm trọng và khó phân hủy.',
    solution:
      'Công thức phối trộn 75% bột trấu xử lý kiềm nhẹ + 25% keo tinh bột sắn chống thấm dầu mỡ ở 95°C trong 4 giờ.',
    businessModel:
      'Cung cấp sỉ khay hộp cho chuỗi F&B và siêu thị xanh với giá 1.650 đ/hộp, biên lợi nhuận gộp ước tính 28%.',
    attachmentUrl: {
      name: 'Thuyet-minh-RiceHuskPack-Final.pdf',
      format: 'PDF',
      sizeText: '7.6 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-004-proposal.pdf',
    },
    milestones: [
      {
        title: 'Kiểm định an toàn vệ sinh thực phẩm tại Quatest 2',
        dueDate: '01/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'phieu-kiem-dinh-quatest.pdf',
          note: 'Đạt chuẩn không thôi nhiễm kim loại nặng',
        },
      },
      {
        title: 'Ký biên bản thử nghiệm 2.000 hộp với chuỗi Bếp Xanh',
        dueDate: '10/11/2026',
        status: 'COMPLETED',
        evidence: {
          fileName: 'mou-bep-xanh-ct.pdf',
          note: 'Đơn đặt hàng thử nghiệm 2.000 hộp/tháng',
        },
      },
    ],
    submissionRounds: {
      roundName: 'Vòng 3 — Chung kết cấp Trường',
      receiptHash: 'SESS-RC-2026-8B50C4',
      submittedAt: '12/11/2026 11:00',
      items: {
        reportFile: { name: 'Bao-cao-hoan-chinh-RiceHuskPack.pdf', sizeText: '8.9 MB' },
        poster: { name: 'Poster-ChungKet-RiceHuskPack.pdf', sizeText: '12.4 MB' },
        pitchDeck: { name: 'PitchDeck-RiceHuskPack-CK.pdf', sizeText: '14.2 MB' },
        demoVideo: { name: 'Quy-trinh-ep-khuon-RiceHusk.mp4', sizeText: '86.0 MB' },
      },
    },
  },
  {
    id: 'p5',
    competitionId: 'c1',
    code: 'SESS-2026-005',
    title: 'Trạm sạc xe điện năng lượng mặt trời',
    category: 'Năng lượng & Môi trường',
    faculty: 'Điện - Điện tử',
    level: 'FACULTY',
    status: 'NEED_REVISION',
    currentRound: 'Vòng 1 — Sơ khảo ý tưởng',
    submittedAt: '06/11/2026 16:45',
    ms: [1, 3],
    leaderInfo: {
      name: 'Phan Thị Yến',
      studentId: '2311104',
      className: 'ĐĐT K23A',
      email: '2311104@student.ctuet.edu.vn',
      phone: '0912345104',
    },
    advisorInfo: null,
    members: ['Phan Thị Yến (Trưởng nhóm)', 'Tô Hữu Phước'],
    objectives:
      'Thiết kế tủ sạc thông minh dùng pin mặt trời áp mái phục vụ sinh viên đi xe đạp điện, xe máy điện tại bãi giữ xe khuôn viên trường.',
    abstract:
      'Tích hợp bộ điều khiển sạc MPPT, khóa ngăn sạc bằng thẻ sinh viên và giám sát công suất tiêu thụ theo ngày.',
    problemStatement:
      'Sinh viên sử dụng xe điện ngày càng tăng nhưng bãi xe thiếu điểm sạc an toàn chống quá tải cháy nổ.',
    solution:
      'Hệ thống hybrid 2kWp nối pin lưu trữ LiFePO4 48V, tự ngắt khi đầy và cảnh báo nhiệt độ từng ổ cắm.',
    businessModel:
      'Mô hình chia sẻ doanh thu 70/30 với ban quản lý bãi xe, phí sạc 3.000 đ/lượt thanh toán QR.',
    attachmentUrl: {
      name: 'Thuyet-minh-SolarCharge-v1.docx',
      format: 'DOCX',
      sizeText: '2.1 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-005-proposal.docx',
    },
    milestones: [
      {
        title: 'Bổ sung sơ đồ nguyên lý & dự toán chi tiết theo yêu cầu duyệt',
        dueDate: '16/11/2026',
        status: 'IN_PROGRESS',
        evidence: {
          fileName: 'du-toan-ban-nhap.xlsx',
          note: 'Cần bổ sung bảng tính thời gian hoàn vốn',
        },
      },
    ],
  },
  {
    id: 'p6',
    competitionId: 'c1',
    code: 'SESS-2026-006',
    title: 'Du lịch cộng đồng số hóa Cần Thơ',
    category: 'Giáo dục số & Du lịch thông minh',
    faculty: 'Kinh tế',
    level: 'FACULTY',
    status: 'REJECTED',
    currentRound: 'Vòng 1 — Sơ khảo ý tưởng',
    submittedAt: '05/11/2026 10:10',
    ms: [1, 4],
    leaderInfo: {
      name: 'Mai Anh Thư',
      studentId: '2311129',
      className: 'QTKD K23B',
      email: '2311129@student.ctuet.edu.vn',
      phone: '0912345129',
    },
    advisorInfo: null,
    members: ['Mai Anh Thư (Trưởng nhóm)'],
    objectives:
      'Số hóa bản đồ trải nghiệm Cồn Sơn – Chợ nổi Cái Răng bằng hướng dẫn âm thanh đa ngôn ngữ.',
    abstract:
      'Nền tảng đặt tour ngắn ngày kết hợp thuyết minh audio GPS cho khách du lịch tự túc.',
    problemStatement:
      'Thiếu thông tin giá niêm yết và lịch ghe tàu rõ ràng khiến khách tự túc dễ gặp chèo kéo.',
    solution:
      'Ứng dụng web progressive hiển thị giá chuẩn của hợp tác xã du lịch và âm thanh tự động theo vị trí.',
    businessModel: 'Hoa hồng 8% từ tour đặt trước trên hệ thống.',
    attachmentUrl: {
      name: 'Thuyet-minh-CanThoTour.pdf',
      format: 'PDF',
      sizeText: '1.8 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2026-006-proposal.pdf',
    },
  },
  {
    id: 'p7',
    competitionId: 'c2',
    code: 'CNTT-2026-001',
    title: 'Hệ thống tưới tiêu IoT cho vườn cây ăn trái Cần Thơ',
    category: 'Tự động hóa & IoT',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'DRAFT',
    currentRound: 'Vòng Sơ duyệt cấp Khoa',
    submittedAt: '12/11/2026 08:20',
    ms: [0, 3],
    leaderInfo: {
      name: 'Nguyễn Hoàng Minh',
      studentId: '2311178',
      className: 'KTPM K23A',
      email: '2311178@student.ctuet.edu.vn',
      phone: '0912345178',
    },
    advisorInfo: null,
    members: ['Nguyễn Hoàng Minh (Trưởng nhóm)', 'Lê Tấn Phát'],
    objectives:
      'Tự động hóa đóng/mở van tưới dựa trên cảm biến độ ẩm đất và độ mặn nước kênh rạch vùng Phong Điền.',
    abstract:
      'Cụm cảm biến LoRaWAN truyền xa 2km không cần Wi-Fi, đóng ngắt máy bơm theo ngưỡng cài đặt qua app.',
    problemStatement:
      'Xâm nhập mặn mùa khô gây hại rễ sầu riêng nếu bơm nước không kiểm tra độ mặn kịp thời.',
    solution:
      'Node đo EC/pH tự động khóa van cấp khi độ mặn vượt 1‰ và gửi cảnh báo về điện thoại chủ vườn.',
    businessModel:
      'Bán trọn bộ 1 gateway + 4 node cảm biến giá 4,2 triệu đồng kèm bảo trì 12 tháng.',
    attachmentUrl: {
      name: 'De-cuong-CNTT-2026-001.pdf',
      format: 'PDF',
      sizeText: '2.4 MB',
      url: 'https://drive.ctut.edu.vn/sess/CNTT-2026-001.pdf',
    },
  },
  {
    id: 'p8',
    competitionId: 'c2',
    code: 'CNTT-2026-002',
    title: 'Trợ lý tra cứu học vụ CTUT bằng LLM',
    category: 'Công nghệ thông tin & AI',
    faculty: 'Công nghệ thông tin',
    level: 'FACULTY',
    status: 'APPROVED',
    currentRound: 'Vòng Sơ duyệt cấp Khoa',
    submittedAt: '11/11/2026 19:00',
    ms: [2, 3],
    leaderInfo: {
      name: 'Võ Minh Khôi',
      studentId: '2311215',
      className: 'KTPM K23B',
      email: '2311215@student.ctuet.edu.vn',
      phone: '0912345215',
    },
    advisorInfo: {
      name: 'ThS. Nguyễn Thị Mai',
      email: 'ntmai@ctuet.edu.vn',
      unit: 'Khoa Kinh tế',
      phone: '0908445566',
    },
    members: ['Võ Minh Khôi (Trưởng nhóm)', 'Trần Gia Bảo'],
    objectives:
      'Giúp sinh viên tra cứu quy chế đào tạo, học bổng, điều kiện tốt nghiệp bằng ngôn ngữ tự nhiên kèm trích dẫn văn bản gốc.',
    abstract:
      'Pipeline RAG lập chỉ mục quy chế CTUT từ PDF chính thức, kiểm soát ngưỡng tương đồng tránh suy diễn sai lệch.',
    problemStatement:
      'Sinh viên thường mất thời gian tìm đúng điều khoản trong hàng chục văn bản PDF ban hành qua các năm.',
    solution:
      'Vector search + trích dẫn số hiệu quyết định và trang tài liệu chính xác khi phản hồi.',
    businessModel:
      'Triển khai nội bộ trường học theo gói tài trợ chuyển đổi số và mở rộng sang các trường ĐH khu vực ĐBSCL.',
    attachmentUrl: {
      name: 'Thuyet-minh-CTUT-RAG.pdf',
      format: 'PDF',
      sizeText: '3.9 MB',
      url: 'https://drive.ctut.edu.vn/sess/CNTT-2026-002.pdf',
    },
  },
  {
    id: 'p9',
    competitionId: 'c3',
    code: 'SESS-2025-014',
    title: 'Giải pháp lọc nước nhiễm mặn bằng vật liệu biochar',
    category: 'Năng lượng & Môi trường',
    faculty: 'Công nghệ hóa học',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    currentRound: 'Đã trao giải (Giải Nhất 2025)',
    submittedAt: '18/12/2025 14:00',
    ms: [6, 6],
    leaderInfo: {
      name: 'Lê Minh Thư',
      studentId: '2211044',
      className: 'CNHH K22A',
      email: '2211044@student.ctuet.edu.vn',
      phone: '0912345844',
    },
    advisorInfo: {
      name: 'ThS. Lê Thu Thảo',
      email: 'ltthao@ctuet.edu.vn',
      unit: 'Khoa Công nghệ hóa học',
      phone: '0903221144',
    },
    members: ['Lê Minh Thư (Trưởng nhóm)', 'Nguyễn Thành Đạt'],
    objectives:
      'Chế tạo lõi lọc sinh hoạt từ than sinh học gáo dừa và rơm rạ hoạt hóa giúp giảm độ mặn nhẹ và kim loại nặng.',
    abstract:
      'Hệ thống lọc 3 cấp chi phí thấp lắp đặt trực tiếp cho hộ gia đình vùng ven biển Sóc Trăng – Bạc Liêu.',
    problemStatement:
      'Hạn mặn kéo dài khiến hộ nghèo thiếu nước ngọt sinh hoạt an toàn với chi phí máy lọc RO quá cao.',
    solution:
      'Vật liệu biochar biến tính tái sinh được bằng nước ấm kết hợp màng lọc UF.',
    businessModel:
      'Cung cấp thiết bị lọc 850.000 đ/bộ và dịch vụ thay lõi định kỳ 6 tháng giá 120.000 đ.',
    attachmentUrl: {
      name: 'Ho-so-Chung-ket-SESS-2025-014.pdf',
      format: 'PDF',
      sizeText: '6.4 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2025-014.pdf',
    },
  },
  {
    id: 'p10',
    competitionId: 'c3',
    code: 'SESS-2025-019',
    title: 'Thiết bị giám sát chất lượng nước nuôi tôm tự động',
    category: 'Tự động hóa & IoT',
    faculty: 'Điện - Điện tử',
    level: 'UNIVERSITY',
    status: 'COMPLETED',
    currentRound: 'Đã trao giải (Giải Nhì 2025)',
    submittedAt: '18/12/2025 14:30',
    ms: [6, 6],
    leaderInfo: {
      name: 'Trần Quốc Huy',
      studentId: '2211099',
      className: 'ĐĐT K22B',
      email: '2211099@student.ctuet.edu.vn',
      phone: '0912345899',
    },
    advisorInfo: {
      name: 'TS. Đặng Quang Minh',
      email: 'dqminh@ctuet.edu.vn',
      unit: 'Khoa Điện - Điện tử',
      phone: '0904556677',
    },
    members: ['Trần Quốc Huy (Trưởng nhóm)', 'Phạm Thị Ngọc Hân'],
    objectives:
      'Giám sát liên tục DO, pH, nhiệt độ và độ kiềm ao nuôi tôm công nghiệp với cảnh báo SMS/Zalo tức thời.',
    abstract:
      'Phao nổi năng lượng mặt trời đo đa chỉ tiêu mỗi 15 phút và tự động kích hoạt quạt nước khi oxy hòa tan thấp.',
    problemStatement:
      'Tôm dễ sốc môi trường vào ban đêm gây thiệt hại lớn nếu không phát hiện tụt oxy kịp thời.',
    solution:
      'Cảm biến công nghiệp chống bám rong kết hợp bộ điều khiển relay điều phối quạt ao.',
    businessModel:
      'Cho thuê thiết bị 450.000 đ/ao/vụ nuôi (3 tháng) hoặc bán đứt 6,8 triệu đồng.',
    attachmentUrl: {
      name: 'Ho-so-Chung-ket-SESS-2025-019.pdf',
      format: 'PDF',
      sizeText: '5.8 MB',
      url: 'https://drive.ctut.edu.vn/sess/SESS-2025-019.pdf',
    },
  },
];

const BASE_EVALUATIONS = [
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-001', status: 'SUBMITTED', score: 8.2 },
  { competitionId: 'c1', roundNumber: 2, project: 'SESS-2026-003', status: 'DRAFT', score: null },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-002', status: 'SUBMITTED', score: 7.6 },
  { competitionId: 'c1', roundNumber: 3, project: 'SESS-2026-004', status: 'SUBMITTED', score: 8.8 },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-001', status: 'SUBMITTED', score: 7.9 },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-002', status: 'DRAFT', score: null },
  { competitionId: 'c1', roundNumber: 1, project: 'SESS-2026-005', status: 'DRAFT', score: null },
  { competitionId: 'c2', roundNumber: 1, project: 'CNTT-2026-002', status: 'SUBMITTED', score: 8.4 },
];

export function createInitialCompetitionsMockState() {
  return structuredClone({
    competitions: BASE_COMPETITIONS,
    faculties: BASE_FACULTIES,
    projectCategories: BASE_PROJECT_CATEGORIES,
    evidenceTypes: BASE_EVIDENCE_TYPES,
    rubrics: BASE_RUBRICS,
    projects: BASE_PROJECTS,
    evaluations: BASE_EVALUATIONS,
  });
}

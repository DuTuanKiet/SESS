import httpClient from './http/httpClient';
import notificationService from './notificationService';

/**
 * Service Quản lý Đề tài Sinh viên & Vòng đời Dự án SESS
 * Tuân thủ quy chuẩn frontend-code-standard và kiến trúc phân lớp SESS
 *
 * ⚙️ CÔNG TẮC CHẾ ĐỘ DỮ LIỆU (DATA MODE SWITCH):
 * Các luồng project cốt lõi (danh sách, chi tiết, tạo/sửa, nộp và revisions) luôn dùng Backend.
 * Cờ mock chỉ còn áp dụng cho những luồng phụ chưa được nối API.
 */
export const USE_MOCK_DATA = true;

export function normalizeProjectFromBackend(project = {}) {
  const version = Number(project.version ?? project.currentVersion ?? 1);
  const advisorInfo = project.advisorInfo || {};
  const leaderInfo = project.leaderInfo || {};

  return {
    ...project,
    _id: project._id ?? project.id ?? '',
    title: project.title ?? project.name ?? '',
    category: project.category ?? project.field ?? '',
    abstract: project.abstract ?? project.description ?? '',
    faculty: project.faculty ?? '',
    objectives: project.objectives ?? '',
    problemStatement: project.problemStatement ?? '',
    solution: project.solution ?? '',
    businessModel: project.businessModel ?? '',
    attachmentUrl: project.attachmentUrl ?? '',
    advisorInfo: {
      hasAdvisor: Boolean(advisorInfo.hasAdvisor ?? advisorInfo.fullName),
      fullName: advisorInfo.fullName ?? '',
      email: advisorInfo.email ?? '',
      phone: advisorInfo.phone ?? '',
      department: advisorInfo.department ?? advisorInfo.unit ?? '',
      academicRank: advisorInfo.academicRank ?? '',
    },
    leaderInfo: {
      fullName: leaderInfo.fullName ?? '',
      studentId: leaderInfo.studentId ?? '',
      className: leaderInfo.className ?? '',
      faculty: leaderInfo.faculty ?? project.faculty ?? '',
      email: leaderInfo.email ?? '',
      phone: leaderInfo.phone ?? leaderInfo.phoneNumber ?? '',
    },
    competitionId: project.competitionId ?? '',
    competitionTitle: project.competitionTitle ?? '',
    currentRound: Number(project.currentRound ?? 1),
    submissionRounds: Array.isArray(project.submissionRounds) ? project.submissionRounds : [],
    version,
    currentVersion: version,
    userRole: String(project.userRole ?? '').toUpperCase(),
    progress: project.progress ?? { percent: 0, completed: 0, total: 0 },
    cancellationRequest: project.cancellationRequest ?? { hasPending: false, requestInfo: null },
    hasPendingLeaveRequest: Boolean(project.hasPendingLeaveRequest),
    leaveRequestInfo: project.leaveRequestInfo ?? null,
    members: Array.isArray(project.members) ? project.members : [],
  };
}

export function normalizeProjectRevisionFromBackend(revision = {}) {
  const snapshot = revision.snapshotData || {};
  return {
    ...revision,
    versionNumber: Number(revision.versionNumber ?? revision.version ?? 0),
    submittedAt: revision.submittedAt ?? revision.createdAt ?? null,
    snapshotData: {
      ...snapshot,
      title: snapshot.title ?? snapshot.name ?? '',
      category: snapshot.category ?? snapshot.field ?? '',
      abstract: snapshot.abstract ?? snapshot.description ?? '',
      faculty: snapshot.faculty ?? '',
      objectives: snapshot.objectives ?? '',
      problemStatement: snapshot.problemStatement ?? '',
      solution: snapshot.solution ?? '',
      businessModel: snapshot.businessModel ?? '',
      attachmentUrl: snapshot.attachmentUrl ?? '',
      advisorInfo: snapshot.advisorInfo ?? {},
      leaderInfo: snapshot.leaderInfo ?? {},
      competitionId: snapshot.competitionId ?? '',
      competitionTitle: snapshot.competitionTitle ?? '',
      currentRound: Number(snapshot.currentRound ?? 1),
      submissionRounds: Array.isArray(snapshot.submissionRounds) ? snapshot.submissionRounds : [],
    },
    digitalReceipt: revision.digitalReceipt?.hash ? revision.digitalReceipt : null,
  };
}

const normalizeProjectResponse = (responseBody) => {
  if (!responseBody?.data?.project) return responseBody;
  return {
    ...responseBody,
    data: { ...responseBody.data, project: normalizeProjectFromBackend(responseBody.data.project) },
  };
};

// Helper: Trì hoãn mô phỏng mạng cho mock data
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Lấy thông tin user hiện tại từ localStorage
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('sess_user') || 'null');
  } catch {
    return null;
  }
};

// Helper: Chuẩn hóa User ID (Hỗ trợ tương thích ngược với session cũ 'mock_student_id_01' hoặc tài khoản test)
const getEffectiveUserId = (user) => {
  if (!user) return '671f0000user0001'; // Mặc định sinh viên Đặng Tấn Kiệt khi chưa đăng nhập
  const uid = user.id || '';
  const email = (user.email || '').toLowerCase();
  const name = user.fullName || '';

  if (
    uid === '671f0000user0001' ||
    uid === 'mock_student_id_01' ||
    email.includes('dtkiet') ||
    email.includes('student@') ||
    name.includes('Kiệt')
  ) {
    return '671f0000user0001'; // Đặng Tấn Kiệt
  }
  if (uid === '671f0000user0002' || uid === 'mock_student_id_02' || email.includes('tvnam') || name.includes('Nam')) {
    return '671f0000user0002'; // Trần Văn Nam
  }
  if (uid === '671f0000user0004' || uid === 'mock_student_id_04' || email.includes('ntmai') || name.includes('Mai')) {
    return '671f0000user0004'; // Nguyễn Tuyết Mai
  }
  if (uid === '671f0000user0005' || uid === 'mock_student_id_05' || email.includes('vthung') || name.includes('Hùng')) {
    return '671f0000user0005'; // Vũ Tiến Hùng
  }
  if (uid === '671f0000user0006' || uid === 'mock_student_id_06' || email.includes('lhphuc') || name.includes('Phúc')) {
    return '671f0000user0006'; // Lê Hoàng Phúc
  }

  return uid;
};

// Mock Data chuẩn mực phục vụ Live Switch khi Backend dev chưa có dữ liệu mẫu
const MOCK_PROJECTS = [
  {
    _id: '671f0001a1b2c3d4e5f60001',
    code: 'SESS-2026-004',
    title: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
    category: 'Nông nghiệp công nghệ cao',
    field: 'Nông nghiệp công nghệ cao',
    faculty: 'Khoa Công nghệ Thông tin',
    advisorInfo: {
      fullName: 'TS. Nguyễn Văn Hướng',
      unit: 'Khoa Công nghệ Thông tin',
      phone: '0912345678',
      email: 'nvhuong@ctuet.edu.vn',
    },
    leaderInfo: {
      fullName: 'Đặng Tấn Kiệt',
      studentId: 'KTPM2311025',
      className: 'KTPM0123',
      courseYear: 'Khóa 11',
      phone: '0901234567',
      email: 'dtkietktpm2311025@student.ctuet.edu.vn',
    },
    objectives: 'Xây dựng hệ thống tự động phát hiện sớm bệnh đạo ôn và rầy nâu trên lúa thông qua camera di động, giúp bà con giảm 30% chi phí phun thuốc trừ sâu.',
    abstract: 'Ứng dụng công nghệ thị giác máy tính nhận diện sớm bệnh đạo ôn và rầy nâu trên lá lúa qua thiết bị di động.',
    problemStatement: 'Bà con nông dân gặp khó khăn trong việc phát hiện sâu bệnh kịp thời dẫn đến thiệt hại mùa màng nghiêm trọng.',
    solution: 'Mô hình Deep Learning YOLOv8 kết hợp ứng dụng di động cho kết quả chẩn đoán chính xác 96% trong 3 giây.',
    businessModel: 'Cung cấp giải pháp phần mềm miễn phí cho nông dân, thu phí bản quyền từ các hợp tác xã nông nghiệp.',
    attachmentUrl: 'https://docs.google.com/document/d/158-TB-DHKTCN-CTUTSTARTUP2025-Demo/edit',
    status: 'UNDER_MENTORSHIP',
    version: 1,
    currentVersion: 1,
    level: 'FACULTY',
    ownerId: '671f0000user0001',
    userRole: 'OWNER',
    digitalReceiptHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    digitalReceiptTimestamp: '2026-03-15T08:30:00.000Z',
    createdAt: '2026-03-10T02:00:00.000Z',
    updatedAt: '2026-03-25T10:00:00.000Z',
  },
  {
    _id: '671f0001a1b2c3d4e5f60009',
    code: 'SESS-2026-009',
    title: 'Ứng dụng AI Hỗ trợ Phân loại và Tái chế Rác thải Y tế',
    category: 'Y tế & Đời sống',
    field: 'Y tế & Đời sống',
    faculty: 'Khoa Điện - Điện tử - Viễn thông',
    advisorInfo: {
      fullName: 'ThS. Trần Thị Mai',
      unit: 'Khoa Điện - Điện tử',
      phone: '0987654321',
      email: 'ttmai@ctuet.edu.vn',
    },
    leaderInfo: {
      fullName: 'Lê Hoàng Phúc',
      studentId: 'KTPM2311030',
      className: 'KTPM0223',
      courseYear: 'Khóa 11',
      phone: '0933445566',
      email: 'lhphuc2311030@student.ctuet.edu.vn',
    },
    objectives: 'Tự động hóa hoàn toàn quy trình nhận diện và phân chia rác nguy hại y tế tại nguồn.',
    abstract: 'Giải pháp tự động phân loại rác thải y tế nguy hại sử dụng camera thị giác máy tính và cánh tay robot.',
    problemStatement: 'Nguy cơ lây nhiễm chéo cao khi nhân viên y tế phân loại rác thủ công.',
    solution: 'Mô hình ResNet50 kết hợp cảm biến siêu âm phát hiện và gắp rác tự động vào thùng chuyên dụng.',
    businessModel: 'Bán giải pháp cho các bệnh viện đa khoa và trung tâm y tế dự phòng.',
    attachmentUrl: 'https://docs.google.com/document/d/sess-2026-009-thuyet-minh/edit',
    status: 'UNDER_MENTORSHIP',
    version: 1,
    currentVersion: 1,
    level: 'FACULTY',
    ownerId: '671f0000user0006',
    userRole: 'OWNER',
    digitalReceiptHash: 'c7d2e14298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c77d',
    digitalReceiptTimestamp: '2026-03-18T08:30:00.000Z',
    createdAt: '2026-03-15T02:00:00.000Z',
    updatedAt: '2026-03-26T10:00:00.000Z',
  },
  {
    _id: '671f0001a1b2c3d4e5f60002',
    code: 'SESS-2025-012',
    title: 'Nền tảng Số hóa và Truy xuất Nguồn gốc Nông sản Bằng Blockchain',
    category: 'Công nghệ thông tin',
    field: 'Công nghệ thông tin',
    faculty: 'Khoa Công nghệ Thông tin',
    advisorInfo: {
      fullName: 'TS. Nguyễn Văn Hướng',
      unit: 'Khoa Công nghệ Thông tin',
      phone: '0912345678',
      email: 'nvhuong@ctuet.edu.vn',
    },
    leaderInfo: {
      fullName: 'Đặng Tấn Kiệt',
      studentId: 'KTPM2311025',
      className: 'KTPM0123',
      courseYear: 'Khóa 11',
      phone: '0901234567',
      email: 'dtkietktpm2311025@student.ctuet.edu.vn',
    },
    objectives: 'Minh bạch nguồn gốc nông sản xuất khẩu qua công nghệ sổ cái phân tán.',
    abstract: 'Giải pháp ứng dụng chuỗi khối phân tán bảo đảm tính minh bạch và chống giả mạo tem truy xuất nguồn gốc.',
    problemStatement: 'Gian lận thương mại và giả mạo nguồn gốc nông sản hữu cơ gây mất niềm tin của người tiêu dùng.',
    solution: 'Smart contract trên nền tảng Hyperledger Fabric kết hợp tem mã hóa QR động.',
    businessModel: 'Phí dịch vụ tem số hóa trên mỗi lô hàng của doanh nghiệp xuất khẩu.',
    attachmentUrl: 'https://docs.google.com/document/d/sess-2025-012-blockchain/edit',
    status: 'COMPLETED',
    award: {
      prize: 'FIRST_PRIZE',
      title: 'Giải Nhất',
      competitionName: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2025',
      round: 'Vòng Chung kết',
      stage: 'FINAL',
      prizeMoney: '15.000.000 VNĐ',
      awardedAt: '2025-12-20',
    },
    version: 2,
    currentVersion: 2,
    level: 'UNIVERSITY',
    ownerId: '671f0000user0001',
    userRole: 'OWNER',
    digitalReceiptHash: 'a4f89d9876fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b89c',
    digitalReceiptTimestamp: '2025-11-20T09:15:00.000Z',
    createdAt: '2025-03-10T02:00:00.000Z',
    updatedAt: '2025-12-05T14:00:00.000Z',
  },
  {
    _id: '671f0001a1b2c3d4e5f60003',
    code: 'SESS-2024-008',
    title: 'Hệ thống Giám sát Nuôi trồng Thủy sản Thông minh IoT',
    category: 'Tự động hóa & IoT',
    field: 'Tự động hóa & IoT',
    faculty: 'Khoa Cơ khí',
    advisorInfo: {
      fullName: 'ThS. Lê Hoàng Vũ',
      unit: 'Khoa Cơ khí',
      phone: '0944556677',
      email: 'lhvu@ctuet.edu.vn',
    },
    leaderInfo: {
      fullName: 'Trần Văn Nam',
      studentId: 'KTPM2311026',
      className: 'KTPM0123',
      courseYear: 'Khóa 11',
      phone: '0911223344',
      email: 'tvnamktpm2311026@student.ctuet.edu.vn',
    },
    objectives: 'Tự động đo đạc chỉ số môi trường nước và cảnh báo sớm sự cố ao nuôi tôm.',
    abstract: 'Bộ cảm biến đo nồng độ pH, oxy hòa tan và độ mặn tự động kích hoạt máy sục khí trong ao nuôi tôm.',
    problemStatement: 'Nuôi tôm truyền thống phụ thuộc vào kinh nghiệm thủ công, tỷ lệ rủi ro cao khi môi trường nước thay đổi đột ngột.',
    solution: 'Mạng cảm biến không dây LoraWan truyền dữ liệu về gateway điều khiển máy sục khí tự động.',
    businessModel: 'Bán thiết bị phần cứng và gói bảo trì phần mềm định kỳ.',
    attachmentUrl: 'https://docs.google.com/document/d/sess-2024-008-iot/edit',
    status: 'COMPLETED',
    version: 1,
    currentVersion: 1,
    level: 'FACULTY',
    ownerId: '671f0000user0002',
    userRole: 'MEMBER',
    digitalReceiptHash: '9f83726298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b11a',
    digitalReceiptTimestamp: '2024-11-18T10:00:00.000Z',
    createdAt: '2024-03-12T04:00:00.000Z',
    updatedAt: '2024-12-01T16:30:00.000Z',
  },
];

const generateDefaultMilestones = (project = {}) => [
  {
    _id: `ms_${project?._id || Date.now()}_01`,
    title: 'Mốc 1: Khảo sát thực trạng & Thiết kế kiến trúc giải pháp',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'InProgress',
    evidence: null,
    mentorFeedback: null,
  },
  {
    _id: `ms_${project?._id || Date.now()}_02`,
    title: 'Mốc 2: Triển khai thử nghiệm mô hình MVP & Đánh giá sơ bộ',
    startDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Pending',
    evidence: null,
    mentorFeedback: null,
  },
  {
    _id: `ms_${project?._id || Date.now()}_03`,
    title: 'Mốc 3: Hoàn thiện báo cáo kết quả & Thuyết minh chung kết',
    startDate: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'Pending',
    evidence: null,
    mentorFeedback: null,
  },
];

const MOCK_MILESTONES = {
  '671f0001a1b2c3d4e5f60001': [
    {
      _id: 'ms01',
      title: 'Mốc 1: Khảo sát thực trạng & Thiết kế kiến trúc hệ thống',
      startDate: '2026-03-10',
      dueDate: '2026-04-15',
      status: 'Completed',
      evidence: {
        fileUrl: 'https://storage.sess.ctuet.edu.vn/evidence/ms01-report.pdf',
        fileName: 'Bao-cao-khao-sat-thuc-te-dot-1.pdf',
        submittedAt: '2026-04-12T10:00:00Z',
        note: 'Đã hoàn thành khảo sát 50 hộ nông dân tại Cần Thơ, thu thập 1.200 ảnh mẫu bệnh lá lúa.',
      },
      mentorFeedback: 'Khảo sát kỹ lưỡng, số liệu thực tế thuyết phục. Đạt yêu cầu để sang mốc tiếp theo.',
    },
    {
      _id: 'ms02',
      title: 'Mốc 2: Huấn luyện mô hình AI & Xây dựng bản thử nghiệm MVP',
      startDate: '2026-04-16',
      dueDate: '2026-06-01',
      status: 'InProgress',
      evidence: null,
      mentorFeedback: null,
    },
    {
      _id: 'ms03',
      title: 'Mốc 3: Triển khai thử nghiệm thực tế & Hoàn thiện báo cáo',
      startDate: '2026-06-02',
      dueDate: '2026-08-01',
      status: 'Pending',
      evidence: null,
      mentorFeedback: null,
    },
  ],
  '671f0001a1b2c3d4e5f60009': [
    {
      _id: 'ms09_01',
      title: 'Mốc 1: Thu thập dữ liệu rác y tế & Thiết kế quy chuẩn an toàn',
      startDate: '2026-03-20',
      dueDate: '2026-05-30',
      status: 'InProgress',
      evidence: null,
      mentorFeedback: null,
    },
    {
      _id: 'ms09_02',
      title: 'Mốc 2: Thử nghiệm phân loại tự động bằng cánh tay robot trong Lab',
      startDate: '2026-06-01',
      dueDate: '2026-07-15',
      status: 'Pending',
      evidence: null,
      mentorFeedback: null,
    },
    {
      _id: 'ms09_03',
      title: 'Mốc 3: Thử nghiệm thực tế tại bệnh viện & Hoàn thiện báo cáo',
      startDate: '2026-07-16',
      dueDate: '2026-08-30',
      status: 'Pending',
      evidence: null,
      mentorFeedback: null,
    },
  ],
  '671f0001a1b2c3d4e5f60002': [
    {
      _id: 'ms02_01',
      title: 'Mốc 1: Nghiên cứu kiến trúc Blockchain & Thiết kế Smart Contract',
      startDate: '2025-03-15',
      dueDate: '2025-05-01',
      status: 'Completed',
      evidence: {
        fileUrl: 'https://storage.sess.ctuet.edu.vn/evidence/ms02-01-blockchain.pdf',
        fileName: 'Kien-truc-smart-contract.pdf',
        submittedAt: '2025-04-28T09:00:00Z',
        note: 'Đã hoàn thiện tài liệu đặc tả kiến trúc phân tán.',
      },
      mentorFeedback: 'Hồ sơ thiết kế đạt chuẩn chất lượng.',
    },
    {
      _id: 'ms02_02',
      title: 'Mốc 2: Kết nối API hải quan và thử nghiệm 3 hợp tác xã',
      startDate: '2025-05-02',
      dueDate: '2025-08-01',
      status: 'Completed',
      evidence: {
        fileUrl: 'https://storage.sess.ctuet.edu.vn/evidence/ms02-02-api.pdf',
        fileName: 'Ket-noi-api-hai-quan.pdf',
        submittedAt: '2025-07-29T14:30:00Z',
        note: 'Đã kết nối thành công 3 hợp tác xã xuất khẩu.',
      },
      mentorFeedback: 'Thực thi tốt, đạt chuẩn bảo mật dữ liệu.',
    },
    {
      _id: 'ms02_03',
      title: 'Mốc 3: Hoàn thiện nghiệm thu cấp Trường và công bố mã nguồn',
      startDate: '2025-08-02',
      dueDate: '2025-11-15',
      status: 'Completed',
      evidence: {
        fileUrl: 'https://storage.sess.ctuet.edu.vn/evidence/ms02-03-final.pdf',
        fileName: 'Bao-cao-tong-ket-nghiem-thu.pdf',
        submittedAt: '2025-11-10T16:00:00Z',
        note: 'Nghiệm thu thành công đạt giải Nhất NCKH cấp Trường.',
      },
      mentorFeedback: 'Xuất sắc. Đạt yêu cầu nghiệm thu xuất sắc.',
    },
  ],
};

const MOCK_REVISIONS = {
  '671f0001a1b2c3d4e5f60002': [
    {
      _id: 'rev002',
      versionNumber: 2,
      submittedAt: '2025-11-20T09:15:00.000Z',
      snapshotData: {
        title: 'Nền tảng Số hóa và Truy xuất Nguồn gốc Nông sản Bằng Blockchain (Bản hoàn thiện)',
        category: 'Công nghệ thông tin',
        abstract: 'Bổ sung kết nối API hải quan và mở rộng mạng lưới kiểm chứng với 3 hợp tác xã.',
        solution: 'Smart Contract nâng cao và tích hợp tem QR chống giả mạo.',
        businessModel: 'Phí dịch vụ tem số hóa trên mỗi lô hàng của doanh nghiệp xuất khẩu.',
      },
    },
    {
      _id: 'rev001',
      versionNumber: 1,
      submittedAt: '2025-04-10T14:00:00.000Z',
      snapshotData: {
        title: 'Nền tảng Số hóa và Truy xuất Nguồn gốc Nông sản Bằng Blockchain',
        category: 'Công nghệ thông tin',
        abstract: 'Giải pháp ứng dụng chuỗi khối phân tán bảo đảm tính minh bạch.',
        solution: 'Mô hình cơ bản ứng dụng Hyperledger Fabric.',
        businessModel: 'Phí bảo trì định kỳ.',
      },
    },
  ],
};

// Danh sách thành viên mẫu (đáp ứng đúng chỉ đạo của Yu: KHÔNG lưu người đã từ chối để tránh rối)
const MOCK_MEMBERS = {
  '671f0001a1b2c3d4e5f60001': [
    {
      userId: '671f0000user0001',
      fullName: 'Đặng Tấn Kiệt',
      email: 'dtkietktpm2311025@student.ctuet.edu.vn',
      studentId: 'KTPM2311025',
      role: 'OWNER',
      status: 'ACCEPTED',
      joinedAt: '2026-03-10T02:00:00.000Z',
    },
    {
      userId: '671f0000user0002',
      fullName: 'Trần Văn Nam',
      email: 'tvnamktpm2311026@student.ctuet.edu.vn',
      studentId: 'KTPM2311026',
      role: 'MEMBER',
      status: 'ACCEPTED',
      joinedAt: '2026-03-12T05:00:00.000Z',
      leavePending: false,
    },
  ],
  '671f0001a1b2c3d4e5f60009': [
    {
      userId: '671f0000user0006',
      fullName: 'Lê Hoàng Phúc',
      email: 'lhphuc2311030@student.ctuet.edu.vn',
      studentId: 'KTPM2311030',
      role: 'OWNER',
      status: 'ACCEPTED',
      joinedAt: '2026-03-15T02:00:00.000Z',
    },
  ],
};

// Danh sách lời mời mẫu phục vụ kịch bản kiểm thử của Yu
const MOCK_INVITATIONS = [
  // 1. Gửi cho bạn Mai (Sinh viên tự do - chưa có đề tài) -> Chấp nhận thành công 100%
  {
    _id: 'inv_mock_mai_01',
    targetEmail: 'ntmai2311040@student.ctuet.edu.vn',
    projectId: '671f0001a1b2c3d4e5f60001',
    projectCode: 'SESS-2026-004',
    projectTitle: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
    category: 'Nông nghiệp công nghệ cao',
    level: 'FACULTY',
    inviterName: 'Đặng Tấn Kiệt',
    inviterEmail: 'dtkietktpm2311025@student.ctuet.edu.vn',
    createdAt: '2026-03-28T04:30:00.000Z',
  },
  // 2. Gửi cho bạn Hùng (Sinh viên tự do - sẽ bấm Từ chối) -> Từ chối, xóa khỏi nhóm, Kiệt nhận thông báo
  {
    _id: 'inv_mock_hung_02',
    targetEmail: 'vthung2311041@student.ctuet.edu.vn',
    projectId: '671f0001a1b2c3d4e5f60001',
    projectCode: 'SESS-2026-004',
    projectTitle: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
    category: 'Nông nghiệp công nghệ cao',
    level: 'FACULTY',
    inviterName: 'Đặng Tấn Kiệt',
    inviterEmail: 'dtkietktpm2311025@student.ctuet.edu.vn',
    createdAt: '2026-03-28T05:00:00.000Z',
  },
  // 3. Gửi cho bạn Phúc (Sinh viên ĐÃ CÓ ĐỀ TÀI ACTIVE SESS-2026-009) -> Bấm Đồng ý sẽ BỊ CHẶN LẠI
  {
    _id: 'inv_mock_phuc_03',
    targetEmail: 'lhphuc2311030@student.ctuet.edu.vn',
    projectId: '671f0001a1b2c3d4e5f60001',
    projectCode: 'SESS-2026-004',
    projectTitle: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
    category: 'Nông nghiệp công nghệ cao',
    level: 'FACULTY',
    inviterName: 'Đặng Tấn Kiệt',
    inviterEmail: 'dtkietktpm2311025@student.ctuet.edu.vn',
    createdAt: '2026-03-28T05:30:00.000Z',
  },
];

// Danh sách yêu cầu xin rời nhóm chờ Admin duyệt
const MOCK_LEAVE_REQUESTS = [];

// Danh sách yêu cầu xin hủy đề tài chờ Admin duyệt
const MOCK_CANCELLATION_REQUESTS = [];

/**
 * 1. Lấy danh sách đề tài của sinh viên (phân quyền chính xác theo tài khoản đăng nhập)
 */
export async function getProjectsApi({ page = 1, limit = 6, status, keyword, year } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  if (keyword) params.keyword = keyword;
  if (year) params.year = year;
  const response = await httpClient.get('/projects', { params });
  const responseBody = response.data;
  if (!Array.isArray(responseBody?.data?.projects)) return responseBody;
  return {
    ...responseBody,
    data: {
      ...responseBody.data,
      projects: responseBody.data.projects.map(normalizeProjectFromBackend),
    },
  };

}

/**
 * 2. Lấy thông tin chi tiết đề tài theo ID
 */
export async function getProjectByIdApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}`);
  const responseBody = response.data;
  if (!responseBody?.data?.project) return responseBody;
  const membership = responseBody.data.membership || {};
  const project = normalizeProjectFromBackend({
    ...responseBody.data.project,
    userRole: responseBody.data.project.userRole ?? membership.role,
    hasPendingLeaveRequest: membership.hasPendingLeaveRequest,
    leaveRequestInfo: membership.leaveRequestInfo,
    cancellationRequest: responseBody.data.cancellationRequest ?? responseBody.data.project.cancellationRequest,
  });
  return { ...responseBody, data: { ...responseBody.data, project } };

}

/**
 * 3. Chỉnh sửa hồ sơ thuyết minh đề tài (FR03)
 */
export async function updateProjectApi(projectId, payload) {
  const response = await httpClient.put(`/projects/${projectId}`, payload);
  return normalizeProjectResponse(response.data);

}

/**
 * 4. Nộp hồ sơ đề tài chính thức / Nộp bài cuối cùng (FR03)
 */
export async function submitProjectApi(projectId) {
  const response = await httpClient.post(`/projects/${projectId}/submit`);
  const body = normalizeProjectResponse(response.data);
  if (body?.data?.revision) {
    body.data.revision = normalizeProjectRevisionFromBackend(body.data.revision);
  }
  return body;

}

/**
 * 5. Lấy lịch sử các phiên bản đã nộp snapshot (ProjectRevision)
 */
export async function getProjectRevisionsApi(projectId) {
  const response = await httpClient.get(`/projects/${projectId}/revisions`);
  const body = response.data;
  if (!body?.data) return body;
  return {
    ...body,
    data: {
      ...body.data,
      project: body.data.project ? normalizeProjectFromBackend(body.data.project) : body.data.project,
      revisions: (body.data.revisions || []).map(normalizeProjectRevisionFromBackend),
    },
  };

}

/**
 * 6. Lấy danh sách mốc tiến độ của đề tài (FR05) - Đảm bảo độc lập theo từng đề tài
 */
export async function getMilestonesApi(projectId) {
  const response = await httpClient.get('/projects/' + projectId + '/milestones');
  const responseBody = response.data;
  const rawMilestones = Array.isArray(responseBody?.data)
    ? responseBody.data
    : responseBody?.data?.milestones || [];

  return {
    ...responseBody,
    data: {
      milestones: rawMilestones.map((milestone) => {
        const evidence = milestone.evidence;
        const hasEvidence = Boolean(evidence?.submittedAt || evidence?.url || evidence?.fileUrl);
        return {
          ...milestone,
          evidence: hasEvidence
            ? { ...evidence, fileUrl: evidence.fileUrl ?? evidence.url ?? '' }
            : null,
        };
      }),
    },
  };
}

/**
 * 7. Nộp / Cập nhật minh chứng mốc tiến độ (FR05)
 * Cho phép cập nhật lại minh chứng khi chưa hết hạn của mốc (now <= dueDate)
 */
export async function submitEvidenceApi(projectId, milestoneId, payload) {
  const response = await httpClient.post('/projects/' + projectId + '/milestones/' + milestoneId + '/evidence', {
    url: payload?.url ?? payload?.fileUrl ?? '',
    note: payload?.note ?? '',
  });
  return response.data;
}

/**
 * 8. Quản lý thành viên: Lấy danh sách thành viên (CHỈ HIỂN THỊ THÀNH VIÊN VÀ LỜI MỜI CHỜ, LOẠI BỎ NGƯỜI TỪ CHỐI)
 */
export async function getProjectMembersApi(projectId) {
  const response = await httpClient.get('/projects/' + projectId + '/members');
  return response.data;
}

/**
 * 9. Quản lý thành viên: Mời thành viên mới bằng email trường (FR04)
 */
export async function inviteMemberApi(projectId, email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Vui lòng nhập email sinh viên.');

  const response = await httpClient.post('/projects/' + projectId + '/members/invite', { email: normalizedEmail });
  return response.data;
}

/**
 * 10. Quản lý thành viên: Xóa thành viên khỏi nhóm (FR04)
 */
export async function removeMemberApi(projectId, userId) {
  const response = await httpClient.delete('/projects/' + projectId + '/members/' + userId);
  return response.data;
}

/**
 * 11. Quản lý thành viên: Thu hồi/Hủy lời mời đã gửi (FR04)
 */
export async function cancelInvitationApi(projectId, identifier) {
  const response = await httpClient.delete('/projects/' + projectId + '/members/invitations/' + encodeURIComponent(identifier));
  return response.data;
}

/**
 * 12. Quản lý thành viên: Bàn giao quyền Trưởng nhóm TRỰC TIẾP (FR04 - Không qua Admin)
 */
export async function transferOwnershipApi(projectId, userId) {
  const response = await httpClient.post('/projects/' + projectId + '/members/transfer-ownership', { userId });
  return response.data;
}

/**
 * 13. Thành viên nộp đơn xin rời nhóm (Cần Admin duyệt)
 */
export async function requestLeaveProjectApi(projectId, { reason }) {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Vui lòng nêu rõ lý do xin rời nhóm (tối thiểu 10 ký tự).');
  }

  const response = await httpClient.post(`/projects/${projectId}/members/leave-request`, { reason: reason.trim() });
  return response.data;
}

/**
 * 14. Thành viên hủy đơn xin rời nhóm đang chờ duyệt
 */
export async function cancelLeaveRequestApi(projectId) {
  const response = await httpClient.delete(`/projects/${projectId}/members/leave-request`);
  return response.data;
}

/**
 * 15. Lấy danh sách các lời mời tham gia đề tài gửi đến sinh viên (FR04)
 */
export async function getMyInvitationsApi() {
  const response = await httpClient.get('/projects/invitations');
  return response.data;
}

/** Phản hồi lời mời; backend kiểm tra quota và lưu trạng thái membership. */
export async function respondInvitationApi(invitationId, response) {
  const res = await httpClient.post(`/projects/invitations/${invitationId}/respond`, { response });
  return res.data;
}

/**
 * 17. Khởi tạo đề tài mới (FR03)
 */
export async function createProjectApi(payload) {
  const response = await httpClient.post('/projects', payload);
  return normalizeProjectResponse(response.data);
}

/**
 * 18. Nộp đơn xin hủy đề tài gửi Ban Quản trị phê duyệt
 * Endpoint: POST /api/v1/projects/:projectId/cancellation-requests
 * @param {string} projectId - ID đề tài
 * @param {Object} payload
 * @param {string} payload.reason - Lý do hủy đề tài (>= 20 ký tự)
 * @param {Array<{ fileName: string, fileUrl: string }>} [payload.evidenceFiles] - Danh sách link minh chứng
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export async function requestProjectCancellationApi(projectId, { reason, evidenceFiles = [] } = {}) {
  const trimmedReason = (reason || '').trim();
  if (trimmedReason.length < 20) {
    const error = new Error('Lý do hủy đề tài phải có tối thiểu 20 ký tự.');
    error.code = 'REASON_TOO_SHORT';
    throw error;
  }

  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/cancellation-requests`, {
      reason: trimmedReason,
      evidenceFiles,
    });
    return response.data;
  }

  await delay(400);
  const user = getCurrentUser();
  const effectiveUserId = getEffectiveUserId(user);

  // Kiểm tra xem đề tài đã có đơn xin hủy PENDING hay chưa
  const existingPending = MOCK_CANCELLATION_REQUESTS.find(
    (req) => req.projectId === projectId && req.status === 'PENDING'
  );
  if (existingPending) {
    const error = new Error('Đề tài đã có một đơn xin hủy đang chờ Ban Quản trị xét duyệt.');
    error.code = 'CANCELLATION_REQUEST_PENDING';
    throw error;
  }

  const newRequest = {
    _id: `mock_cancel_${Date.now()}`,
    projectId,
    requestedBy: effectiveUserId,
    reason: trimmedReason,
    evidenceFiles: (evidenceFiles || []).map((file) => ({
      fileName: String(file.fileName || '').trim(),
      fileUrl: String(file.fileUrl || '').trim(),
      uploadedAt: new Date().toISOString(),
    })),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  MOCK_CANCELLATION_REQUESTS.push(newRequest);

  return {
    success: true,
    code: 'CANCELLATION_REQUEST_CREATED',
    message: 'Đã gửi yêu cầu hủy đề tài kèm bằng chứng. Đang chờ Ban Quản trị xét duyệt.',
    data: {
      request: newRequest,
    },
  };
}

/**
 * Helper: Tính toán tiến độ % hoàn thành các mốc theo từng đề tài
 * @param {string} projectId
 * @returns {{ completed: number, total: number, percent: number }}
 */
export function calculateProjectProgress(projectId) {
  const milestones = MOCK_MILESTONES[projectId];
  if (!milestones || !milestones.length) {
    const p = MOCK_PROJECTS.find((proj) => proj._id === projectId);
    if (p?.status === 'COMPLETED') return { completed: 3, total: 3, percent: 100 };
    return { completed: 0, total: 3, percent: 0 };
  }
  const completed = milestones.filter((m) => m.status === 'Completed' || m.status === 'DONE').length;
  return {
    completed,
    total: milestones.length,
    percent: Math.round((completed / milestones.length) * 100),
  };
}

/**
 * Helper: Tính toán điều kiện đăng ký đề tài mới (Tối đa 2 đề tài active/sinh viên)
 */
export function evaluateProjectEligibility(projects = []) {
  const activeStatuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'UNDER_MENTORSHIP', 'NEED_REVISION', 'APPROVED', 'EVALUATED'];
  const activeProjects = projects.filter((p) => activeStatuses.includes(p.status) && !p.parentId);

  if (activeProjects.length >= 2) {
    return {
      canRegister: false,
      activeProjects,
      reason: `Bạn đang tham gia 02 đề tài hoạt động trong kỳ này (${activeProjects.map((p) => p.code).join(', ')}). Theo quy chế SESS, bạn cần hoàn thành đề tài hiện tại trước khi đăng ký thêm đề tài mới.`,
    };
  }

  return {
    canRegister: true,
    activeProjects,
    reason: 'Bạn đủ điều kiện đăng ký đề tài khởi nghiệp mới.',
  };
}

/**
 * Kê khai và lưu thông tin nhận giải thưởng cho đề tài đạt giải chung kết
 */
export async function saveRewardClaimApi(projectId, claimData) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/reward-claim`, claimData);
    return response.data;
  }

  await delay(250);
  const claimRecord = {
    ...claimData,
    submittedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  try {
    localStorage.setItem(`sess_reward_claim_${projectId}`, JSON.stringify(claimRecord));
  } catch (err) {
    console.error('Không thể lưu thông tin nhận thưởng vào localStorage:', err);
  }

  return {
    success: true,
    message: 'Kê khai thông tin nhận giải thưởng thành công!',
    data: {
      rewardClaim: claimRecord,
    },
  };
}

/**
 * Lấy thông tin kê khai nhận thưởng của đề tài
 */
export async function getRewardClaimApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.get(`/projects/${projectId}/reward-claim`);
    return response.data;
  }

  await delay(100);
  try {
    const claimStr = localStorage.getItem(`sess_reward_claim_${projectId}`);
    const claim = claimStr ? JSON.parse(claimStr) : null;
    return {
      success: true,
      data: {
        rewardClaim: claim,
      },
    };
  } catch {
    return {
      success: true,
      data: {
        rewardClaim: null,
      },
    };
  }
}

export const projectService = {
  getProjects: getProjectsApi,
  getProjectById: getProjectByIdApi,
  createProject: createProjectApi,
  updateProject: updateProjectApi,
  submitProject: submitProjectApi,
  getProjectRevisions: getProjectRevisionsApi,
  getMilestones: getMilestonesApi,
  submitEvidence: submitEvidenceApi,
  getProjectMembers: getProjectMembersApi,
  inviteMember: inviteMemberApi,
  removeMember: removeMemberApi,
  cancelInvitation: cancelInvitationApi,
  transferOwnership: transferOwnershipApi,
  requestLeaveProject: requestLeaveProjectApi,
  cancelLeaveRequest: cancelLeaveRequestApi,
  getMyInvitations: getMyInvitationsApi,
  respondInvitation: respondInvitationApi,
  requestProjectCancellation: requestProjectCancellationApi,
  evaluateProjectEligibility,
  calculateProjectProgress,
  getProjectProgress: calculateProjectProgress,
  saveRewardClaim: saveRewardClaimApi,
  getRewardClaim: getRewardClaimApi,
};

export default projectService;

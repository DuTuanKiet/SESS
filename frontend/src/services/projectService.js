import httpClient from './http/httpClient';
import notificationService from './notificationService';

/**
 * Service Quản lý Đề tài Sinh viên & Vòng đời Dự án SESS
 * Tuân thủ quy chuẩn frontend-code-standard và kiến trúc phân lớp SESS
 *
 * ⚙️ CÔNG TẮC CHẾ ĐỘ DỮ LIỆU (DATA MODE SWITCH):
 * - USE_MOCK_DATA = true (Mặc định hiện tại): Sử dụng Mock Data phong phú,
 *   mô phỏng trọn vẹn mọi trạng thái vòng đời (Active 2026, Hoàn thành 2025/2024, Milestones, Biên nhận số).
 * - USE_MOCK_DATA = false: Gọi trực tiếp Backend API qua Axios HttpClient (/api/v1/projects...).
 */
export const USE_MOCK_DATA = true;

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
    abstract: 'Ứng dụng công nghệ thị giác máy tính nhận diện sớm bệnh đạo ôn và rầy nâu trên lá lúa qua thiết bị di động.',
    problemStatement: 'Bà con nông dân gặp khó khăn trong việc phát hiện sâu bệnh kịp thời dẫn đến thiệt hại mùa màng nghiêm trọng.',
    solution: 'Mô hình Deep Learning YOLOv8 kết hợp ứng dụng di động cho kết quả chẩn đoán chính xác 96% trong 3 giây.',
    businessModel: 'Cung cấp giải pháp phần mềm miễn phí cho nông dân, thu phí bản quyền từ các hợp tác xã nông nghiệp.',
    attachmentUrl: 'https://storage.sess.ctuet.edu.vn/proposals/sess-2026-004.pdf',
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
    abstract: 'Giải pháp tự động phân loại rác thải y tế nguy hại sử dụng camera thị giác máy tính và cánh tay robot.',
    problemStatement: 'Nguy cơ lây nhiễm chéo cao khi nhân viên y tế phân loại rác thủ công.',
    solution: 'Mô hình ResNet50 kết hợp cảm biến siêu âm phát hiện và gắp rác tự động vào thùng chuyên dụng.',
    businessModel: 'Bán giải pháp cho các bệnh viện đa khoa và trung tâm y tế dự phòng.',
    attachmentUrl: 'https://storage.sess.ctuet.edu.vn/proposals/sess-2026-009.pdf',
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
    abstract: 'Giải pháp ứng dụng chuỗi khối phân tán bảo đảm tính minh bạch và chống giả mạo tem truy xuất nguồn gốc.',
    problemStatement: 'Gian lận thương mại và giả mạo nguồn gốc nông sản hữu cơ gây mất niềm tin của người tiêu dùng.',
    solution: 'Smart contract trên nền tảng Hyperledger Fabric kết hợp tem mã hóa QR động.',
    businessModel: 'Phí dịch vụ tem số hóa trên mỗi lô hàng của doanh nghiệp xuất khẩu.',
    attachmentUrl: 'https://storage.sess.ctuet.edu.vn/proposals/sess-2025-012.pdf',
    status: 'COMPLETED',
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
    abstract: 'Bộ cảm biến đo nồng độ pH, oxy hòa tan và độ mặn tự động kích hoạt máy sục khí trong ao nuôi tôm.',
    problemStatement: 'Nuôi tôm truyền thống phụ thuộc vào kinh nghiệm thủ công, tỷ lệ rủi ro cao khi môi trường nước thay đổi đột ngột.',
    solution: 'Mạng cảm biến không dây LoraWan truyền dữ liệu về gateway điều khiển máy sục khí tự động.',
    businessModel: 'Bán thiết bị phần cứng và gói bảo trì phần mềm định kỳ.',
    attachmentUrl: 'https://storage.sess.ctuet.edu.vn/proposals/sess-2024-008.pdf',
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
  if (!USE_MOCK_DATA) {
    const params = { page, limit };
    if (status && status !== 'ACTIVE') params.status = status;
    const response = await httpClient.get('/projects', { params });
    return response.data;
  }

  await delay(300);
  const user = getCurrentUser();
  const effectiveUserId = getEffectiveUserId(user);

  // Phân quyền hiển thị: Chỉ hiển thị đề tài mà sinh viên này sở hữu hoặc là thành viên chính thức
  let filtered = MOCK_PROJECTS.filter((p) => {
    if (p.ownerId === effectiveUserId) return true;
    const mems = MOCK_MEMBERS[p._id] || [];
    return mems.some(
      (m) =>
        (m.userId === effectiveUserId || (user?.email && m.email === user.email)) &&
        m.status === 'ACCEPTED'
    );
  });

  if (status) {
    if (status === 'ACTIVE') {
      filtered = filtered.filter((p) => p.status !== 'COMPLETED' && p.status !== 'REJECTED');
    } else if (status === 'COMPLETED') {
      filtered = filtered.filter((p) => p.status === 'COMPLETED');
    } else {
      filtered = filtered.filter((p) => p.status === status);
    }
  }

  if (keyword) {
    const q = keyword.trim().toLowerCase();
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }

  if (year) {
    filtered = filtered.filter((p) => p.code.includes(`SESS-${year}-`));
  }

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    success: true,
    message: 'Lấy danh sách đề tài thành công.',
    data: {
      projects: paginated,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  };
}

/**
 * 2. Lấy thông tin chi tiết đề tài theo ID
 */
export async function getProjectByIdApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.get(`/projects/${projectId}`);
    return response.data;
  }

  await delay(300);
  const user = getCurrentUser();
  const effectiveUserId = getEffectiveUserId(user);
  const project = MOCK_PROJECTS.find((p) => p._id === projectId) || MOCK_PROJECTS[0];
  const members = MOCK_MEMBERS[projectId] || MOCK_MEMBERS['671f0001a1b2c3d4e5f60001'] || [];

  let userRole = 'MEMBER';
  let hasPendingLeaveRequest = false;
  let leaveRequestInfo = null;

  if (project.ownerId === effectiveUserId) {
    userRole = 'OWNER';
  } else {
    const myMembership = members.find((m) => m.userId === effectiveUserId || (user?.email && m.email === user.email));
    if (myMembership) {
      userRole = myMembership.role || 'MEMBER';
      hasPendingLeaveRequest = Boolean(myMembership.leavePending);
      if (hasPendingLeaveRequest) {
        leaveRequestInfo = {
          reason: myMembership.leaveReason || '',
          createdAt: myMembership.leaveDate || new Date().toISOString(),
        };
      }
    }
  }

  // Trích xuất thông tin đơn xin hủy đề tài đang chờ xét duyệt
  const pendingCancellation = MOCK_CANCELLATION_REQUESTS.find(
    (req) => req.projectId === projectId && req.status === 'PENDING'
  );
  const cancellationRequest = {
    hasPending: Boolean(pendingCancellation),
    requestInfo: pendingCancellation || null,
  };

  return {
    success: true,
    data: {
      project: { ...project, userRole },
      membership: {
        role: userRole,
        status: 'ACCEPTED',
        hasPendingLeaveRequest,
        leaveRequestInfo,
      },
      cancellationRequest,
    },
  };
}

/**
 * 3. Chỉnh sửa hồ sơ thuyết minh đề tài (FR03)
 */
export async function updateProjectApi(projectId, payload) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.put(`/projects/${projectId}`, payload);
    return response.data;
  }

  await delay(400);
  const existing = MOCK_PROJECTS.find((p) => p._id === projectId);
  if (existing) {
    Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
  }

  return {
    success: true,
    message: 'Cập nhật đề tài thành công.',
    data: { project: existing || { ...payload, _id: projectId } },
  };
}

/**
 * 4. Nộp hồ sơ đề tài chính thức / Nộp bài cuối cùng (FR03)
 */
export async function submitProjectApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/submit`);
    return response.data;
  }

  await delay(500);
  const existing = MOCK_PROJECTS.find((p) => p._id === projectId);
  const receipt = {
    hash: 'b5a9c84298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c99f',
    timestamp: new Date().toISOString(),
  };

  if (existing) {
    existing.status = 'SUBMITTED';
    existing.version = (existing.version || 1) + 1;
    existing.digitalReceiptHash = receipt.hash;
    existing.digitalReceiptTimestamp = receipt.timestamp;
  }

  return {
    success: true,
    message: 'Nộp đề tài thành công. Biên nhận số đã được gửi về email của nhóm.',
    data: {
      project: existing || { _id: projectId, status: 'SUBMITTED', version: 2 },
      digitalReceipt: receipt,
    },
  };
}

/**
 * 5. Lấy lịch sử các phiên bản đã nộp snapshot (ProjectRevision)
 */
export async function getProjectRevisionsApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.get(`/projects/${projectId}/revisions`);
    return response.data;
  }

  await delay(300);
  const revisions = MOCK_REVISIONS[projectId] || [
    {
      _id: 'rev001',
      versionNumber: 1,
      submittedAt: '2026-03-15T08:30:00.000Z',
      snapshotData: {
        title: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
        category: 'Nông nghiệp công nghệ cao',
        abstract: 'Ứng dụng công nghệ thị giác máy tính nhận diện sớm bệnh đạo ôn và rầy nâu trên lá lúa.',
        solution: 'Mô hình Deep Learning YOLOv8 kết hợp ứng dụng di động.',
      },
    },
  ];

  return {
    success: true,
    data: { revisions },
  };
}

/**
 * 6. Lấy danh sách mốc tiến độ của đề tài (FR05)
 */
export async function getMilestonesApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.get(`/projects/${projectId}/milestones`);
    return response.data;
  }

  await delay(300);
  const milestones = MOCK_MILESTONES[projectId] || MOCK_MILESTONES['671f0001a1b2c3d4e5f60001'] || [];

  return {
    success: true,
    data: { milestones },
  };
}

/**
 * 7. Nộp minh chứng mốc tiến độ (FR05)
 */
export async function submitEvidenceApi(projectId, milestoneId, payload) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/milestones/${milestoneId}/evidence`, payload);
    return response.data;
  }

  await delay(500);
  const milestones = MOCK_MILESTONES[projectId] || MOCK_MILESTONES['671f0001a1b2c3d4e5f60001'];
  if (milestones) {
    const ms = milestones.find((m) => m._id === milestoneId);
    if (!ms) {
      throw new Error('Không tìm thấy mốc tiến độ yêu cầu.');
    }

    if (ms.status === 'Completed' || ms.status === 'DONE') {
      throw new Error('Cột mốc này đã hoàn thành, không thể nộp thêm hoặc cập nhật minh chứng.');
    }

    ms.status = 'Completed';
    ms.evidence = {
      fileUrl: payload.fileUrl || 'https://storage.sess.ctuet.edu.vn/evidence/uploaded-evidence.pdf',
      fileName: payload.fileName || 'Minh-chung-tien-do.pdf',
      submittedAt: new Date().toISOString(),
      note: payload.note || 'Minh chứng đã được cập nhật.',
    };
    ms.mentorFeedback = 'Đã tiếp nhận minh chứng từ nhóm. Đang tiến hành thẩm định.';
  }

  return {
    success: true,
    message: 'Nộp minh chứng mốc tiến độ thành công.',
  };
}

/**
 * 8. Quản lý thành viên: Lấy danh sách thành viên (CHỈ HIỂN THỊ THÀNH VIÊN VÀ LỜI MỜI CHỜ, LOẠI BỎ NGƯỜI TỪ CHỐI)
 */
export async function getProjectMembersApi(projectId) {
  if (!USE_MOCK_DATA) {
    const res = await httpClient.get(`/projects/${projectId}/members`);
    return { success: true, data: { members: res.data?.data?.members || [] } };
  }

  await delay(250);
  const members = MOCK_MEMBERS[projectId] || MOCK_MEMBERS['671f0001a1b2c3d4e5f60001'] || [];
  // Tinh gọn danh sách: loại bỏ những người đã từ chối theo chỉ đạo của Yu
  const cleaned = members.filter((m) => m.status !== 'REJECTED');
  return { success: true, data: { members: cleaned } };
}

/**
 * 9. Quản lý thành viên: Mời thành viên mới bằng email trường (FR04)
 */
export async function inviteMemberApi(projectId, email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Vui lòng nhập email sinh viên.');
  }

  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/members/invite`, { email: normalizedEmail });
    return response.data;
  }

  await delay(400);
  const members = MOCK_MEMBERS[projectId] || [];

  // 1. Kiểm tra nếu sinh viên đã có trong nhóm
  const existing = members.find((m) => m.email.toLowerCase() === normalizedEmail);
  if (existing) {
    if (existing.status === 'ACCEPTED') {
      throw new Error('Sinh viên này đã là thành viên chính thức của nhóm.');
    }
    if (existing.status === 'INVITED') {
      throw new Error('Đã có lời mời đang chờ sinh viên này phản hồi.');
    }
  }

  // 2. Tra cứu thông tin sinh viên từ danh bạ mock
  const MOCK_NAME_MAP = {
    'ntmai2311040@student.ctuet.edu.vn': { name: 'Nguyễn Tuyết Mai', studentId: 'KTPM2311040' },
    'vthung2311041@student.ctuet.edu.vn': { name: 'Vũ Tiến Hùng', studentId: 'KTPM2311041' },
    'lhphuc2311030@student.ctuet.edu.vn': { name: 'Lê Hoàng Phúc', studentId: 'KTPM2311030' },
  };

  const studentInfo = MOCK_NAME_MAP[normalizedEmail] || {
    name: normalizedEmail.split('@')[0].toUpperCase(),
    studentId: normalizedEmail.split('@')[0].toUpperCase(),
  };

  const newInvitation = {
    _id: `inv_${Date.now()}`,
    targetEmail: normalizedEmail,
    projectId,
    projectCode: 'SESS-2026-004',
    projectTitle: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
    category: 'Nông nghiệp công nghệ cao',
    level: 'FACULTY',
    inviterName: user?.fullName || 'Đặng Tấn Kiệt',
    inviterEmail: 'dtkietktpm2311025@student.ctuet.edu.vn',
    createdAt: new Date().toISOString(),
  };
  MOCK_INVITATIONS.push(newInvitation);

  members.push({
    userId: `user_${Date.now()}`,
    fullName: studentInfo.name,
    email: normalizedEmail,
    studentId: studentInfo.studentId,
    role: 'MEMBER',
    status: 'INVITED',
    joinedAt: null,
  });
  MOCK_MEMBERS[projectId] = members;

  return {
    success: true,
    message: `Đã gửi lời mời tham gia đề tài tới ${normalizedEmail}.`,
  };
}

/**
 * 10. Quản lý thành viên: Xóa thành viên khỏi nhóm (FR04)
 */
export async function removeMemberApi(projectId, userId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  }

  await delay(350);
  const members = MOCK_MEMBERS[projectId] || MOCK_MEMBERS['671f0001a1b2c3d4e5f60001'];
  if (members) {
    const idx = members.findIndex((m) => m.userId === userId);
    if (idx !== -1) members.splice(idx, 1);
  }

  return {
    success: true,
    message: 'Đã xóa thành viên khỏi nhóm.',
  };
}

/**
 * 11. Quản lý thành viên: Thu hồi/Hủy lời mời đã gửi (FR04)
 */
export async function cancelInvitationApi(projectId, identifier) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.delete(`/projects/${projectId}/members/invitations/${identifier}`);
    return response.data;
  }

  await delay(300);
  const members = MOCK_MEMBERS[projectId];
  if (members) {
    const idx = members.findIndex(
      (m) => (m.userId === identifier || m.email === identifier) && m.status === 'INVITED'
    );
    if (idx !== -1) members.splice(idx, 1);
  }

  const invIdx = MOCK_INVITATIONS.findIndex(
    (i) => i.projectId === projectId && (i._id === identifier || i.targetEmail === identifier)
  );
  if (invIdx !== -1) MOCK_INVITATIONS.splice(invIdx, 1);

  return {
    success: true,
    message: 'Đã thu hồi lời mời tham gia đề tài.',
  };
}

/**
 * 12. Quản lý thành viên: Bàn giao quyền Trưởng nhóm TRỰC TIẾP (FR04 - Không qua Admin)
 */
export async function transferOwnershipApi(projectId, userId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/members/transfer-ownership`, { userId });
    return response.data;
  }

  await delay(400);
  const members = MOCK_MEMBERS[projectId] || MOCK_MEMBERS['671f0001a1b2c3d4e5f60001'];
  if (members) {
    members.forEach((m) => {
      if (m.userId === userId) m.role = 'OWNER';
      else if (m.role === 'OWNER') m.role = 'MEMBER';
    });
  }

  const project = MOCK_PROJECTS.find((p) => p._id === projectId);
  if (project) {
    project.ownerId = userId;
  }

  return {
    success: true,
    message: 'Đã bàn giao quyền Trưởng nhóm thành công!',
  };
}

/**
 * 13. Thành viên nộp đơn xin rời nhóm (Cần Admin duyệt)
 */
export async function requestLeaveProjectApi(projectId, { reason }) {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Vui lòng nêu rõ lý do xin rời nhóm (tối thiểu 10 ký tự).');
  }

  if (!USE_MOCK_DATA) {
    const response = await httpClient.post(`/projects/${projectId}/members/leave-request`, { reason: reason.trim() });
    return response.data;
  }

  await delay(400);
  const user = getCurrentUser();
  const effectiveUserId = getEffectiveUserId(user);
  const members = MOCK_MEMBERS[projectId] || [];
  const targetMember = members.find((m) => m.userId === effectiveUserId || (user && m.userId === user.id) || (user?.email && m.email === user.email));

  if (targetMember) {
    targetMember.leavePending = true;
    targetMember.leaveReason = reason.trim();
    targetMember.leaveDate = new Date().toISOString();
  }

  MOCK_LEAVE_REQUESTS.push({
    _id: `leave_req_${Date.now()}`,
    projectId,
    userId: user?.id,
    userName: user?.fullName,
    userEmail: user?.email,
    studentId: user?.studentId,
    reason: reason.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: 'Đã gửi đơn xin rời nhóm. Đơn của bạn đang được Ban Quản trị xem xét phê duyệt.',
  };
}

/**
 * 14. Thành viên hủy đơn xin rời nhóm đang chờ duyệt
 */
export async function cancelLeaveRequestApi(projectId) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.delete(`/projects/${projectId}/members/leave-request`);
    return response.data;
  }

  await delay(300);
  const user = getCurrentUser();
  const effectiveUserId = getEffectiveUserId(user);
  const members = MOCK_MEMBERS[projectId] || [];
  const targetMember = members.find((m) => m.userId === effectiveUserId || (user && m.userId === user.id) || (user?.email && m.email === user.email));

  if (targetMember) {
    targetMember.leavePending = false;
    delete targetMember.leaveReason;
    delete targetMember.leaveDate;
  }

  const reqIdx = MOCK_LEAVE_REQUESTS.findIndex((r) => r.projectId === projectId && r.userId === user?.id);
  if (reqIdx !== -1) {
    MOCK_LEAVE_REQUESTS.splice(reqIdx, 1);
  }

  return {
    success: true,
    message: 'Đã hủy đơn xin rời nhóm thành công.',
  };
}

/**
 * 15. Lấy danh sách các lời mời tham gia đề tài gửi đến sinh viên (FR04)
 */
export async function getMyInvitationsApi() {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.get('/projects/invitations/me');
    return response.data;
  }

  await delay(250);
  const user = getCurrentUser();
  let invitations = [...MOCK_INVITATIONS];

  // Lọc lời mời gửi riêng cho email sinh viên đang đăng nhập
  if (user?.email) {
    invitations = invitations.filter(
      (inv) => !inv.targetEmail || inv.targetEmail.toLowerCase() === user.email.toLowerCase()
    );
  }

  return {
    success: true,
    data: { invitations },
  };
}

/**
 * 16. Phản hồi lời mời tham gia đề tài (ACCEPTED hoặc REJECTED)
 * - Khi ACCEPTED: Kiểm tra sinh viên có đề tài active chưa. Nếu có -> chặn lại và báo lỗi.
 * - Khi REJECTED: XÓA HOÀN TOÀN KHỎI DANH SÁCH NHÓM ĐỂ KHÔNG BỊ RỐI (theo chỉ đạo của Yu), đồng thời gửi thông báo đến Trưởng nhóm.
 */
export async function respondInvitationApi(invitationId, response) {
  if (!USE_MOCK_DATA) {
    const res = await httpClient.post(`/projects/invitations/${invitationId}/respond`, { response });
    return res.data;
  }

  await delay(400);
  const user = getCurrentUser();
  const idx = MOCK_INVITATIONS.findIndex((i) => i._id === invitationId);
  if (idx === -1) {
    return { success: false, message: 'Không tìm thấy lời mời.' };
  }
  const inv = MOCK_INVITATIONS[idx];

  // TRƯỜNG HỢP 1: CHẤP NHẬN LỜI MỜI
  if (response === 'ACCEPTED') {
    const effectiveUserId = getEffectiveUserId(user);
    // Kiểm tra sinh viên đã có đề tài active khác (khác COMPLETED và REJECTED)
    const activeProject = MOCK_PROJECTS.find((p) => {
      const isActiveStatus = p.status !== 'COMPLETED' && p.status !== 'REJECTED';
      if (!isActiveStatus) return false;
      if (p.ownerId === effectiveUserId || (user && p.ownerId === user.id)) return true;
      const mems = MOCK_MEMBERS[p._id] || [];
      return mems.some(
        (m) =>
          (m.userId === effectiveUserId || (user && m.userId === user.id) || (user?.email && m.email === user.email)) &&
          m.status === 'ACCEPTED'
      );
    });

    if (activeProject && activeProject._id !== inv.projectId) {
      throw new Error(
        `Bạn đang tham gia đề tài ${activeProject.code} đang hoạt động. Theo quy chế SESS, mỗi sinh viên chỉ được tham gia duy nhất 1 đề tài active. Vui lòng hoàn thành hoặc được Admin duyệt rời đề tài cũ trước khi tham gia đề tài mới.`
      );
    }

    // Tham gia thành công: Xóa lời mời
    MOCK_INVITATIONS.splice(idx, 1);

    // Cập nhật thành viên chính thức trong MOCK_MEMBERS
    const projectMembers = MOCK_MEMBERS[inv.projectId] || [];
    const existingMember = projectMembers.find(
      (m) => (user && m.userId === user.id) || (user?.email && m.email === user.email) || (inv.targetEmail && m.email === inv.targetEmail)
    );

    if (existingMember) {
      existingMember.status = 'ACCEPTED';
      existingMember.joinedAt = new Date().toISOString();
      if (user?.id) existingMember.userId = user.id;
      if (user?.fullName) existingMember.fullName = user.fullName;
      if (user?.studentId) existingMember.studentId = user.studentId;
    } else {
      projectMembers.push({
        userId: user?.id || `user_${Date.now()}`,
        fullName: user?.fullName || 'Sinh viên mới',
        email: user?.email || inv.targetEmail || '',
        studentId: user?.studentId || 'KTPM2311040',
        role: 'MEMBER',
        status: 'ACCEPTED',
        joinedAt: new Date().toISOString(),
      });
    }
    MOCK_MEMBERS[inv.projectId] = projectMembers;

    return {
      success: true,
      message: `Đã tham gia đề tài ${inv.projectCode || ''} thành công!`,
    };
  }

  // TRƯỜNG HỢP 2: TỪ CHỐI LỜI MỜI
  if (response === 'REJECTED') {
    MOCK_INVITATIONS.splice(idx, 1);

    // Xóa hoàn toàn bản ghi khỏi danh sách nhóm để danh sách luôn tinh gọn và không bị rối (Yu chỉ đạo)
    const projectMembers = MOCK_MEMBERS[inv.projectId];
    if (projectMembers) {
      const mIdx = projectMembers.findIndex(
        (m) =>
          (user && m.userId === user.id) ||
          (user?.email && m.email === user.email) ||
          (inv.targetEmail && m.email === inv.targetEmail)
      );
      if (mIdx !== -1) {
        projectMembers.splice(mIdx, 1);
      }
    }

    // Bắn thông báo về chuông thông báo của Trưởng nhóm
    const inviterName = user?.fullName || inv.targetEmail || 'Một sinh viên';
    notificationService.addNotification({
      title: 'Lời mời tham gia bị từ chối',
      message: `Sinh viên ${inviterName} đã từ chối lời mời tham gia đề tài ${inv.projectCode}.`,
      type: 'system',
    });

    return {
      success: true,
      message: 'Bạn đã từ chối lời mời tham gia đề tài.',
    };
  }
}

/**
 * 17. Khởi tạo đề tài mới (FR03)
 */
export async function createProjectApi(payload) {
  if (!USE_MOCK_DATA) {
    const response = await httpClient.post('/projects', payload);
    return response.data;
  }

  await delay(500);
  const user = getCurrentUser();
  const newProject = {
    _id: `proj_${Date.now()}`,
    code: `SESS-${new Date().getFullYear()}-${String(MOCK_PROJECTS.length + 1).padStart(3, '0')}`,
    title: payload.title || 'Đề tài mới',
    category: payload.category || 'Công nghệ thông tin',
    field: payload.category || 'Công nghệ thông tin',
    abstract: payload.abstract || '',
    problemStatement: payload.problemStatement || '',
    solution: payload.solution || '',
    businessModel: payload.businessModel || '',
    attachmentUrl: payload.attachmentUrl || '',
    status: 'DRAFT',
    version: 1,
    currentVersion: 1,
    level: 'FACULTY',
    ownerId: user?.id || '671f0000user0001',
    userRole: 'OWNER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MOCK_PROJECTS.unshift(newProject);
  MOCK_MEMBERS[newProject._id] = [
    {
      userId: user?.id || '671f0000user0001',
      fullName: user?.fullName || 'Đặng Tấn Kiệt',
      email: user?.email || 'dtkietktpm2311025@student.ctuet.edu.vn',
      studentId: user?.studentId || 'KTPM2311025',
      role: 'OWNER',
      status: 'ACCEPTED',
      joinedAt: new Date().toISOString(),
    },
  ];

  return {
    success: true,
    message: 'Khởi tạo đề tài mới thành công.',
    data: { project: newProject },
  };
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
 * Helper: Tính toán điều kiện đăng ký đề tài mới (Quota 1 active/sinh viên)
 */
export function evaluateProjectEligibility(projects = []) {
  const activeStatuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'UNDER_MENTORSHIP', 'NEED_REVISION', 'APPROVED', 'EVALUATED'];
  const activeProject = projects.find((p) => activeStatuses.includes(p.status) && !p.parentId);

  if (activeProject) {
    return {
      canRegister: false,
      activeProject,
      reason: `Bạn đang tham gia đề tài ${activeProject.code} (${activeProject.status}). Theo quy chế SESS, bạn cần hoàn thành đề tài hiện tại trước khi đăng ký đề tài mới.`,
    };
  }

  return {
    canRegister: true,
    activeProject: null,
    reason: 'Bạn đủ điều kiện đăng ký đề tài khởi nghiệp mới cho năm nay.',
  };
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
};

export default projectService;

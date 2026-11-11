/**
 * Script seed dữ liệu thực tế end-to-end cho nhánh dev.
 * Chạy trực tiếp vào MongoDB local (mongodb://127.0.0.1:27017/sess_db).
 *
 * Tạo:
 *  - Tài khoản Giám khảo: tunkitdu76@gmail.com / Tuankiet@7676 (role: judge, JudgeWhitelist)
 *  - Tài khoản Sinh viên mẫu: dtkietktpm2311025@student.ctuet.edu.vn / Student@12345
 *    (role: student, StudentWhitelist + UserProfile)
 *  - 3 Dự án của sinh viên (đầy đủ trường: tên, mã, lĩnh vực, mô tả, vấn đề, giải pháp, BM, link tài liệu)
 *  - 1 EvaluationRubric (tiêu chí tổng trọng số 100%)
 *  - 2 HumanEvaluation (1 DRAFT, 1 SUBMITTED) gán cho Giám khảo
 */
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const UserProfile = require('../src/models/UserProfile');
const StudentWhitelist = require('../src/models/StudentWhitelist');
const JudgeWhitelist = require('../src/models/JudgeWhitelist');
const Project = require('../src/models/Project');
const EvaluationRubric = require('../src/models/EvaluationRubric');
const EvaluationRound = require('../src/models/EvaluationRound');
const HumanEvaluation = require('../src/models/HumanEvaluation');

const { USER_ROLES, USER_STATUS, AUTH_PROVIDERS } = require('../src/utils/constants');

const hashPassword = async (pw) => bcrypt.hash(pw, env.bcryptSaltRounds);

const seed = async () => {
  await mongoose.connect(env.mongoUri);
  console.log('[Seed] Connected to MongoDB:', env.mongoUri);

  // --- 1. Tài khoản Giám khảo ---
  const judgePasswordHash = await hashPassword('Tuankiet@7676');
  let judge = await User.findOne({ email: 'tunkitdu76@gmail.com' });
  if (!judge) {
    judge = await User.create({
      email: 'tunkitdu76@gmail.com',
      password: judgePasswordHash,
      passwordHash: judgePasswordHash,
      role: USER_ROLES.JUDGE,
      systemRole: USER_ROLES.JUDGE,
      fullName: 'Dư Tuấn Kiệt',
      status: USER_STATUS.ACTIVE,
      authProvider: AUTH_PROVIDERS.LOCAL,
      isEmailVerified: true,
    });
    console.log('[Seed] Tạo Judge user: tunkitdu76@gmail.com');
  } else {
    judge.set({
      password: judgePasswordHash,
      passwordHash: judgePasswordHash,
      role: USER_ROLES.JUDGE,
      systemRole: USER_ROLES.JUDGE,
      fullName: 'Dư Tuấn Kiệt',
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });
    await judge.save();
    console.log('[Seed] Cập nhật Judge user: tunkitdu76@gmail.com');
  }

  await JudgeWhitelist.findOneAndUpdate(
    { email: 'tunkitdu76@gmail.com' },
    {
      fullName: 'Dư Tuấn Kiệt',
      staffCode: 'JDG001',
      email: 'tunkitdu76@gmail.com',
      phone: '0901234567',
      faculty: 'Công nghệ Thông tin',
      isImported: true,
    },
    { upsert: true, new: true },
  );
  console.log('[Seed] JudgeWhitelist: tunkitdu76@gmail.com');

  // --- 2. Tài khoản Sinh viên mẫu ---
  const studentPasswordHash = await hashPassword('Student@12345');
  let student = await User.findOne({ email: 'dtkietktpm2311025@student.ctuet.edu.vn' });
  if (!student) {
    student = await User.create({
      email: 'dtkietktpm2311025@student.ctuet.edu.vn',
      password: studentPasswordHash,
      passwordHash: studentPasswordHash,
      role: USER_ROLES.STUDENT,
      systemRole: USER_ROLES.STUDENT,
      fullName: 'Đặng Tấn Kiệt',
      studentId: 'KTPM2311025',
      className: 'KTPM2311',
      faculty: 'Khoa Công nghệ Thông tin',
      advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
      status: USER_STATUS.ACTIVE,
      authProvider: AUTH_PROVIDERS.LOCAL,
      isEmailVerified: true,
    });
    console.log('[Seed] Tạo Student user: dtkietktpm2311025@student.ctuet.edu.vn');
  } else {
    student.set({
      password: studentPasswordHash,
      passwordHash: studentPasswordHash,
      role: USER_ROLES.STUDENT,
      systemRole: USER_ROLES.STUDENT,
      fullName: 'Đặng Tấn Kiệt',
      studentId: 'KTPM2311025',
      className: 'KTPM2311',
      faculty: 'Khoa Công nghệ Thông tin',
      advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });
    await student.save();
    console.log('[Seed] Cập nhật Student user: dtkietktpm2311025@student.ctuet.edu.vn');
  }

  await StudentWhitelist.findOneAndUpdate(
    { email: 'dtkietktpm2311025@student.ctuet.edu.vn' },
    {
      studentId: 'KTPM2311025',
      fullName: 'Đặng Tấn Kiệt',
      className: 'KTPM2311',
      faculty: 'Khoa Công nghệ Thông tin',
      phone: '0901234567',
      advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
      isImported: true,
    },
    { upsert: true, new: true },
  );
  console.log('[Seed] StudentWhitelist: dtkietktpm2311025@student.ctuet.edu.vn');

  await UserProfile.findOneAndUpdate(
    { userId: student._id },
    {
      userId: student._id,
      email: student.email,
      fullName: student.fullName,
      studentId: student.studentId,
      className: student.className,
      faculty: student.faculty,
      advisorEmail: student.advisorEmail,
      bio: 'Sinh viên khoa Công nghệ Thông tin, đam mê khởi nghiệp và phát triển giải pháp AI ứng dụng.',
      skills: ['Machine Learning', 'Computer Vision', 'React Native', 'Node.js'],
      phone: '0901234567',
      avatarUrl: '',
      socialLinks: { github: '', linkedin: '', facebook: '', website: '' },
    },
    { upsert: true, new: true },
  );
  console.log('[Seed] UserProfile cho sinh viên');

  // --- 3. Dự án của sinh viên ---
  const now = new Date();

  const projectPayloads = [
    {
      code: 'SESS-2026-004',
      title: 'Hệ thống AI Cảnh báo Sâu bệnh Lúa vùng Đồng bằng Sông Cửu Long',
      category: 'Nông nghiệp công nghệ cao',
      field: 'Nông nghiệp công nghệ cao',
      faculty: 'Khoa Công nghệ Thông tin',
      abstract: 'Ứng dụng công nghệ thị giác máy tính nhận diện sớm bệnh đạo ôn và rầy nâu trên lá lúa qua thiết bị di động.',
      problemStatement: 'Bà con nông dân gặp khó khăn trong việc phát hiện sâu bệnh kịp thời dẫn đến thiệt hại mùa màng nghiêm trọng.',
      solution: 'Mô hình Deep Learning YOLOv8 kết hợp ứng dụng di động cho kết quả chẩn đoán chính xác 96% trong 3 giây.',
      businessModel: 'Cung cấp giải pháp phần mềm miễn phí cho nông dân, thu phí bản quyền từ các hợp tác xã nông nghiệp.',
      attachmentUrl: 'https://docs.google.com/document/d/158-TB-DHKTCN-CTUTSTARTUP2025-Demo/edit',
      status: 'UNDER_MENTORSHIP',
      version: 1,
      currentVersion: 1,
      level: 'FACULTY',
      ownerId: student._id,
      userRole: 'OWNER',
      advisorInfo: {
        hasAdvisor: true,
        fullName: 'TS. Nguyễn Văn Hướng',
        email: 'nvhuong@ctuet.edu.vn',
        phone: '0912345678',
        department: 'Khoa Công nghệ Thông tin',
        academicRank: 'Giảng viên',
      },
      leaderInfo: {
        fullName: 'Đặng Tấn Kiệt',
        studentId: 'KTPM2311025',
        className: 'KTPM2311',
        faculty: 'Khoa Công nghệ Thông tin',
        email: 'dtkietktpm2311025@student.ctuet.edu.vn',
        phone: '0901234567',
      },
      digitalReceiptHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      digitalReceiptTimestamp: new Date('2026-03-15T08:30:00Z'),
      createdAt: new Date('2026-03-10T02:00:00Z'),
      updatedAt: now,
    },
    {
      code: 'SESS-2026-009',
      title: 'Ứng dụng AI Hỗ trợ Phân loại và Tái chế Rác thải Y tế',
      category: 'Y tế & Đời sống',
      field: 'Y tế & Đời sống',
      faculty: 'Khoa Điện - Điện tử - Viễn thông',
      abstract: 'Giải pháp tự động phân loại rác thải y tế nguy hại sử dụng camera thị giác máy tính và cánh tay robot.',
      problemStatement: 'Nguy cơ lây nhiễm chéo cao khi nhân viên y tế phân loại rác thủ công.',
      solution: 'Mô hình ResNet50 kết hợp cảm biến siêu âm phát hiện và gắp rác tự động vào thùng chuyên dụng.',
      businessModel: 'Bán giải pháp cho các bệnh viện đa khoa và trung tâm y tế dự phòng.',
      attachmentUrl: 'https://docs.google.com/document/d/sess-2026-009-thuyet-minh/edit',
      status: 'UNDER_MENTORSHIP',
      version: 1,
      currentVersion: 1,
      level: 'FACULTY',
      ownerId: student._id,
      userRole: 'OWNER',
      advisorInfo: {
        hasAdvisor: true,
        fullName: 'ThS. Trần Thị Mai',
        email: 'ttmai@ctuet.edu.vn',
        phone: '0987654321',
        department: 'Khoa Điện - Điện tử',
        academicRank: 'Thạc sĩ',
      },
      leaderInfo: {
        fullName: 'Lê Hoàng Phúc',
        studentId: 'KTPM2311030',
        className: 'KTPM0223',
        faculty: 'Khoa Điện - Điện tử - Viễn thông',
        email: 'lhphuc2311030@student.ctuet.edu.vn',
        phone: '0933445566',
      },
      digitalReceiptHash: 'c7d2e14298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c77d',
      digitalReceiptTimestamp: new Date('2026-03-18T08:30:00Z'),
      createdAt: new Date('2026-03-15T02:00:00Z'),
      updatedAt: now,
    },
    {
      code: 'SESS-2025-012',
      title: 'Nền tảng Số hóa và Truy xuất Nguồn gốc Nông sản Bằng Blockchain',
      category: 'Công nghệ thông tin',
      field: 'Công nghệ thông tin',
      faculty: 'Khoa Công nghệ Thông tin',
      abstract: 'Giải pháp ứng dụng chuỗi khối phân tán bảo đảm tính minh bạch và chống giả mạo tem truy xuất nguồn gốc.',
      problemStatement: 'Gian lận thương mại và giả mạo nguồn gốc nông sản hữu cơ gây mất niềm tin của người tiêu dùng.',
      solution: 'Smart contract trên nền tảng Hyperledger Fabric kết hợp tem mã hóa QR động.',
      businessModel: 'Phí dịch vụ tem số hóa trên mỗi lô hàng của doanh nghiệp xuất khẩu.',
      attachmentUrl: 'https://docs.google.com/document/d/sess-2025-012-blockchain/edit',
      status: 'COMPLETED',
      version: 2,
      currentVersion: 2,
      level: 'UNIVERSITY',
      ownerId: student._id,
      userRole: 'OWNER',
      advisorInfo: {
        hasAdvisor: true,
        fullName: 'TS. Nguyễn Văn Hướng',
        email: 'nvhuong@ctuet.edu.vn',
        phone: '0912345678',
        department: 'Khoa Công nghệ Thông tin',
        academicRank: 'Giảng viên',
      },
      leaderInfo: {
        fullName: 'Đặng Tấn Kiệt',
        studentId: 'KTPM2311025',
        className: 'KTPM2311',
        faculty: 'Khoa Công nghệ Thông tin',
        email: 'dtkietktpm2311025@student.ctuet.edu.vn',
        phone: '0901234567',
      },
      award: {
        rank: 'FIRST_PRIZE',
        prizeName: 'Giải Nhất',
        cashAmount: 15000000,
        competitionName: 'Cuộc thi Khởi nghiệp Sinh viên CTUT 2025',
        round: 'Vòng Chung kết',
        stage: 'FINAL',
        awardedAt: new Date('2025-12-20'),
      },
      digitalReceiptHash: 'a4f89d9876fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b89c',
      digitalReceiptTimestamp: new Date('2025-11-20T09:15:00Z'),
      createdAt: new Date('2025-03-10T02:00:00Z'),
      updatedAt: new Date('2025-12-05T14:00:00Z'),
    },
  ];

  const createdProjects = [];
  for (const p of projectPayloads) {
    const existing = await Project.findOne({ code: p.code });
    if (existing) {
      existing.set(p);
      await existing.save();
      createdProjects.push(existing);
      console.log(`[Seed] Cập nhật dự án: ${p.code} (${p.title})`);
    } else {
      const created = await Project.create(p);
      createdProjects.push(created);
      console.log(`[Seed] Tạo dự án: ${p.code} (${p.title})`);
    }
  }

  // --- 4. EvaluationRubric (tổng trọng số 100%) ---
  let rubric = await EvaluationRubric.findOne({ name: 'Rubric Đánh giá Khởi nghiệp Sinh viên CTUT', status: 'Active' });
  if (!rubric) {
    rubric = await EvaluationRubric.create({
      name: 'Rubric Đánh giá Khởi nghiệp Sinh viên CTUT',
      description: 'Bộ tiêu chí đánh giá toàn diện cho đề tài khởi nghiệp sinh viên',
      version: 1,
      status: 'Active',
      totalWeight: 100,
      createdBy: judge._id,
      criteria: [
        { name: 'Định ý & Độc đáo', description: 'Tính mới mẻ và độc đáo của ý tưởng khởi nghiệp', weight: 25, minScore: 0, maxScore: 10, order: 1 },
        { name: 'Giải pháp kỹ thuật', description: 'Chất lượng và khả năng thực hiện của giải pháp', weight: 25, minScore: 0, maxScore: 10, order: 2 },
        { name: 'Mô hình kinh doanh', description: 'Tính khả thi và khả năng mở rộng của mô hình kinh doanh', weight: 20, minScore: 0, maxScore: 10, order: 3 },
        { name: 'Tác động xã hội', description: 'Tác động tích cực đến cộng đồng và môi trường', weight: 15, minScore: 0, maxScore: 10, order: 4 },
        { name: 'Trình bày & Tài liệu', description: 'Chất lượng trình bày, pitch deck và tài liệu đính kèm', weight: 15, minScore: 0, maxScore: 10, order: 5 },
      ],
    });
    console.log('[Seed] Tạo EvaluationRubric (tổng trọng số 100%)');
  }

  // --- 5. EvaluationRound (bắt buộc cho HumanEvaluation) ---
  let round = await EvaluationRound.findOne({ roundName: 'Vòng Đánh giá Đề tài Khởi nghiệp 2026' });
  if (!round) {
    round = await EvaluationRound.create({
      roundNumber: 1,
      roundName: 'Vòng Đánh giá Đề tài Khởi nghiệp 2026',
      rubricId: rubric._id,
      status: 'OPEN',
      stageType: 'OTHER',
      description: 'Vòng đánh giá Ban Giám khảo cho các đề tài sinh viên',
      submissionOpenAt: new Date('2026-01-01'),
      submissionCloseAt: new Date('2026-12-31'),
      scoringOpenAt: new Date('2026-01-01'),
      scoringCloseAt: new Date('2026-12-31'),
      isActive: true,
      isPublished: true,
      publishedAt: now,
      createdBy: judge._id,
    });
    console.log('[Seed] Tạo EvaluationRound');
  }

  // --- 6. HumanEvaluation (1 DRAFT, 1 SUBMITTED) cho Judge ---
  const projDraft = createdProjects[0]; // SESS-2026-004 (UNDER_MENTORSHIP)
  const projSubmitted = createdProjects[1]; // SESS-2026-009 (UNDER_MENTORSHIP)

  let evalDraft = await HumanEvaluation.findOne({
    projectId: projDraft._id,
    evaluatorId: judge._id,
  });
  if (!evalDraft) {
    evalDraft = await HumanEvaluation.create({
      projectId: projDraft._id,
      evaluatorId: judge._id,
      evaluationRoundId: round._id,
      rubricVersionId: rubric._id,
      scores: rubric.criteria.map((c) => ({
        criterionId: c._id,
        score: 0,
        comment: '',
      })),
      totalScore: 0,
      generalFeedback: '',
      status: 'DRAFT',
      submittedAt: null,
    });
    console.log('[Seed] Tạo HumanEvaluation DRAFT cho dự án:', projDraft.code);
  }

  let evalSubmitted = await HumanEvaluation.findOne({
    projectId: projSubmitted._id,
    evaluatorId: judge._id,
  });
  if (!evalSubmitted) {
    const scores = rubric.criteria.map((c, i) => ({
      criterionId: c._id,
      score: 8 + i,
      comment: i === 0 ? 'Ý tưởng rất mới mẻ và có tiềm năng ứng dụng cao.' : '',
    }));
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    evalSubmitted = await HumanEvaluation.create({
      projectId: projSubmitted._id,
      evaluatorId: judge._id,
      evaluationRoundId: round._id,
      rubricVersionId: rubric._id,
      scores,
      totalScore,
      generalFeedback: 'Giải pháp kỹ thuật tốt, mô hình kinh doanh rõ ràng. Đề xuất cải thiện phần trình bày tài liệu.',
      status: 'SUBMITTED',
      submittedAt: now,
    });
    console.log('[Seed] Tạo HumanEvaluation SUBMITTED cho dự án:', projSubmitted.code);
  }

  console.log('[Seed] HOÀN TẤT tất cả dữ liệu mẫu.');
  console.log('');
  console.log('========================================');
  console.log('THÔNG TIN ĐĂNG NHẬP MẪU:');
  console.log('----------------------------------------');
  console.log('Giám khảo:  tunkitdu76@gmail.com / Tuankiet@7676');
  console.log('Sinh viên:  dtkietktpm2311025@student.ctuet.edu.vn / Student@12345');
  console.log('========================================');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('[Seed] Lỗi:', err);
  process.exit(1);
});

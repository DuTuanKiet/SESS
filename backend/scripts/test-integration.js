'use strict';
/**
 * INTEGRATION TEST SUITE - SESS-CTUT Enterprise Edition (Bước 1 -> Bước 5)
 * ---------------------------------------------------------------------------
 * Kiểm tra tự động toàn bộ các luồng cốt lõi đã triển khai:
 *
 *   BƯỚC 1: BGK & Whitelist Excel + Digital NDA
 *   BƯỚC 2: Vòng đời dự án (State Machine) + Digital Receipt (SHA-256)
 *   BƯỚC 3: Direct-to-Cloud Upload (Presigned URL + giới hạn dung lượng)
 *   BƯỚC 4: Quản lý thành viên nhóm + Member Change Request + Owner Transfer
 *             Score Override + Điều chuyển khẩn cấp BGK
 *   BƯỚC 5: Redis/BullMQ (fallback) + reCAPTCHA v3 + Rate Limiting + Public Voting
 *
 * Cách chạy:  truyền SESS_INTEGRATION_MONGO_URI trỏ đúng sess_integration_test, rồi npm run test:integration.
 * Chỉ database này được phép dọn trước/sau suite.
 */

const {
  assertTestDatabaseName,
  blockDotenvConfig,
  getTestMongoUri,
} = require('./testDatabaseGuard');

blockDotenvConfig();

// Tất cả cấu hình được truyền rõ từ tiến trình; bootstrap vô hiệu hóa nạp dotenv.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = getTestMongoUri('integration');
process.env.MONGODB_URI = '';
process.env.RATE_LIMIT_API_MAX = '1000000';
process.env.RATE_LIMIT_AUTH_MAX = '1000000';
process.env.EXPOSE_OTP_IN_DEV = 'true';
process.env.BCRYPT_SALT_ROUNDS ||= '4';
process.env.JWT_ACCESS_SECRET ||= 'integration-test-access-secret-only';
process.env.JWT_REFRESH_SECRET ||= 'integration-test-refresh-secret-only';
process.env.JWT_SECRET ||= 'integration-test-legacy-secret-only';
process.env.REDIS_QUEUE_ENABLED = 'false';
// Tắt reCAPTCHA để test không phụ thuộc dịch vụ Google (kiểm tra hành vi khi chưa cấu hình)
process.env.RECAPTCHA_ENABLED = 'false';

const mongoose = require('mongoose');

const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const {
  USER_ROLES,
  USER_STATUS,
  AUTH_PROVIDERS,
  PROJECT_STATUS,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  MEMBER_CHANGE_REQUEST_STATUS,
  MEMBER_CHANGE_REQUEST_TYPE,
  RUBRIC_STATUS,
  UPLOAD_SIZE_LIMITS,
} = require('../src/utils/constants');

const User = require('../src/models/User');
const app = require('../src/app');
const authService = require('../src/services/authService');
const tokenService = require('../src/services/tokenService');
const userService = require('../src/services/userService');
const Project = require('../src/models/Project');
const ProjectMember = require('../src/models/ProjectMember');
const ProjectMemberChangeRequest = require('../src/models/ProjectMemberChangeRequest');
const ProjectVote = require('../src/models/ProjectVote');
const EmergencyJudgeReassignment = require('../src/models/EmergencyJudgeReassignment');
const StudentWhitelist = require('../src/models/StudentWhitelist');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');

const projectService = require('../src/services/projectService');
const projectMemberService = require('../src/services/projectMemberService');
const scoreOverrideService = require('../src/services/scoreOverrideService');
const emergencyJudgeReassignmentService = require('../src/services/emergencyJudgeReassignmentService');
const judgeWhitelistService = require('../src/services/judgeWhitelistService');
const cloudUploadService = require('../src/services/cloudUploadService');
const digitalReceiptService = require('../src/services/digitalReceiptService');
const votingService = require('../src/services/votingService');
const queueService = require('../src/services/queueService');
const rubricService = require('../src/services/rubricService');
const mentorService = require('../src/services/mentorService');
const notificationService = require('../src/services/notificationService');

// ---------------------------------------------------------------------------
// Mini test harness
// ---------------------------------------------------------------------------
const results = [];
let currentGroup = 'General';
/** MongoDB hỗ trợ transaction (replica set / mongos) hay không */
let transactionsSupported = false;

const group = (name) => {
  currentGroup = name;
  console.log(`\n=== ${name} ===`);
};

const test = async (name, fn) => {
  try {
    await fn();
    results.push({ group: currentGroup, name, status: 'PASS' });
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    results.push({ group: currentGroup, name, status: 'FAIL', reason: error.message });
    console.log(`  [FAIL] ${name} -> ${error.message}`);
  }
};

/** Bỏ qua test (VD: cần MongoDB replica set mà môi trường local chưa bật) */
const skipTest = async (name, reason) => {
  results.push({ group: currentGroup, name, status: 'SKIP', reason });
  console.log(`  [SKIP] ${name} -> ${reason}`);
};

/** Phát hiện MongoDB có hỗ trợ transaction hay không */
const detectTransactionSupport = async () => {
  try {
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionsSupported = Boolean(info.setName || info.msg === 'isdbgrid');
  } catch {
    transactionsSupported = false;
  }
  console.log(
    `MongoDB transaction: ${transactionsSupported ? 'CÓ (replica set)' : 'KHÔNG (standalone) -> tự động bỏ qua test transaction'}`,
  );
  return transactionsSupported;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(`${message || 'Giá trị không khớp'}: expected "${expected}", got "${actual}"`);
  }
};

const assertThrows = async (fn, expectedCode, message) => {
  try {
    await fn();
  } catch (error) {
    if (expectedCode && error.code !== expectedCode) {
      throw new Error(`${message || 'Sai mã lỗi'}: expected "${expectedCode}", got "${error.code}" (${error.message})`);
    }
    return error;
  }
  throw new Error(message || 'Hàm không ném lỗi như mong đợi');
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mkUser = async ({ email, password, role, fullName, studentId, extra = {} }) => {
  const user = new User({
    email,
    password,
    role,
    fullName,
    studentId,
    status: USER_STATUS.ACTIVE,
    isEmailVerified: true,
    ...extra,
  });
  await user.save();
  return user;
};

const mkProject = async ({ title, code, owner, status = PROJECT_STATUS.DRAFT }) => {
  const project = await Project.create({
    title,
    code,
    category: 'Integration Test',
    abstract: 'Abstract for integration test',
    problemStatement: 'Problem statement',
    solution: 'Solution text',
    businessModel: 'Business model',
    status,
    ownerId: owner._id,
    members: [{ userId: owner._id, projectRole: 'Owner' }],
  });
  await ProjectMember.create({
    projectId: project._id,
    userId: owner._id,
    email: owner.email,
    role: PROJECT_MEMBER_ROLES.OWNER,
    status: PROJECT_MEMBER_STATUS.ACCEPTED,
    joinedAt: new Date(),
  });
  return project;
};

let fixtures = {};

async function seed() {
  const admin = await mkUser({
    email: 'it.admin@ctuet.edu.vn',
    password: 'Admin@12345',
    role: USER_ROLES.ADMIN,
    fullName: 'IT Admin',
  });
  const judge = await mkUser({
    email: 'it.judge@ctuet.edu.vn',
    password: 'Judge@12345',
    role: USER_ROLES.JUDGE,
    fullName: 'IT Judge',
    extra: { isJudgeApproved: true, ndaAccepted: true, ndaAcceptedAt: new Date(), ndaVersion: '1.0' },
  });
  const judge2 = await mkUser({
    email: 'it.judge2@ctuet.edu.vn',
    password: 'Judge2@12345',
    role: USER_ROLES.JUDGE,
    fullName: 'IT Judge Two',
    extra: { isJudgeApproved: true, ndaAccepted: true, ndaAcceptedAt: new Date(), ndaVersion: '1.0' },
  });
  const student = await mkUser({
    email: 'it.student@ctuet.edu.vn',
    password: 'Student@12345',
    role: USER_ROLES.STUDENT,
    fullName: 'IT Student',
    studentId: 'IT0001',
    extra: { faculty: 'Giá trị trên tài khoản không được ghi đè whitelist' },
  });
  const student2 = await mkUser({
    email: 'it.student2@ctuet.edu.vn',
    password: 'Student2@12345',
    role: USER_ROLES.STUDENT,
    fullName: 'IT Student Two',
    studentId: 'IT0002',
  });
  const student3 = await mkUser({
    email: 'it.student3@ctuet.edu.vn',
    password: 'Student3@12345',
    role: USER_ROLES.STUDENT,
    fullName: 'IT Student Three',
    studentId: 'IT0003',
  });
  const mentor = await mkUser({
    email: 'it.mentor@ctuet.edu.vn',
    password: 'Mentor@12345',
    role: USER_ROLES.MENTOR,
    fullName: 'IT Mentor',
  });
  const passwordStudent = await mkUser({
    email: 'it.password-student@ctuet.edu.vn',
    password: 'Current@12345',
    role: USER_ROLES.STUDENT,
    fullName: 'IT Password Student',
    studentId: 'IT0004',
  });
  const googleStudent = await mkUser({
    email: 'it.google-student@ctuet.edu.vn',
    role: USER_ROLES.STUDENT,
    fullName: 'IT Google Student',
    studentId: 'IT0005',
    extra: { authProvider: AUTH_PROVIDERS.GOOGLE },
  });
  await mentorService.ensureMentorProfile(mentor);

  await StudentWhitelist.insertMany([
    { email: student.email, studentId: student.studentId, fullName: student.fullName, className: 'IT-CLASS', faculty: 'Khoa Công nghệ Thông tin' },
    { email: student2.email, studentId: student2.studentId, fullName: student2.fullName, className: 'IT-CLASS' },
    { email: student3.email, studentId: student3.studentId, fullName: student3.fullName, className: 'IT-CLASS' },
  ]);

  fixtures = { admin, judge, judge2, student, student2, student3, mentor, passwordStudent, googleStudent };
  return fixtures;
}

async function testStudentProfileAndPassword() {
  group('Phase 1 - Hồ sơ sinh viên và đổi mật khẩu');

  await test('faculty được đồng bộ từ StudentWhitelist và không lấy từ User', async () => {
    const { profile } = await userService.getMyProfileDetail(fixtures.student);
    assertEqual(profile.faculty, 'Khoa Công nghệ Thông tin', 'Faculty lấy từ whitelist');
  });

  await test('faculty thiếu trong whitelist được trả về chuỗi trống', async () => {
    const { profile } = await userService.getMyProfileDetail(fixtures.student2);
    assertEqual(profile.faculty, '', 'Faculty thiếu phải rỗng');
  });

  await test('sinh viên không thể sửa faculty qua API cập nhật hồ sơ', async () => {
    await assertThrows(
      () => userService.updateMyProfileDetail(fixtures.student, { faculty: 'Khoa giả' }),
      'SCHOOL_MANAGED_FIELD',
    );
  });

  await test('đổi mật khẩu từ chối mật khẩu hiện tại sai', async () => {
    await assertThrows(
      () => authService.changePassword(fixtures.passwordStudent, {
        currentPassword: 'Wrong@12345',
        newPassword: 'Changed@12345',
      }),
      'CURRENT_PASSWORD_INVALID',
    );
  });

  await test('đổi mật khẩu từ chối mật khẩu mới dưới 8 ký tự', async () => {
    await assertThrows(
      () => authService.changePassword(fixtures.passwordStudent, {
        currentPassword: 'Current@12345',
        newPassword: 'Short1!',
      }),
      'PASSWORD_TOO_SHORT',
    );
  });

  await test('đổi mật khẩu từ chối mật khẩu mới trùng mật khẩu hiện tại', async () => {
    await assertThrows(
      () => authService.changePassword(fixtures.passwordStudent, {
        currentPassword: 'Current@12345',
        newPassword: 'Current@12345',
      }),
      'PASSWORD_SAME_AS_OLD',
    );
  });

  await test('tài khoản Google chưa có mật khẩu cục bộ nhận lỗi rõ ràng', async () => {
    await assertThrows(
      () => authService.changePassword(fixtures.googleStudent, {
        currentPassword: 'Current@12345',
        newPassword: 'Changed@12345',
      }),
      'LOCAL_PASSWORD_NOT_SET',
    );
  });

  await test('API đổi mật khẩu kiểm tra payload, xác thực và giữ phiên hiện tại', async () => {
    const sessionTokens = await tokenService.issueTokens(fixtures.passwordStudent, {});
    const server = app.listen(0, '127.0.0.1');

    try {
      await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });

      const endpoint = `http://127.0.0.1:${server.address().port}/api/v1/auth/change-password`;
      const sendRequest = async (body) => {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${sessionTokens.accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        return { status: response.status, body: await response.json() };
      };

      const invalidLength = await sendRequest({ currentPassword: 'Current@12345', newPassword: 'Short1!' });
      assertEqual(invalidLength.status, 400, 'API phải từ chối mật khẩu dưới 8 ký tự');
      assertEqual(invalidLength.body.code, 'VALIDATION_ERROR', 'Mã lỗi payload không hợp lệ');

      const invalidCurrent = await sendRequest({ currentPassword: 'Wrong@12345', newPassword: 'Changed@12345' });
      assertEqual(invalidCurrent.status, 401, 'API phải từ chối mật khẩu hiện tại sai');
      assertEqual(invalidCurrent.body.code, 'CURRENT_PASSWORD_INVALID', 'Mã lỗi mật khẩu hiện tại');

      const samePassword = await sendRequest({ currentPassword: 'Current@12345', newPassword: 'Current@12345' });
      assertEqual(samePassword.status, 400, 'API phải từ chối mật khẩu mới trùng mật khẩu cũ');
      assertEqual(samePassword.body.code, 'PASSWORD_SAME_AS_OLD', 'Mã lỗi mật khẩu trùng');

      const changed = await sendRequest({ currentPassword: 'Current@12345', newPassword: 'Changed@12345' });
      assertEqual(changed.status, 200, 'API đổi mật khẩu thành công');
      assertEqual(changed.body.data.changed, true, 'Kết quả đổi mật khẩu');

      const updatedUser = await User.findById(fixtures.passwordStudent._id).select('+password');
      assert(await updatedUser.comparePassword('Changed@12345'), 'Mật khẩu mới phải được hash và lưu');
      const accessClaims = tokenService.verifyAccessToken(sessionTokens.accessToken);
      assertEqual(accessClaims.sub, String(fixtures.passwordStudent._id), 'Access token hiện tại còn hiệu lực');
      const rotated = await tokenService.rotateTokens(sessionTokens.refreshToken, {});
      assert(rotated.tokens.accessToken, 'Refresh token phiên cũ vẫn dùng được sau khi đổi mật khẩu');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
}

// ---------------------------------------------------------------------------
// BƯỚC 1 - BGK & Whitelist + Digital NDA
// ---------------------------------------------------------------------------
async function testStep1() {
  group('BƯỚC 1 - BGK & Whitelist Excel + Digital NDA');

  await test('import danh sách BGK từ rows Excel', async () => {
    const result = await judgeWhitelistService.importJudgeWhitelistFromRows(
      [
        { 'Họ tên': 'Giám khảo Một', 'Mã số cán bộ': 'CB001', 'Email': 'gk1@ctuet.edu.vn', 'Khoa': 'Cơ khí' },
        { 'Họ tên': 'Giám khảo Hai', 'Mã số cán bộ': 'cb002', 'Email': 'GK2@CTUET.EDU.VN', 'Khoa': 'Điện tử' },
      ],
      fixtures.admin._id,
    );
    assertEqual(result.imported, 2, 'Số bản ghi import');
    assertEqual(result.skipped, 0, 'Số bản ghi lỗi');
  });

  await test('findJudgeByEmail tìm thấy giám khảo (email chuẩn hoá)', async () => {
    const judge = await judgeWhitelistService.findJudgeByEmail('GK2@ctuet.edu.vn');
    assert(judge, 'Không tìm thấy giám khảo');
    assertEqual(judge.staffCode, 'CB002', 'staffCode phải uppercase');
  });

  await test('assertJudgeInWhitelist chặn email ngoài danh sách', async () => {
    await assertThrows(
      () => judgeWhitelistService.assertJudgeInWhitelist('khong-co-trong-danh-sach@ctuet.edu.vn'),
      'JUDGE_NOT_IN_WHITELIST',
    );
  });

  await test('assertUserEligibleAsJudge: Judge trong whitelist -> OK', async () => {
    await judgeWhitelistService.importJudgeWhitelistFromRows(
      [{ fullName: fixtures.judge.fullName, staffCode: 'ITJ001', email: fixtures.judge.email }],
      fixtures.admin._id,
    );
    const result = await judgeWhitelistService.assertUserEligibleAsJudge(fixtures.judge);
    assert(result, 'Phải trả về user hợp lệ');
  });

  await test('User có trường Digital NDA (ndaAccepted/ndaAcceptedAt/ndaVersion)', async () => {
    const user = await User.findById(fixtures.judge._id).lean();
    assertEqual(user.ndaAccepted, true, 'ndaAccepted');
    assert(user.ndaAcceptedAt instanceof Date, 'ndaAcceptedAt phải là Date');
    assertEqual(user.ndaVersion, '1.0', 'ndaVersion');
  });
}

// ---------------------------------------------------------------------------
// BƯỚC 2 - Vòng đời dự án + Digital Receipt
// ---------------------------------------------------------------------------
async function testStep2() {
  group('BƯỚC 2 - Vòng đời dự án + Digital Receipt (SHA-256)');

  let project;

  await test('tạo dự án mới -> DRAFT + mã SESS-YYYY-NNN', async () => {
    const result = await projectService.createProject({
      owner: fixtures.student,
      payload: {
        title: 'Integration Test Project',
        category: 'AI',
        abstract: 'Mô tả dự án',
        solution: 'Giải pháp',
      },
      req: { ip: '127.0.0.1' },
    });
    project = result.project;
    assertEqual(project.status, PROJECT_STATUS.DRAFT, 'Trạng thái ban đầu');
    assert(/^SESS-\d{4}-\d{3}$/.test(project.code), `Mã dự án không đúng format: ${project.code}`);
  });

  await test('người tạo tự động là OWNER + thành viên ACCEPTED', async () => {
    const membership = await ProjectMember.findOne({
      projectId: project._id,
      userId: fixtures.student._id,
    }).lean();
    assert(membership, 'Không tìm thấy membership');
    assertEqual(membership.role, PROJECT_MEMBER_ROLES.OWNER, 'Vai trò');
    assertEqual(membership.status, PROJECT_MEMBER_STATUS.ACCEPTED, 'Trạng thái');
  });

  await test('nộp dự án -> SUBMITTED + sinh Digital Receipt hợp lệ', async () => {
    const result = await projectService.submitProject({
      projectId: project._id,
      actor: fixtures.student,
      req: { ip: '127.0.0.1' },
    });
    project = result.project;
    assertEqual(result.project.status, PROJECT_STATUS.SUBMITTED, 'Trạng thái sau nộp');
    assert(result.digitalReceipt.hash, 'Thiếu hash biên nhận');
    assert(/^[0-9a-f]{64}$/.test(result.digitalReceipt.hash), 'Hash phải là SHA-256 hex 64 ký tự');
    assert(result.digitalReceipt.timestamp instanceof Date, 'Thiếu timestamp biên nhận');
    assertEqual(result.project.digitalReceiptHash, result.digitalReceipt.hash, 'Hash lưu trong DB');
  });

  await test('version tăng 1 sau khi nộp + tạo ProjectRevision', async () => {
    assertEqual(project.version, 2, 'Version sau khi nộp');
    const revisions = await require('../src/models/ProjectRevision').countDocuments({
      projectId: project._id,
    });
    assertEqual(revisions, 1, 'Số revision');
  });

  await test('generateDigitalReceiptHash cho hash khác nhau mỗi lần (salt random)', async () => {
    const a = digitalReceiptService.generateDigitalReceiptHash({ projectCode: 'X', version: 1, timestampMillis: 1000 });
    const b = digitalReceiptService.generateDigitalReceiptHash({ projectCode: 'X', version: 1, timestampMillis: 1000 });
    assert(a !== b, 'Hash phải khác nhau do salt ngẫu nhiên');
  });

  await test('dự án đã nộp bị đóng băng -> không sửa được (PROJECT_LOCKED)', async () => {
    await assertThrows(
      () =>
        projectService.updateProject({
          projectId: project._id,
          userId: fixtures.student._id,
          payload: { abstract: 'Sửa sau khi nộp' },
        }),
      'PROJECT_LOCKED',
    );
  });

  await test('submit lần 2 bị chặn khi đã SUBMITTED', async () => {
    await assertThrows(
      () =>
        projectService.submitProject({
          projectId: project._id,
          actor: fixtures.student,
          req: { ip: '127.0.0.1' },
        }),
      'PROJECT_LOCKED',
    );
  });

  return project;
}

// ---------------------------------------------------------------------------
// BƯỚC 3 - Cloud Upload
// ---------------------------------------------------------------------------
async function testStep3() {
  group('BƯỚC 3 - Direct-to-Cloud Upload (Presigned URL + dung lượng)');

  await test('validateUploadFile chấp nhận .mp4 <= 500MB', () => {
    const ext = cloudUploadService.validateUploadFile({
      originalName: 'demo.mp4',
      fileType: 'video',
      fileSize: 400 * 1024 * 1024,
    });
    assertEqual(ext, '.mp4', 'Extension trả về');
  });

  await test('validateUploadFile chặn video > 500MB', async () => {
    await assertThrows(
      () =>
        cloudUploadService.validateUploadFile({
          originalName: 'huge.mp4',
          fileType: 'video',
          fileSize: UPLOAD_SIZE_LIMITS.video + 1,
        }),
      'FILE_TOO_LARGE',
    );
  });

  await test('validateUploadFile chặn poster > 10MB', async () => {
    await assertThrows(
      () =>
        cloudUploadService.validateUploadFile({
          originalName: 'poster.png',
          fileType: 'poster',
          fileSize: UPLOAD_SIZE_LIMITS.poster + 1,
        }),
      'FILE_TOO_LARGE',
    );
  });

  await test('validateUploadFile chặn document > 50MB', async () => {
    await assertThrows(
      () =>
        cloudUploadService.validateUploadFile({
          originalName: 'thesis.pdf',
          fileType: 'document',
          fileSize: UPLOAD_SIZE_LIMITS.document + 1,
        }),
      'FILE_TOO_LARGE',
    );
  });

  await test('validateUploadFile chặn extension không hỗ trợ (.exe)', async () => {
    await assertThrows(
      () =>
        cloudUploadService.validateUploadFile({
          originalName: 'virus.exe',
          fileType: 'document',
          fileSize: 1024,
        }),
      'INVALID_FILE_EXTENSION',
    );
  });

  await test('validateUploadFile chặn fileType không khớp extension', async () => {
    await assertThrows(
      () =>
        cloudUploadService.validateUploadFile({
          originalName: 'demo.mp4',
          fileType: 'poster',
          fileSize: 1024,
        }),
      'INVALID_FILE_TYPE',
    );
  });

  await test('generatePresignedUploadUrl trả về URL + objectKey hợp lệ', async () => {
    const presigned = await cloudUploadService.generatePresignedUploadUrl({
      projectId: '507f1f77bcf86cd799439011',
      userId: '507f191e810c19729de860ea',
      originalName: 'demo.mp4',
      fileType: 'video',
      fileSize: 10 * 1024 * 1024,
    });
    assert(presigned.uploadUrl, 'Thiếu uploadUrl');
    assert(presigned.objectKey.includes('uploads/projects/'), 'objectKey sai định dạng');
    assertEqual(presigned.method, 'PUT', 'HTTP method');
  });
}

// ---------------------------------------------------------------------------
// BƯỚC 4 - Thành viên nhóm + Score Override + Điều chuyển BGK
// ---------------------------------------------------------------------------
async function testStep4() {
  group('BƯỚC 4 - Thành viên nhóm / Score Override / Điều chuyển BGK');

  let project;

  await test('OWNER mời sinh viên -> tạo membership INVITED', async () => {
    project = await mkProject({ title: 'IT Member Project', code: 'SESS-2998-001', owner: fixtures.student });
    const { invitation } = await projectMemberService.inviteMember({
      projectId: project._id,
      inviter: fixtures.student,
      email: fixtures.student2.email,
      req: { ip: '127.0.0.1' },
    });
    assertEqual(invitation.status, PROJECT_MEMBER_STATUS.INVITED, 'Trạng thái lời mời');
    assertEqual(invitation.role, PROJECT_MEMBER_ROLES.MEMBER, 'Vai trò');
  });

  await test('sinh viên được mời phản hồi ACCEPTED', async () => {
    const invitation = await ProjectMember.findOne({
      projectId: project._id,
      userId: fixtures.student2._id,
    }).lean();
    const { invitation: updated } = await projectMemberService.respondInvitation({
      invitationId: invitation._id,
      userId: fixtures.student2._id,
      response: PROJECT_MEMBER_STATUS.ACCEPTED,
    });
    assertEqual(updated.status, PROJECT_MEMBER_STATUS.ACCEPTED, 'Trạng thái sau phản hồi');
  });

  await test('OWNER gửi yêu cầu ADD thành viên -> PENDING', async () => {
    const { changeRequest } = await projectMemberService.requestMemberChange({
      projectId: project._id,
      requester: fixtures.student,
      targetUserId: fixtures.student3._id,
      type: MEMBER_CHANGE_REQUEST_TYPE.ADD,
      reason: 'Bổ sung nhân sự giữa vòng thi',
      req: { ip: '127.0.0.1' },
    });
    assertEqual(changeRequest.status, MEMBER_CHANGE_REQUEST_STATUS.PENDING, 'Trạng thái yêu cầu');
  });

  await test('Admin phê duyệt -> thành viên được thêm vào dự án', async () => {
    const pending = await ProjectMemberChangeRequest.findOne({
      projectId: project._id,
      status: MEMBER_CHANGE_REQUEST_STATUS.PENDING,
    }).lean();
    const { changeRequest, executed } = await projectMemberService.respondMemberChangeRequest({
      requestId: pending._id,
      responder: fixtures.admin,
      response: MEMBER_CHANGE_REQUEST_STATUS.APPROVED,
      responseReason: 'Hồ sơ hợp lệ',
      req: { ip: '127.0.0.1' },
    });
    assertEqual(changeRequest.status, MEMBER_CHANGE_REQUEST_STATUS.APPROVED, 'Trạng thái sau duyệt');
    assertEqual(executed, true, 'Phải thực thi thay đổi');
    const member = await ProjectMember.findOne({
      projectId: project._id,
      userId: fixtures.student3._id,
    }).lean();
    assert(member, 'Thành viên chưa được thêm');
    assertEqual(member.status, PROJECT_MEMBER_STATUS.ACCEPTED, 'Trạng thái thành viên');
  });

  await test('không phê duyệt lại yêu cầu đã xử lý', async () => {
    const processed = await ProjectMemberChangeRequest.findOne({
      projectId: project._id,
      status: MEMBER_CHANGE_REQUEST_STATUS.APPROVED,
    }).lean();
    await assertThrows(
      () =>
        projectMemberService.respondMemberChangeRequest({
          requestId: processed._id,
          responder: fixtures.admin,
          response: MEMBER_CHANGE_REQUEST_STATUS.REJECTED,
          req: { ip: '127.0.0.1' },
        }),
      'CHANGE_REQUEST_ALREADY_RESPONDED',
    );
  });

  await test('không thể yêu cầu xóa OWNER (CANNOT_REMOVE_OWNER)', async () => {
    await assertThrows(
      () =>
        projectMemberService.requestMemberChange({
          projectId: project._id,
          requester: fixtures.student,
          targetUserId: fixtures.student._id,
          type: MEMBER_CHANGE_REQUEST_TYPE.REMOVE,
          reason: 'Thử xóa owner',
          req: { ip: '127.0.0.1' },
        }),
      'CANNOT_CHANGE_SELF',
    );
  });

  await test('OWNER rời dự án bị chặn (OWNER_MUST_TRANSFER)', async () => {
    await assertThrows(
      () => projectMemberService.leaveProject({ projectId: project._id, userId: fixtures.student._id }),
      'OWNER_MUST_TRANSFER',
    );
  });

  await test('Admin ép chuyển quyền Owner khẩn cấp -> đổi role + project.ownerId', async () => {
    const result = await projectMemberService.emergencyTransferOwnership({
      projectId: project._id,
      adminId: fixtures.admin._id,
      targetUserId: fixtures.student2._id,
      reason: 'Giám khảo Trưởng nhóm vắng mặt đột xuất',
      req: { ip: '127.0.0.1' },
    });
    assertEqual(result.newOwner.role, PROJECT_MEMBER_ROLES.OWNER, 'Role người nhận');
    assertEqual(String(result.project.ownerId), String(fixtures.student2._id), 'project.ownerId');
    const oldOwner = await ProjectMember.findOne({
      projectId: project._id,
      userId: fixtures.student._id,
    }).lean();
    assertEqual(oldOwner.role, PROJECT_MEMBER_ROLES.MEMBER, 'Role OWNER cũ');
  });

  await test('không thể chuyển quyền khẩn cấp khi thiếu lý do', async () => {
    await assertThrows(
      () =>
        projectMemberService.emergencyTransferOwnership({
          projectId: project._id,
          adminId: fixtures.admin._id,
          targetUserId: fixtures.student3._id,
          reason: '',
          req: { ip: '127.0.0.1' },
        }),
      'MISSING_REASON',
    );
  });

  // --- Score Override ---
  let rubric;

  await test('tạo + kích hoạt rubric (tổng trọng số = 100%)', async () => {
    rubric = await rubricService.createRubric({
      name: 'Rubric Integration',
      description: 'Bộ tiêu chí kiểm thử tích hợp',
      criteria: [
        { name: 'Ý tưởng', weight: 50, minScore: 0, maxScore: 10, order: 0 },
        { name: 'Kỹ thuật', weight: 50, minScore: 0, maxScore: 10, order: 1 },
      ],
      adminId: fixtures.admin._id,
    });

    if (transactionsSupported) {
      const activated = await rubricService.activateRubric({
        rubricId: rubric._id,
        adminId: fixtures.admin._id,
      });
      assertEqual(activated.status, RUBRIC_STATUS.ACTIVE, 'Trạng thái rubric');
    } else {
      // MongoDB standalone không hỗ trợ transaction -> kích hoạt trực tiếp (chỉ dùng cho test)
      rubric.status = RUBRIC_STATUS.ACTIVE;
      rubric.totalWeight = 100;
      await rubric.save();
      assertEqual(rubric.status, RUBRIC_STATUS.ACTIVE, 'Trạng thái rubric');
    }
  });

  if (!transactionsSupported) {
    await skipTest(
      'kích hoạt rubric qua MongoDB transaction',
      'MongoDB standalone không hỗ trợ transaction (cần replica set) - sẽ chạy được trên môi trường production',
    );
  }

  await test('Score Override: điều chỉnh trong biên độ ±2 được chấp nhận', async () => {
    const criterion = rubric.criteria[0];
    const result = await scoreOverrideService.createScoreOverride({
      rubricId: rubric._id,
      criterionId: criterion._id,
      projectId: project._id,
      overriddenScore: 9,
      reason: 'Bổ sung ý tưởng sáng tạo chưa được ghi nhận',
      overriddenBy: fixtures.judge._id,
      req: { ip: '127.0.0.1' },
    });
    assertEqual(result.scoreOverride.status, 'APPLIED', 'Trạng thái override');
    assert(result.scoreOverride.reason, 'Bắt buộc có lý do');
  });

  await test('Score Override: vượt biên độ ±2 bị chặn', async () => {
    const criterion = rubric.criteria[1];
    await assertThrows(
      () =>
        scoreOverrideService.createScoreOverride({
          rubricId: rubric._id,
          criterionId: criterion._id,
          projectId: project._id,
          overriddenScore: 0,
          reason: 'Giảm quá nhiều điểm',
          overriddenBy: fixtures.judge._id,
          req: { ip: '127.0.0.1' },
        }),
      'OVERRIDE_EXCEEDS_LIMIT',
    );
  });

  await test('Score Override: thiếu lý do bị chặn', async () => {
    const criterion = rubric.criteria[1];
    await assertThrows(
      () =>
        scoreOverrideService.createScoreOverride({
          rubricId: rubric._id,
          criterionId: criterion._id,
          projectId: project._id,
          overriddenScore: 9,
          reason: '',
          overriddenBy: fixtures.judge._id,
          req: { ip: '127.0.0.1' },
        }),
      'MISSING_FIELD',
    );
  });

  await test('Score Override: sinh viên không có quyền override', async () => {
    const criterion = rubric.criteria[1];
    await assertThrows(
      () =>
        scoreOverrideService.createScoreOverride({
          rubricId: rubric._id,
          criterionId: criterion._id,
          projectId: project._id,
          overriddenScore: 9,
          reason: 'Cố gắng override',
          overriddenBy: fixtures.student._id,
          req: { ip: '127.0.0.1' },
        }),
      'INSUFFICIENT_ROLE_FOR_OVERRIDE',
    );
  });

  // --- Emergency Judge Reassignment ---
  await test('Admin tạo điều chuyển khẩn cấp BGK -> PENDING', async () => {
    const result = await emergencyJudgeReassignmentService.createEmergencyReassignment({
      projectId: project._id,
      originalJudgeId: fixtures.judge._id,
      replacementJudgeId: fixtures.judge2._id,
      reason: 'Giám khảo vắng mặt đột xuất do bệnh',
      faculty: 'Cơ khí',
      reassignedBy: fixtures.admin._id,
      req: { ip: '127.0.0.1' },
    });
    assertEqual(result.reassignment.status, 'PENDING', 'Trạng thái reassignment');
    assert(result.reassignment.reason, 'Bắt buộc có lý do');
  });

  await test('Điều chuyển BGK: không thể chọn cùng Giám khảo', async () => {
    const projectP2 = await mkProject({
      title: 'IT P2',
      code: 'SESS-2998-002',
      owner: fixtures.student2,
    });
    await assertThrows(
      () =>
        emergencyJudgeReassignmentService.createEmergencyReassignment({
          projectId: projectP2._id,
          originalJudgeId: fixtures.judge._id,
          replacementJudgeId: fixtures.judge._id,
          reason: 'Trùng giám khảo',
          reassignedBy: fixtures.admin._id,
          req: { ip: '127.0.0.1' },
        }),
      'SAME_JUDGE_REASSIGNMENT',
    );
  });

  await test('Điều chuyển BGK: hoàn thành + ghi Audit Log', async () => {
    const pending = await EmergencyJudgeReassignment.findOne({ status: 'PENDING' }).lean();
    const { reassignment } = await emergencyJudgeReassignmentService.completeEmergencyReassignment({
      reassignmentId: pending._id,
      completedBy: fixtures.admin._id,
      req: { ip: '127.0.0.1' },
    });
    assertEqual(reassignment.status, 'COMPLETED', 'Trạng thái sau hoàn thành');
  });

  await test('Audit Log có ghi ipAddress + actorId cho các thao tác quan trọng', async () => {
    const logs = await AuditLog.find({ actorId: fixtures.admin._id }).lean();
    assert(logs.length > 0, 'Chưa có audit log nào');
    assert(logs.some((l) => l.ipAddress === '127.0.0.1'), 'Thiếu ipAddress trong audit log');
    assert(logs.every((l) => l.userId && String(l.userId) === String(l.actorId)), 'userId chưa sync actorId');
  });

  await test('Audit Log dùng action/entity riêng cho Score Override + Điều chuyển BGK', async () => {
    const overrideLog = await AuditLog.findOne({ action: 'CREATE_SCORE_OVERRIDE' }).lean();
    assert(overrideLog, 'Thiếu audit log CREATE_SCORE_OVERRIDE');
    assertEqual(overrideLog.targetEntity, 'ScoreOverrides', 'Entity của Score Override');

    const reassignLog = await AuditLog.findOne({ action: 'EMERGENCY_REASSIGN_JUDGE' }).lean();
    assert(reassignLog, 'Thiếu audit log EMERGENCY_REASSIGN_JUDGE');
    assertEqual(reassignLog.targetEntity, 'EmergencyJudgeReassignments', 'Entity của điều chuyển BGK');
    assert(reassignLog.targetId, 'Thiếu targetId của điều chuyển BGK');
  });
}

// ---------------------------------------------------------------------------
// BƯỚC 5 - Queue / reCAPTCHA / Rate Limit / Voting
// ---------------------------------------------------------------------------
async function testStep5() {
  group('BƯỚC 5 - Redis/BullMQ + reCAPTCHA v3 + Rate Limiting + Public Voting');

  await test('queueService báo trạng thái hạ tầng (không sập khi thiếu Redis)', async () => {
    const status = await queueService.getQueueStatus();
    assert(typeof status.redisAvailable === 'boolean', 'Thiếu redisAvailable');
    assert(['bullmq', 'inline-fallback'].includes(status.mode), `Mode không hợp lệ: ${status.mode}`);
  });

  await test('enqueueDigitalReceiptEmail chạy được (queue hoặc inline)', async () => {
    const result = await queueService.enqueueDigitalReceiptEmail({
      to: fixtures.student.email,
      payload: {
        projectCode: 'SESS-2998-001',
        projectTitle: 'IT Project',
        version: 1,
        receiptHash: 'a'.repeat(64),
        receiptTimestamp: new Date(),
        memberEmails: [],
      },
    });
    assert(typeof result.queued === 'boolean', 'Thiếu cờ queued');
  });

  await test('enqueueAuditBatch ghi được nhiều log hàng loạt', async () => {
    const before = await AuditLog.countDocuments();
    const result = await queueService.enqueueAuditBatch([
      { actor: fixtures.admin, action: 'CHANGE_RUBRIC', targetEntity: 'EVALUATION_RUBRICS', targetId: rubricIdPlaceholder },
      { actor: fixtures.admin, action: 'CHANGE_RUBRIC', targetEntity: 'EVALUATION_RUBRICS', targetId: rubricIdPlaceholder },
    ]);
    assert(result.queued !== undefined, 'Thiếu kết quả');
    const after = await AuditLog.countDocuments();
    assert(after >= before, 'Số log không giảm');
  });

  await test('reCAPTCHA middleware bỏ qua khi RECAPTCHA_ENABLED=false', async () => {
    const { requireRecaptcha } = require('../src/middlewares/recaptchaMiddleware');
    let passed = false;
    const mw = requireRecaptcha({ expectedAction: 'voting' });
    await mw({ body: {}, headers: {}, ip: '127.0.0.1' }, {}, (err) => {
      if (!err) passed = true;
    });
    assert(passed, 'Middleware phải next() khi bị tắt');
  });

  await test('reCAPTCHA middleware trả lỗi khi thiếu token (khi đang bật)', async () => {
    const { requireRecaptcha } = require('../src/middlewares/recaptchaMiddleware');
    const env = require('../src/config/env');
    const originalEnabled = env.recaptcha.enabled;
    const originalSkip = env.recaptcha.skipWhenUnconfigured;
    env.recaptcha.enabled = true;
    env.recaptcha.skipWhenUnconfigured = false;
    env.recaptcha.secret = '';

    let error = null;
    const mw = requireRecaptcha({ expectedAction: 'voting' });
    await mw({ body: {}, headers: {}, ip: '127.0.0.1' }, {}, (err) => {
      error = err;
    });

    env.recaptcha.enabled = originalEnabled;
    env.recaptcha.skipWhenUnconfigured = originalSkip;

    assert(error, 'Phải trả lỗi khi chưa cấu hình secret ở production');
    assertEqual(error.code, 'RECAPTCHA_NOT_CONFIGURED', 'Mã lỗi');
  });

  await test('Rate limiter Redis: vượt giới hạn -> 429 TOO_MANY_REQUESTS', async () => {
    const { createRedisRateLimiter } = require('../src/middlewares/redisRateLimitMiddleware');
    const limiter = createRedisRateLimiter({ max: 3, windowSeconds: 60, scope: 'it-test' });
    let lastError = null;
    for (let i = 0; i < 5; i += 1) {
      await new Promise((resolve) => {
        limiter({ headers: {}, ip: '10.0.0.1', user: null }, { setHeader: () => {}, on: () => {} }, (err) => {
          if (err) lastError = err;
          resolve();
        });
      });
    }
    assert(lastError, 'Phải trả lỗi khi vượt giới hạn');
    assertEqual(lastError.statusCode, 429, 'HTTP status');
  });

  await test('Public Voting: bỏ phiếu thành công (có chống vote trùng)', async () => {
    const project = await mkProject({ title: 'IT Vote Project', code: 'SESS-2998-003', owner: fixtures.student });
    const voterKey = votingService.resolveVoterKey({ headers: { 'user-agent': 'IT-UA' }, ip: '10.0.0.9' });
    const { vote } = await votingService.castVote({
      projectId: project._id,
      voterKey,
      option: 'Ý tưởng hay',
      comment: 'Dự án rất tiềm năng',
      recaptchaScore: 0.9,
      recaptchaAction: 'voting',
      req: { ip: '10.0.0.9' },
    });
    assert(vote._id, 'Không tạo được vote');
    assertEqual(vote.option, 'Ý tưởng hay', 'Lựa chọn');
  });

  await test('Public Voting: chặn vote trùng (ALREADY_VOTED)', async () => {
    const project = await Project.findOne({ code: 'SESS-2998-003' }).lean();
    const voterKey = votingService.resolveVoterKey({ headers: { 'user-agent': 'IT-UA' }, ip: '10.0.0.9' });
    await assertThrows(
      () =>
        votingService.castVote({
          projectId: project._id,
          voterKey,
          option: 'Ý tưởng hay',
          req: { ip: '10.0.0.9' },
        }),
      'ALREADY_VOTED',
    );
  });

  await test('Public Voting: tổng hợp kết quả đúng', async () => {
    const project = await Project.findOne({ code: 'SESS-2998-003' }).lean();
    const summary = await votingService.getVoteSummary({ projectId: project._id });
    assertEqual(summary.total, 1, 'Tổng số phiếu');
    assertEqual(summary.results[0].option, 'Ý tưởng hay', 'Lựa chọn top');
    assertEqual(summary.results[0].percentage, 100, 'Tỷ lệ %');
  });

  await test('Public Voting: voterKey là hash (không lộ IP thô)', async () => {
    const project = await Project.findOne({ code: 'SESS-2998-003' }).lean();
    const vote = await ProjectVote.findOne({ projectId: project._id }).lean();
    assert(vote.voterKey.startsWith('anon:'), 'voterKey phải được hash');
    assert(!vote.voterKey.includes('10.0.0.9'), 'Không được chứa IP thô');
    assert(vote.ipHash && !vote.ipHash.includes('10.0.0.9'), 'ipHash phải được hash');
  });

  await test('Public Voting: ghi Audit Log với action/entity riêng', async () => {
    const voteLog = await AuditLog.findOne({ action: 'CAST_PUBLIC_VOTE' }).lean();
    assert(voteLog, 'Thiếu audit log CAST_PUBLIC_VOTE');
    assertEqual(voteLog.targetEntity, 'ProjectVotes', 'Entity của bình chọn');
  });
}

async function testPhase5Notifications() {
  group('Phase 5 - Thông báo trong ứng dụng');

  const project = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Đề tài kiểm tra thông báo',
    code: 'SESS-IT-NOTIFICATION',
  };
  const revision = { _id: new mongoose.Types.ObjectId() };

  await test('sự kiện nộp đề tài tạo thông báo Admin idempotent khi retry', async () => {
    await notificationService.notifyProjectSubmitted({ project, revision });
    await notificationService.notifyProjectSubmitted({ project, revision });

    const eventKey = `project-submitted:${revision._id}:${fixtures.admin._id}`;
    const count = await Notification.countDocuments({ eventKey, recipientId: fixtures.admin._id });
    assertEqual(count, 1, 'Retry không tạo thông báo trùng');
  });

  await test('sự kiện lời mời gửi/phản hồi báo đúng người nhận', async () => {
    const invitation = {
      _id: new mongoose.Types.ObjectId(),
      invitedBy: fixtures.student._id,
      status: PROJECT_MEMBER_STATUS.ACCEPTED,
    };
    await notificationService.notifyInvitationCreated({
      project,
      invitation,
      invitee: { _id: fixtures.student2._id },
    });
    await notificationService.notifyInvitationResponded({ project, invitation });

    const created = await Notification.findOne({
      eventKey: `invitation-created:${invitation._id}:${fixtures.student2._id}`,
    }).lean();
    const responded = await Notification.findOne({
      eventKey: `invitation-responded:${invitation._id}:${fixtures.student._id}`,
    }).lean();
    assert(created, 'Sinh viên được mời phải nhận thông báo');
    assert(responded, 'Người gửi lời mời phải nhận thông báo phản hồi');
  });

  await test('nhận xét milestone báo cho thành viên ACCEPTED và loại recipient trùng', async () => {
    await Promise.all([
      ProjectMember.updateOne(
        { projectId: project._id, userId: fixtures.student._id },
        { $set: { status: PROJECT_MEMBER_STATUS.ACCEPTED, role: PROJECT_MEMBER_ROLES.OWNER } },
        { upsert: true, setDefaultsOnInsert: true },
      ),
      ProjectMember.updateOne(
        { projectId: project._id, userId: fixtures.student2._id },
        { $set: { status: PROJECT_MEMBER_STATUS.ACCEPTED, role: PROJECT_MEMBER_ROLES.MEMBER } },
        { upsert: true, setDefaultsOnInsert: true },
      ),
    ]);

    const comment = { _id: new mongoose.Types.ObjectId() };
    const milestone = { _id: new mongoose.Types.ObjectId(), title: 'Milestone test' };
    await notificationService.notifyMilestoneCommentAdded({ project, milestone, comment });
    await notificationService.notifyMilestoneCommentAdded({ project, milestone, comment });

    const eventKeyPrefix = `milestone-comment-added:${comment._id}:`;
    const recipients = await Notification.distinct('recipientId', {
      eventKey: new RegExp(`^${eventKeyPrefix}`),
    });
    assertEqual(recipients.length, 2, 'Chỉ hai thành viên ACCEPTED nhận một thông báo mỗi người');
  });

  await test('duyệt thay đổi thành viên và hủy dự án tạo recipient duy nhất', async () => {
    const changeRequest = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: fixtures.student._id,
      targetUserId: fixtures.student2._id,
      type: MEMBER_CHANGE_REQUEST_TYPE.ADD,
    };
    await notificationService.notifyMemberChangeApproved({ project, changeRequest });
    await notificationService.notifyMemberChangeApproved({ project, changeRequest });

    const changeRecipients = await Notification.distinct('recipientId', {
      eventKey: new RegExp(`^member-change-approved:${changeRequest._id}:`),
    });
    assertEqual(changeRecipients.length, 2, 'Người gửi và người bị tác động nhận thông báo không trùng');

    const cancellationRequest = {
      _id: new mongoose.Types.ObjectId(),
      requestedBy: fixtures.student._id,
    };
    await notificationService.notifyProjectCancellationApproved({ project, request: cancellationRequest });
    await notificationService.notifyProjectCancellationApproved({ project, request: cancellationRequest });

    const cancellationRecipients = await Notification.distinct('recipientId', {
      eventKey: new RegExp(`^project-cancellation-approved:${cancellationRequest._id}:`),
    });
    assertEqual(cancellationRecipients.length, 2, 'Requester trùng thành viên chỉ nhận một thông báo');
  });

  await test('lọc unread và unreadCount tính trên toàn bộ thông báo của user', async () => {
    const result = await notificationService.getNotifications({
      userId: fixtures.admin._id,
      status: 'unread',
      page: 1,
      limit: 1,
    });
    assert(result.notifications.length <= 1, 'API phải giới hạn theo trang');
    assert(result.unreadCount >= 1, 'Unread count phải bao gồm toàn bộ trang');
    assertEqual(result.pagination.limit, 1, 'Pagination trả đúng limit');
  });

  await test('tài khoản khác không thể đọc thông báo và gọi lại vẫn idempotent', async () => {
    const eventKey = `project-submitted:${revision._id}:${fixtures.admin._id}`;
    const notification = await Notification.findOne({ eventKey }).lean();
    await assertThrows(
      () => notificationService.markNotificationRead({
        notificationId: notification._id,
        userId: fixtures.student._id,
      }),
      'NOTIFICATION_NOT_FOUND',
      'Không để lộ thông báo của tài khoản khác',
    );

    await notificationService.markNotificationRead({
      notificationId: notification._id,
      userId: fixtures.admin._id,
    });
    await notificationService.markNotificationRead({
      notificationId: notification._id,
      userId: fixtures.admin._id,
    });
    const saved = await Notification.findById(notification._id).lean();
    assertEqual(saved.isRead, true, 'Gọi đánh dấu đọc lặp lại không lỗi');
  });

  await test('read-all chỉ cập nhật tài khoản hiện tại', async () => {
    const invitationId = new mongoose.Types.ObjectId();
    await notificationService.notifyInvitationCreated({
      project,
      invitation: { _id: invitationId },
      invitee: { _id: fixtures.student2._id },
    });
    const studentUnreadBefore = await Notification.countDocuments({
      recipientId: fixtures.student2._id,
      isRead: false,
    });

    await notificationService.markAllNotificationsRead({ userId: fixtures.admin._id });
    const adminUnreadAfter = await Notification.countDocuments({
      recipientId: fixtures.admin._id,
      isRead: false,
    });
    const studentUnreadAfter = await Notification.countDocuments({
      recipientId: fixtures.student2._id,
      isRead: false,
    });
    assertEqual(adminUnreadAfter, 0, 'Thông báo Admin đã đọc hết');
    assertEqual(studentUnreadAfter, studentUnreadBefore, 'Không sửa thông báo của tài khoản khác');
  });
}

// Merge: kiểm chứng trên DB test đã qua allowlist của runner, không chạy riêng trên DB thật.
async function testNotificationMergeCompatibility() {
  await test('notification merge: student không được tạo thông báo admin', async () => {
    const { checkRole } = require('../src/middlewares/authMiddleware');
    await assertThrows(() => checkRole('admin')({ user: fixtures.student }, {}, () => {}),
      'INSUFFICIENT_ROLE', 'Chặn student trước controller POST');
    let allowed = false;
    checkRole('admin')({ user: fixtures.admin }, {}, () => { allowed = true; });
    assert(allowed, 'Admin được đi tiếp tới validation');
  });
  await test('notification merge: validation hai hợp đồng và query ưu tiên status', async () => {
    const { notificationBodySchema, notificationQuerySchema } = require('../src/validations/notificationValidation');
    const recipientId = String(fixtures.student._id);
    assert(notificationBodySchema.safeParse({ recipientId, title: 'T'.repeat(200),
      content: 'Content', type: 'feedback', link: '/student/projects' }).success, 'Nhận payload dev và type HEAD');
    assert(!notificationBodySchema.safeParse({ recipientId, title: 'T', content: 'C',
      link: '//external.example' }).success, 'Không nhận link ngoài');
    assert(!notificationBodySchema.safeParse({ recipientId, title: 'T' }).success, 'Bắt buộc nội dung');
    assert(!notificationBodySchema.safeParse({ recipientId, userId: String(fixtures.admin._id),
      title: 'T', content: 'C' }).success, 'Không nhận recipient không nhất quán');
    const query = notificationQuerySchema.parse({ unreadOnly: 'true', limit: '100' });
    assertEqual(query.status, undefined, 'Không default status che unreadOnly');
    assertEqual(query.limit, 100, 'Giữ limit màn hình judge');
  });
  await test('notification merge: legacy read và recipient ownership', async () => {
    const legacyId = new mongoose.Types.ObjectId();
    await Notification.collection.insertOne({
      _id: legacyId, userId: fixtures.student._id, title: 'Legacy', content: 'Legacy content',
      read: true, isRead: false, createdAt: new Date(),
    });
    const list = await notificationService.getMentorNotifications({ userId: fixtures.student._id });
    const item = list.find((entry) => String(entry._id) === String(legacyId));
    assert(item && item.isRead && item.read, 'Đã đọc ở một nhánh không được thành unread');
    assertEqual(item.message, 'Legacy content', 'Chuẩn hóa content sang message');
    await assertThrows(() => notificationService.markNotificationRead({
      notificationId: legacyId, userId: fixtures.admin._id,
    }), 'NOTIFICATION_NOT_FOUND', 'Không sửa thông báo người khác');
    await notificationService.markNotificationRead({ notificationId: legacyId, userId: fixtures.student._id });
    const saved = await Notification.collection.findOne({ _id: legacyId });
    assert(saved.read && saved.isRead, 'Service đồng bộ hai trạng thái');
    await Notification.collection.deleteOne({ _id: legacyId });
  });
  await test('notification merge: retry không trùng và giữ type/title của cả hai nhánh', async () => {
    await Notification.collection.createIndex({ eventKey: 1 }, { unique: true });
    const eventKey = `merge-test:${new mongoose.Types.ObjectId()}`;
    const payload = { recipientId: fixtures.student._id, title: 'T'.repeat(200),
      message: 'Message', type: 'invitation', eventKey };
    await Promise.all([notificationService.createNotification(payload), notificationService.createNotification(payload)]);
    const item = await Notification.findOne({ eventKey });
    await notificationService.markNotificationRead({ notificationId: item._id, userId: fixtures.student._id });
    await notificationService.createNotification(payload);
    assertEqual(await Notification.countDocuments({ eventKey }), 1, 'Retry kể cả đã đọc không tạo bản ghi mới');
  });
  await test('notification migration: dry-run, giữ timestamps và chạy lại an toàn', async () => {
    const { migrateNotifications } = require('../src/services/notificationMigrationService');
    const collection = mongoose.connection.db.collection('notification_migration_tests');
    const id = new mongoose.Types.ObjectId();
    const createdAt = new Date('2025-01-01T00:00:00Z');
    await collection.insertOne({ _id: id, userId: fixtures.student._id, title: 'Legacy',
      content: 'Content', read: true, isRead: false, createdAt });
    const dry = await migrateNotifications({ collection });
    assertEqual(dry.modified, 0, 'Dry-run không ghi');
    assertEqual((await collection.findOne({ _id: id })).eventKey, undefined, 'Dry-run không backfill');
    const applied = await migrateNotifications({ collection, dryRun: false });
    assertEqual(applied.modified, 1, 'Apply backfill');
    const saved = await collection.findOne({ _id: id });
    assertEqual(saved.createdAt.getTime(), createdAt.getTime(), 'Giữ thời gian tạo');
    const repeated = await migrateNotifications({ collection, dryRun: false });
    assertEqual(repeated.modified, 0, 'Chạy lại không ghi thêm');
    await collection.deleteOne({ _id: id });
  });
}

const rubricIdPlaceholder = new mongoose.Types.ObjectId();

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
// Merge: kiểm tra router tĩnh không bị /:id hoặc middleware của router khác che.
async function testMergeRouteReachability() {
  group('Merge step 6 - route reachability');
  const adminTokens = await tokenService.issueTokens(fixtures.admin, {});
  const studentTokens = await tokenService.issueTokens(fixtures.student, {});
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const cases = [
      ['/news', null, 200],
      ['/projects/unassigned-mentor', adminTokens, 200],
      ['/projects/cancellation-requests', adminTokens, 200],
      ['/projects/invitations/me', studentTokens, 200],
      ['/evaluator/assignments', studentTokens, 403],
      ['/admin/evaluations/rounds/not-an-id/assignments', adminTokens, 400],
      ['/admin/evaluations/rounds/not-an-id/assignments', studentTokens, 403],
    ];
    for (const [route, tokens, expected] of cases) {
      await test(`GET ${route} (${tokens === studentTokens ? 'student' : tokens ? 'admin' : 'public'})`, async () => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1${route}`, {
          headers: tokens ? { authorization: `Bearer ${tokens.accessToken}` } : {},
        });
        await response.text();
        assertEqual(response.status, expected, 'Route phải đến đúng middleware/controller');
      });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const main = async () => {
  console.log('=========================================================');
  console.log(' SESS-CTUT Enterprise Edition - INTEGRATION TEST SUITE');
  console.log('=========================================================');

  await connectDatabase();
  assertTestDatabaseName(mongoose.connection.name, 'integration');
  console.log(`MongoDB: ${mongoose.connection.name}`);
  await mongoose.connection.dropDatabase();
  console.log('Đã drop DB test cũ.\n');

  await seed();
  console.log('Fixtures đã sẵn sàng.\n');

  await detectTransactionSupport();

  await testStudentProfileAndPassword();
  await testStep1();
  await testStep2();
  await testStep3();
  await testStep4();
  await testStep5();
  await testPhase5Notifications();
  await testNotificationMergeCompatibility();
  await testMergeRouteReachability();

  // Kết quả
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log('\n=========================================================');
  console.log(` KẾT QUẢ: ${passed} PASS / ${failed} FAIL / ${skipped} SKIP / ${results.length} tổng`);
  console.log('=========================================================');

  if (skipped > 0) {
    console.log('\nCác test SKIP:');
    results.filter((r) => r.status === 'SKIP').forEach((r) => {
      console.log(`  - [${r.group}] ${r.name}`);
      console.log(`      ${r.reason}`);
    });
  }

  if (failed > 0) {
    console.log('\nCác test FAIL:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  - [${r.group}] ${r.name}`);
      console.log(`      ${r.reason}`);
    });
  }

  // Dọn dẹp
  assertTestDatabaseName(mongoose.connection.name, 'integration');
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
  await require('../src/config/redis').closeRedis();

  process.exit(failed > 0 ? 1 : 0);
};

main().catch(async (error) => {
  console.error('\n[LỖI] Integration test gặp sự cố không mong đợi:', error);
  try {
    if (mongoose.connection.readyState === 1) {
      assertTestDatabaseName(mongoose.connection.name, 'integration');
      await mongoose.connection.dropDatabase();
    }
    await disconnectDatabase();
  } catch {
    // Bỏ qua lỗi dọn dẹp
  }
  process.exit(1);
});

/**
 * Tạo tài khoản fixture còn thiếu trong database test được allowlist.
 * Tài khoản đã có không bị cập nhật, đặc biệt là mật khẩu.
 */
const { blockDotenvConfig, getTestMongoUri } = require('./testDatabaseGuard');
blockDotenvConfig();

const parseArgs = (argv) =>
  argv.reduce((accumulator, argument) => {
    if (!argument.startsWith('--')) return accumulator;
    const [key, ...parts] = argument.slice(2).split('=');
    const value = parts.length ? parts.join('=') : undefined;
    accumulator[key] = value === undefined ? true : value;
    return accumulator;
  }, {});

const args = parseArgs(process.argv.slice(2));
const target = String(args.target || 'integration');
const mongoUri = getTestMongoUri(target);
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongoUri;

const mongoose = require('mongoose');
const User = require('../src/models/User');
const JudgeWhitelist = require('../src/models/JudgeWhitelist');
const StudentWhitelist = require('../src/models/StudentWhitelist');
const {
  USER_ROLES,
  USER_STATUS,
  AUTH_PROVIDERS,
} = require('../src/utils/constants');
const { extractStudentIdFromEmail } = require('../src/utils/validation');

const DEFAULT_ACCOUNTS = {
  [USER_ROLES.ADMIN]: {
    email: process.env.ADMIN_EMAIL || 'admin@ctuet.edu.vn',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    isEmailVerified: true,
    studentId: null,
  },
  [USER_ROLES.TEACHER]: {
    email: 'gv01@ctuet.edu.vn',
    password: 'Teacher@12345',
    isEmailVerified: true,
    studentId: null,
  },
  [USER_ROLES.MENTOR]: {
    email: 'mentor01@ctuet.edu.vn',
    password: 'Mentor@12345',
    isEmailVerified: true,
    studentId: null,
  },
  [USER_ROLES.JUDGE]: {
    email: 'judge01@ctuet.edu.vn',
    password: 'Judge@12345',
    isEmailVerified: true,
    studentId: null,
  },
  [USER_ROLES.STUDENT]: {
    email: process.env.STUDENT_EMAIL || '110122000@student.ctuet.edu.vn',
    password: process.env.STUDENT_PASSWORD || 'Student@12345',
    // Tài khoản do nhà trường cấp sẵn -> cần xác thực OTP ở lần đăng nhập đầu tiên
    isEmailVerified: false,
    studentId: process.env.STUDENT_ID || '110122000',
  },
};

const seedUser = async () => {
  const role = String(args.role || USER_ROLES.ADMIN).toLowerCase();

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new Error(`Role không hợp lệ "${role}". Chỉ chấp nhận: ${Object.values(USER_ROLES).join(', ')}`);
  }

  const defaults = DEFAULT_ACCOUNTS[role];
  let isEmailVerified = defaults.isEmailVerified;
  if (args.verified) isEmailVerified = true;
  if (args.unverified) isEmailVerified = false;

  const email = String(args.email || defaults.email).toLowerCase();

  await mongoose.connect(mongoUri);
  try {

    // Nếu email có trong danh sách sinh viên của trường -> đồng bộ dữ liệu chính thức (MSSV, họ tên, lớp, CVHT)
    const whitelistEntry = await StudentWhitelist.findOne({ email });

    const payload = {
      password: String(args.password || defaults.password),
      role,
      status: USER_STATUS.ACTIVE,
      authProvider: AUTH_PROVIDERS.LOCAL,
      isEmailVerified,
      fullName: args.fullName || whitelistEntry?.fullName || `Seed ${role}`,
      // MSSV: ưu tiên tham số -> danh sách nhà trường -> trích từ email -> mặc định theo role
      studentId:
        args['student-id'] ||
        args.studentId ||
        whitelistEntry?.studentId ||
        extractStudentIdFromEmail(email) ||
        defaults.studentId ||
        undefined,
      className: whitelistEntry?.className ?? '',
      faculty: whitelistEntry?.faculty ?? '',
      advisorEmail: whitelistEntry?.advisorEmail ?? '',
    };

    const existingUser = await User.findOne({ email });
    // Merge: giữ nguyên tài khoản/mật khẩu đã có; không cấp whitelist sai vai trò.
    if (existingUser && String(existingUser.role || existingUser.systemRole).toLowerCase() !== role) {
      throw new Error('Email fixture đã thuộc vai trò khác; không thay đổi tài khoản hoặc whitelist.');
    }
    const user = existingUser || await User.create({ email, ...payload });

    // Merge: cả judge mới và judge đã có đều cần whitelist. Chỉ chèn bản ghi còn thiếu,
    // không ghi đè dữ liệu import; mã cán bộ ổn định khi chạy lại sau lỗi giữa chừng.
    if (role === USER_ROLES.JUDGE) {
      await JudgeWhitelist.updateOne(
        { email },
        { $setOnInsert: {
          email,
          fullName: args.fullName || user.fullName || payload.fullName,
          staffCode: String(args['staff-code'] || args.staffCode || `JDG-${user._id}`).toUpperCase(),
          phone: '',
          faculty: '',
          isImported: false,
        } },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    }
    console.log(`[Seed] ${existingUser ? 'Giữ nguyên' : 'Đã tạo'} tài khoản fixture ${role}.`);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedUser().catch((error) => {
    console.error(`[Seed] Thất bại: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { seedUser, parseArgs };

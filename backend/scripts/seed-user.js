/**
 * Script dev: tạo / reset tài khoản để test (sinh viên KHÔNG tự đăng ký qua API).
 *
 * Ví dụ:
 *   npm run seed:admin     -> admin@ctuet.edu.vn / Admin@12345 (đã xác thực)
 *   npm run seed:student   -> 110122001@student.ctuet.edu.vn / Student@12345 (CHƯA xác thực -> cần OTP)
 *   node scripts/seed-user.js --role=teacher --email=gv01@ctuet.edu.vn --password=Teacher@123
 *   node scripts/seed-user.js --role=student --email=110122002@student.ctuet.edu.vn --student-id=110122002 --verified
 */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const StudentWhitelist = require('../src/models/StudentWhitelist');
const { USER_ROLES, USER_STATUS, AUTH_PROVIDERS } = require('../src/utils/constants');
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
  [USER_ROLES.STUDENT]: {
    email: process.env.STUDENT_EMAIL || '110122001@student.ctuet.edu.vn',
    password: process.env.STUDENT_PASSWORD || 'Student@12345',
    // Tài khoản do nhà trường cấp sẵn -> cần xác thực OTP ở lần đăng nhập đầu tiên
    isEmailVerified: false,
    studentId: process.env.STUDENT_ID || '110122001',
  },
};

const parseArgs = (argv) =>
  argv.reduce((accumulator, argument) => {
    if (!argument.startsWith('--')) return accumulator;
    const [key, value] = argument.slice(2).split('=');
    accumulator[key] = value === undefined ? true : value;
    return accumulator;
  }, {});

const seedUser = async () => {
  const args = parseArgs(process.argv.slice(2));
  const role = String(args.role || USER_ROLES.ADMIN).toLowerCase();

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new Error(`Role không hợp lệ "${role}". Chỉ chấp nhận: ${Object.values(USER_ROLES).join(', ')}`);
  }

  const defaults = DEFAULT_ACCOUNTS[role];
  let isEmailVerified = defaults.isEmailVerified;
  if (args.verified) isEmailVerified = true;
  if (args.unverified) isEmailVerified = false;

  const email = String(args.email || defaults.email).toLowerCase();

  await mongoose.connect(env.mongoUri);

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
    advisorEmail: whitelistEntry?.advisorEmail ?? '',
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.set(payload);
    await existingUser.save();
    console.log(`[Seed] Đã cập nhật ${role}: ${email}`);
  } else {
    await User.create({ email, ...payload });
    console.log(`[Seed] Đã tạo ${role}: ${email}`);
  }

  const verifyNote = payload.isEmailVerified ? '' : ' (chưa xác thực - lần đăng nhập đầu cần OTP)';
  console.log(`[Seed] Tài khoản: ${email} / ${payload.password}${verifyNote}`);
  if (payload.className) {
    console.log(`[Seed] Dữ liệu từ danh sách nhà trường: MSSV ${payload.studentId} | Lớp ${payload.className} | CVHT ${payload.advisorEmail}`);
  }

  if (env.isProduction) console.warn('[Seed] CẢNH BÁO: không nên chạy script này trên production!');

  await mongoose.disconnect();
};

seedUser().catch((error) => {
  console.error(`[Seed] Thất bại: ${error.message}`);
  process.exit(1);
});

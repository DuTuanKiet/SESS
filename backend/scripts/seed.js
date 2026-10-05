/**
 * Script seed dữ liệu sạch chuẩn cho môi trường dev/test.
 *
 * Các bước:
 *   1. Xoá dữ liệu phát sinh (dự án, phiên bản, thành viên, hồ sơ, OTP) để test lại từ đầu.
 *   2. Nạp danh sách sinh viên của trường (StudentWhitelist).
 *   3. Tạo tài khoản admin + sinh viên chính (CHƯA xác thực để test luồng Gmail OTP)
 *      + các sinh viên phụ (đã xác thực) phục vụ test FR03/FR04.
 *
 * Chạy: npm run seed
 */
const path = require('node:path');
const { execFileSync } = require('node:child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const StudentWhitelist = require('../src/models/StudentWhitelist');
const Otp = require('../src/models/Otp');
const Project = require('../src/models/Project');
const ProjectRevision = require('../src/models/ProjectRevision');
const ProjectMember = require('../src/models/ProjectMember');
const UserProfile = require('../src/models/UserProfile');
const AuditLog = require('../src/models/AuditLog');
const Mentor = require('../src/models/Mentor');

/** Các script seed con, chạy tuần tự */
const SEED_STEPS = [
  { file: 'scripts/seed-whitelist.js', args: [] },
  { file: 'scripts/seed-user.js', args: ['--role=admin'] },
  { file: 'scripts/seed-user.js', args: ['--role=student'] },
  { file: 'scripts/seed-user.js', args: ['--email=110122001@student.ctuet.edu.vn', '--role=student', '--verified'] },
  { file: 'scripts/seed-user.js', args: ['--email=110122002@student.ctuet.edu.vn', '--role=student', '--verified'] },
  { file: 'scripts/seed-user.js', args: ['--email=110122003@student.ctuet.edu.vn', '--role=student', '--verified'] },
];

/** Xoá dữ liệu phát sinh để test lại từ trạng thái sạch */
const resetDerivedData = async () => {
  await mongoose.connect(env.mongoUri);

  const [projects, revisions, members, profiles, otps, auditLogs, mentors] = await Promise.all([
    Project.deleteMany({}),
    ProjectRevision.deleteMany({}),
    ProjectMember.deleteMany({}),
    UserProfile.deleteMany({}),
    Otp.deleteMany({}),
    AuditLog.deleteMany({}),
    Mentor.deleteMany({}),
  ]);

  console.log('[Seed] Đã dọn dữ liệu phát sinh:');
  console.log(
    `   - ${projects.deletedCount} dự án | ${revisions.deletedCount} phiên bản | ${members.deletedCount} thành viên`,
  );
  console.log(
    `   - ${profiles.deletedCount} hồ sơ | ${otps.deletedCount} mã OTP | ${auditLogs.deletedCount} audit log | ${mentors.deletedCount} hồ sơ Mentor`,
  );

  await mongoose.disconnect();
};

/** Chạy các script seed con */
const runChildSeeds = () => {
  for (const step of SEED_STEPS) {
    console.log(`\n[Seed] > node ${step.file} ${step.args.join(' ')}`.trim());
    execFileSync('node', [step.file, ...step.args], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  }
};

/** In tổng hợp dữ liệu đã seed */
const printSummary = async () => {
  await mongoose.connect(env.mongoUri);

  const users = await User.find({}).sort({ email: 1 }).lean();
  const whitelistCount = await StudentWhitelist.countDocuments({});

  console.log('\n================ TỔNG HỢP DỮ LIỆU SEED ================');
  console.log(`Danh sách sinh viên của trường : ${whitelistCount} bản ghi`);
  console.log(`Tài khoản hệ thống             : ${users.length}`);
  for (const user of users) {
    const verified = user.isEmailVerified ? 'đã xác thực' : 'CHƯA xác thực (test OTP)';
    console.log(
      `   - ${user.email} | ${user.role} | ${user.status} | ${verified} | MSSV ${user.studentId || '-'} | Lớp ${user.className || '-'}`,
    );
  }
  console.log('========================================================\n');

  await mongoose.disconnect();
};

(async () => {
  await resetDerivedData();
  runChildSeeds();
  await printSummary();
  console.log('[Seed] Hoàn tất. Mật khẩu sinh viên: Student@12345 | admin: Admin@12345');
})().catch((error) => {
  console.error(`[Seed] Thất bại: ${error.message}`);
  process.exit(1);
});

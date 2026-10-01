/**
 * Script dev: xoá dữ liệu test khỏi MongoDB (chạy bằng Node.js thuần + Mongoose).
 *
 * Ví dụ:
 *   npm run cleanup                                  -> xoá user test (email bắt đầu bằng sv, test, demo, seed hoặc STUDENT_EMAIL) + toàn bộ OTP + whitelist test
 *   npm run cleanup -- --all                         -> xoá toàn bộ user (giữ lại ADMIN_EMAIL) + toàn bộ OTP
 *   npm run cleanup -- --email=a@x.vn,b@student.ctuet.edu.vn
 */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Otp = require('../src/models/Otp');
const StudentWhitelist = require('../src/models/StudentWhitelist');

/** Email local-part của các tài khoản test ad-hoc */
const TEST_EMAIL_PATTERN = /^(sv|test|demo|seed|tmp)+[a-z0-9._-]*@/i;

const parseArgs = (argv) =>
  argv.reduce((accumulator, argument) => {
    if (!argument.startsWith('--')) return accumulator;
    const [key, value] = argument.slice(2).split('=');
    accumulator[key] = value === undefined ? true : value;
    return accumulator;
  }, {});

const buildUserFilter = (args) => {
  if (args.all) {
    const keepEmail = (process.env.ADMIN_EMAIL || 'admin@ctuet.edu.vn').toLowerCase();
    return { email: { $ne: keepEmail } };
  }

  if (typeof args.email === 'string') {
    const emails = args.email
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return { email: { $in: emails } };
  }

  const seededEmails = [process.env.STUDENT_EMAIL].filter(Boolean).map((item) => item.toLowerCase());
  return { $or: [{ email: TEST_EMAIL_PATTERN }, { email: { $in: seededEmails } }] };
};

const cleanup = async () => {
  const args = parseArgs(process.argv.slice(2));

  await mongoose.connect(env.mongoUri);

  const userFilter = buildUserFilter(args);
  const deletedUsers = await User.deleteMany(userFilter);
  const deletedOtps = await Otp.deleteMany({});
  // Chỉ dọn các bản ghi whitelist dạng test, giữ lại dữ liệu sinh viên thật đã seed
  const deletedWhitelist = await StudentWhitelist.deleteMany({ email: TEST_EMAIL_PATTERN });
  const remainingUsers = await User.countDocuments({});
  const remainingWhitelist = await StudentWhitelist.countDocuments({});

  console.log(`[Cleanup] Đã xoá ${deletedUsers.deletedCount} user test, ${deletedOtps.deletedCount} bản ghi OTP.`);
  console.log(`[Cleanup] Đã xoá ${deletedWhitelist.deletedCount} bản ghi whitelist test.`);
  console.log(`[Cleanup] Còn lại ${remainingUsers} user và ${remainingWhitelist} sinh viên trong danh sách nhà trường.`);

  await mongoose.disconnect();
};

cleanup().catch((error) => {
  console.error(`[Cleanup] Thất bại: ${error.message}`);
  process.exit(1);
});

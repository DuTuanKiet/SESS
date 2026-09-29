/**
 * Script seed "Danh sách sinh viên của trường" (StudentWhitelist).
 *
 * Giai đoạn hiện tại CHƯA có chức năng Admin Import Excel nên dùng script này để nạp dữ liệu mẫu.
 * Khi chức năng Import XLSX hoàn thành, dữ liệu chỉ cần ghi vào cùng collection này
 * (isImported = true) -> logic xác thực hiện tại không phải sửa gì.
 *
 * Ví dụ:
 *   npm run seed:whitelist
 *   node scripts/seed-whitelist.js --imported
 */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const StudentWhitelist = require('../src/models/StudentWhitelist');

/** Dữ liệu sinh viên mẫu (bao gồm email thật + thông tin CVHT của lớp) */
const SAMPLE_STUDENTS = [
  {
    email: 'dtkietktpm2311025@student.ctuet.edu.vn',
    studentId: 'KTPM2311025',
    fullName: 'Dư Tuấn Kiệt',
    className: 'KTPM2311',
    phone: '0900000001',
    advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
  },
  {
    email: '110122001@student.ctuet.edu.vn',
    studentId: '110122001',
    fullName: 'Nguyễn Văn A',
    className: 'KTPM K23B',
    phone: '0900000002',
    advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
  },
  {
    email: '110122002@student.ctuet.edu.vn',
    studentId: '110122002',
    fullName: 'Trần Thị B',
    className: 'HTTT K23A',
    phone: '0900000003',
    advisorEmail: 'cvht.httt@ctuet.edu.vn',
  },
  {
    email: '110122003@student.ctuet.edu.vn',
    studentId: '110122003',
    fullName: 'Lê Văn C',
    className: 'HTTT K23B',
    phone: '0900000004',
    advisorEmail: 'cvht.httt@ctuet.edu.vn',
  },
  {
    // Sinh viên có trong danh sách trường nhưng CHƯA kích hoạt tài khoản
    // -> dùng để kiểm thử nhánh lỗi 400 khi mời vào dự án
    email: '110122004@student.ctuet.edu.vn',
    studentId: '110122004',
    fullName: 'Phạm Thị D',
    className: 'HTTT K23B',
    phone: '0900000005',
    advisorEmail: 'cvht.httt@ctuet.edu.vn',
  },
];

const parseArgs = (argv) =>
  argv.reduce((accumulator, argument) => {
    if (!argument.startsWith('--')) return accumulator;
    const [key, value] = argument.slice(2).split('=');
    accumulator[key] = value === undefined ? true : value;
    return accumulator;
  }, {});

const seedWhitelist = async () => {
  const args = parseArgs(process.argv.slice(2));
  const isImported = Boolean(args.imported);

  await mongoose.connect(env.mongoUri);

  let created = 0;
  let updated = 0;

  for (const student of SAMPLE_STUDENTS) {
    const existing = await StudentWhitelist.findOne({ email: student.email });

    if (existing) {
      existing.set({ ...student, isImported });
      await existing.save();
      updated += 1;
      continue;
    }

    await StudentWhitelist.create({ ...student, isImported });
    created += 1;
  }

  const total = await StudentWhitelist.countDocuments({});
  console.log(`[Whitelist] Tạo mới ${created} | cập nhật ${updated} | tổng trong DB: ${total}`);
  console.log('[Whitelist] isImported =', isImported);

  for (const student of SAMPLE_STUDENTS) {
    console.log(`  - ${student.email} | MSSV ${student.studentId} | ${student.className} | CVHT: ${student.advisorEmail}`);
  }

  if (env.isProduction) console.warn('[Whitelist] CẢNH BÁO: không nên chạy script seed này trên production!');

  await mongoose.disconnect();
};

seedWhitelist().catch((error) => {
  console.error(`[Whitelist] Thất bại: ${error.message}`);
  process.exit(1);
});

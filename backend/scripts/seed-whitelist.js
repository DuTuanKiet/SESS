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
const { blockDotenvConfig, getTestMongoUri } = require('./testDatabaseGuard');
blockDotenvConfig();

const parseArgs = (argv) =>
  argv.reduce((accumulator, argument) => {
    if (!argument.startsWith('--')) return accumulator;
    const [key, value] = argument.slice(2).split('=');
    accumulator[key] = value === undefined ? true : value;
    return accumulator;
  }, {});

const args = parseArgs(process.argv.slice(2));
const target = String(args.target || 'integration');
const mongoUri = getTestMongoUri(target);
process.env.MONGO_URI = mongoUri;

const mongoose = require('mongoose');
const StudentWhitelist = require('../src/models/StudentWhitelist');

/** Dữ liệu sinh viên giả lập chỉ dùng trong database test */
const SAMPLE_STUDENTS = [
  {
    // Merge: fixture tổng hợp, đồng bộ với tài khoản student mặc định của seed-user.
    email: '110122000@student.ctuet.edu.vn',
    studentId: '110122000',
    fullName: 'Sinh viên kiểm thử mặc định',
    className: 'TEST',
    faculty: '',
    phone: '',
    advisorEmail: 'teacher01@ctuet.edu.vn',
  },
  {
    email: '110122001@student.ctuet.edu.vn',
    studentId: '110122001',
    fullName: 'Nguyễn Văn A',
    className: 'KTPM K23B',
    faculty: '',
    phone: '0900000002',
    advisorEmail: 'cvht.ktpm@ctuet.edu.vn',
  },
  {
    email: '110122002@student.ctuet.edu.vn',
    studentId: '110122002',
    fullName: 'Trần Thị B',
    className: 'HTTT K23A',
    faculty: '',
    phone: '0900000003',
    advisorEmail: 'cvht.httt@ctuet.edu.vn',
  },
  {
    email: '110122003@student.ctuet.edu.vn',
    studentId: '110122003',
    fullName: 'Lê Văn C',
    className: 'HTTT K23B',
    faculty: '',
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
    faculty: '',
    phone: '0900000005',
    advisorEmail: 'cvht.httt@ctuet.edu.vn',
  },
];

const seedWhitelist = async () => {
  const isImported = Boolean(args.imported);

  await mongoose.connect(mongoUri);

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
    console.log(
      `  - ${student.email} | MSSV ${student.studentId} | ${student.className} ` +
        `| CVHT: ${student.advisorEmail}`,
    );
  }

  await mongoose.disconnect();
};

seedWhitelist().catch((error) => {
  console.error(`[Whitelist] Thất bại: ${error.message}`);
  process.exit(1);
});

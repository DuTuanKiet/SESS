/**
 * Script kiểm tra định tuyến email thực tế (chạy tay, cần SMTP thật trong .env).
 *
 *   node scripts/test-mail.js
 *
 * Mục tiêu:
 *   1. Chứng minh MỌI email của hệ thống đều được gửi tới GLOBAL_TEST_EMAIL
 *      dù người nhận dự kiến là địa chỉ mẫu/khác (tránh lỗi SMTP 5.1.1).
 *   2. Xác nhận email thật sự được SMTP chấp nhận (không chỉ in ra console).
 *   3. Kiểm tra chặn địa chỉ mẫu ở production (không gửi tới 110122001@...).
 */
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = require('../src/config/env');
const mailerService = require('../src/services/mailerService');
const { GLOBAL_TEST_EMAIL } = require('../src/utils/constants');

const results = [];

const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ` -> ${detail}` : ''}`);
};

/** Địa chỉ mẫu KHÔNG tồn tại ngoài đời (dùng để tạo áp lực cho bộ chuyển hướng) */
const FAKE_RECIPIENTS = [
  '110122001@student.ctuet.edu.vn',
  'it.student@ctuet.edu.vn',
  'mentor01@ctuet.edu.vn',
];

const run = async () => {
  console.log('=========================================================');
  console.log(' SESS - KIỂM TRA GỬI EMAIL THỰC TẾ');
  console.log('=========================================================');
  console.log(`NODE_ENV     : ${env.nodeEnv}`);
  console.log(`SMTP cấu hình: ${env.mail.host || '(trống)'} | user: ${env.mail.user || '(trống)'}`);
  console.log(`Email nhận    : ${GLOBAL_TEST_EMAIL}\n`);

  // 1. Định tuyến: mọi địa chỉ mẫu phải hội tụ về GLOBAL_TEST_EMAIL
  console.log('[1] Kiểm tra định tuyến đích gửi');
  for (const recipient of [...FAKE_RECIPIENTS, GLOBAL_TEST_EMAIL]) {
    const target = mailerService.resolveDeliveryTarget(recipient);
    record(
      `Định tuyến ${recipient}`,
      target.deliveryTo === GLOBAL_TEST_EMAIL && !target.skipped,
      `-> ${target.deliveryTo}${target.redirected ? ' (chuyển hướng)' : ' (trực tiếp)'}`,
    );
  }

  // 2. Chặn địa chỉ mẫu ở production
  console.log('\n[2] Kiểm tra chặn địa chỉ mẫu (mô phỏng production)');
  const isProduction = env.isProduction;
  env.isProduction = true;
  for (const recipient of FAKE_RECIPIENTS) {
    const target = mailerService.resolveDeliveryTarget(recipient);
    record(
      `Chặn ${recipient} ở production`,
      target.skipped && target.deliveryTo === null,
      target.skipped ? 'đã chặn' : 'KHÔNG chặn (rủi ro lỗi 5.1.1)',
    );
  }
  const realTarget = mailerService.resolveDeliveryTarget('nguoidungthat@student.ctuet.edu.vn');
  record(
    'Production vẫn gửi tới người nhận thật',
    realTarget.deliveryTo === 'nguoidungthat@student.ctuet.edu.vn' && !realTarget.skipped,
    `-> ${realTarget.deliveryTo}`,
  );
  env.isProduction = isProduction;

  // 3. Gửi thật qua SMTP
  console.log('\n[3] Gửi email thật qua SMTP');
  const otp = mailerService.renderOtpEmail('110122001@student.ctuet.edu.vn', '123456', 5);
  const otpResult = await mailerService.sendMail(otp);
  record(
    'Gửi OTP (người nhận dự kiến là địa chỉ mẫu) tới GLOBAL_TEST_EMAIL',
    otpResult.sent === true && otpResult.deliveryTo === GLOBAL_TEST_EMAIL,
    `sent=${otpResult.sent} -> ${otpResult.deliveryTo}${otpResult.messageId ? ` | id=${otpResult.messageId}` : ''}`,
  );

  const welcomeResult = await mailerService.sendWelcomeEmail(GLOBAL_TEST_EMAIL, {
    fullName: 'Dư Tuấn Kiệt',
    studentId: 'KTPM2311025',
  });
  record(
    'Gửi email chào mừng tới GLOBAL_TEST_EMAIL',
    welcomeResult.sent === true,
    `sent=${welcomeResult.sent} -> ${welcomeResult.deliveryTo}`,
  );

  const inviteResult = await mailerService.sendProjectInvitationEmail(
    '110122002@student.ctuet.edu.vn',
    {
      projectTitle: 'Dự án kiểm thử mail',
      projectCode: 'SESS-2099-001',
      inviterName: 'Nguyễn Văn A',
      inviteeName: 'Trần Thị B',
    },
  );
  record(
    'Gửi lời mời dự án (người nhận dự kiến là địa chỉ mẫu) tới GLOBAL_TEST_EMAIL',
    inviteResult.sent === true && inviteResult.deliveryTo === GLOBAL_TEST_EMAIL,
    `sent=${inviteResult.sent} -> ${inviteResult.deliveryTo}`,
  );

  const receiptResults = await mailerService.sendDigitalReceiptEmail(
    '110122003@student.ctuet.edu.vn',
    {
      projectCode: 'SESS-2099-002',
      projectTitle: 'Dự án kiểm thử biên nhận số',
      version: 1,
      receiptHash: 'a'.repeat(64),
      receiptTimestamp: new Date().toISOString(),
      memberEmails: ['110122004@student.ctuet.edu.vn'],
    },
  );
  const receiptSent = Array.isArray(receiptResults)
    ? receiptResults.filter((item) => item.sent === true && item.deliveryTo === GLOBAL_TEST_EMAIL)
    : [];
  record(
    'Gửi biên nhận số (Owner + thành viên) tới GLOBAL_TEST_EMAIL',
    receiptSent.length === 2,
    `đã gửi thật ${receiptSent.length}/${Array.isArray(receiptResults) ? receiptResults.length : 0} bản (Owner + 1 thành viên), tất cả hội tụ về GLOBAL_TEST_EMAIL`,
  );

  // 4. Tổng kết
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log('\n=========================================================');
  console.log(` KẾT QUẢ MAIL: ${passed} PASS / ${failed} FAIL / ${results.length} tổng`);
  console.log('=========================================================');

  if (failed > 0) {
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - FAIL: ${r.name} (${r.detail})`));
  }

  process.exit(failed > 0 ? 1 : 0);
};

run().catch((error) => {
  console.error('[Mail Test] Lỗi không mong đợi:', error);
  process.exit(1);
});

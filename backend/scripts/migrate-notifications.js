// Chạy thủ công; không nạp .env hoặc config ứng dụng. URI được nhập qua stdin, không ghi log.
const mongoose = require('mongoose');
const { migrateNotifications } = require('../src/services/notificationMigrationService');

async function main() {
  const args = process.argv.slice(2);
  const database = args.find((arg) => arg.startsWith('--database='))?.slice(11);
  const apply = args.includes('--apply');
  if (!database || !/^[a-zA-Z0-9_-]+$/.test(database)) throw new Error('Cần --database=<tên-db>.');
  if (apply && !args.includes(`--confirm-database=${database}`)) {
    throw new Error('Apply cần --confirm-database trùng database đã chọn.');
  }
  if (apply && args.includes('--dry-run')) throw new Error('Không kết hợp --apply và --dry-run.');
  if (args.some((arg) => !['--apply', '--dry-run', '--create-index'].includes(arg)
    && !arg.startsWith('--database=') && !arg.startsWith('--confirm-database='))) {
    throw new Error('Tham số không được hỗ trợ.');
  }
  let uri = '';
  for await (const chunk of process.stdin) uri += chunk;
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri.trim())) throw new Error('Cần MongoDB URI qua stdin.');
  const connection = await mongoose.createConnection(uri.trim(), { dbName: database, autoIndex: false }).asPromise();
  try {
    const report = await migrateNotifications({
      collection: connection.db.collection('notifications'), dryRun: !apply,
      createIndex: args.includes('--create-index'),
    });
    console.log(JSON.stringify({ database, ...report }, null, 2));
    if (report.issues.length || report.conflicts.length) process.exitCode = 1;
  } finally {
    await connection.close();
  }
}
main().catch((error) => {
  // Không in error.message từ driver vì có thể chứa thông tin kết nối.
  console.error('Migration chưa hoàn tất. Kiểm tra tham số, kết nối và báo cáo dry-run.', error.name);
  process.exitCode = 1;
});

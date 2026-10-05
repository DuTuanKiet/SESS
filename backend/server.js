require('dotenv').config();
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
// Nhánh FR05-FR08 dùng src/config/db.js (đọc MONGODB_URI) - giữ lại để không mất logic cũ
const connectLegacyDB = require('./src/config/db');

const PORT = env.port;

/**
 * Hợp nhất luồng khởi động server của 2 nhánh:
 * - FR01-FR04: src/config/database.js (MONGO_URI) + tắt server an toàn (SIGINT/SIGTERM).
 * - FR05-FR08: src/config/db.js (MONGODB_URI) + PORT từ process.env.
 * Chỉ kết nối MongoDB 1 lần duy nhất: nếu có MONGO_URI thì dùng luồng FR01-FR04,
 * nếu chỉ có MONGODB_URI thì dùng luồng FR05-FR08.
 */
const startServer = async () => {
  const useLegacyConnection = !process.env.MONGO_URI && Boolean(process.env.MONGODB_URI);

  if (useLegacyConnection) {
    await connectLegacyDB();
  } else {
    await connectDatabase();
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] Backend đang chạy tại http://localhost:${PORT}/api/v1 (${env.nodeEnv})`);
    console.log(`Backend Server running on port ${PORT}`);
  });

  // Tắt server an toàn: đóng kết nối HTTP rồi mới ngắt MongoDB
  const shutdown = (signal) => {
    console.log(`\n[Server] Nhận tín hiệu ${signal}, đang tắt...`);
    server.close(async () => {
      if (!useLegacyConnection) await disconnectDatabase();
      console.log('[Server] Đã tắt.');
      process.exit(0);
    });
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
};

startServer().catch((error) => {
  console.error(`[Server] Khởi động thất bại: ${error.message}`);
  process.exit(1);
});
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.log(`[Server] Backend đang chạy tại http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });

  // Tắt server an toàn: đóng kết nối HTTP rồi mới ngắt MongoDB
  const shutdown = (signal) => {
    console.log(`\n[Server] Nhận tín hiệu ${signal}, đang tắt...`);
    server.close(async () => {
      await disconnectDatabase();
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

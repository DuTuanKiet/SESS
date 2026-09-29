const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

/** Kết nối MongoDB 1 lần duy nhất khi server khởi động */
const connectDatabase = async () => {
  mongoose.connection.on('connected', () => console.log(`[MongoDB] Đã kết nối: ${mongoose.connection.name}`));
  mongoose.connection.on('error', (error) => console.error(`[MongoDB] Lỗi: ${error.message}`));
  mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Mất kết nối'));

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };

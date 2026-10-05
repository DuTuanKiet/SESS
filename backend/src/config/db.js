const mongoose = require('mongoose');

/**
 * Kết nối MongoDB Atlas thông qua MONGODB_URI trong .env.
 * Ném lỗi và kết thúc tiến trình nếu kết nối thất bại.
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;

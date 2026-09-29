require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const PORT = process.env.PORT || 5000;
// Kết nối MongoDB trước khi lắng nghe request
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
  });
});
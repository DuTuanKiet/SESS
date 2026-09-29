const express = require('express');
const cors = require('cors');

const v1Routes = require('./routes/index');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Route kiểm tra sức khỏe server (Health Check)
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SESS Backend API is running smoothly!' });
});

// Mount toàn bộ API v1
app.use('/api/v1', v1Routes);

// Centralized Error Handler - phải đặt cuối cùng
app.use(errorHandler);

module.exports = app;
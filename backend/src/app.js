const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');
const { apiLimiter } = require('./middlewares/rateLimitMiddleware');

const app = express();

// Middlewares cơ bản
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Route kiểm tra sức khỏe server (Health Check)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SESS Backend API is running smoothly!',
    data: { apiVersion: 'v1', basePath: '/api/v1' },
  });
});

// Toàn bộ API phiên bản 1: /api/v1/... (rate-limit tổng quát chống spam/scan)
app.use('/api/v1', apiLimiter, apiRoutes);

// 404 cho route không tồn tại + Error Middleware xử lý mọi lỗi tập trung
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
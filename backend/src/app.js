const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler: apiErrorHandler } = require('./middlewares/errorMiddleware');
const { apiLimiter } = require('./middlewares/rateLimitMiddleware');
const { errorHandler: legacyErrorHandler } = require('./middlewares/errorHandler');

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
// routes/index.js đã mount đủ route của cả 2 nhánh:
//   FR01-FR04 -> /auth, /users, /admin, /projects (FR03/FR04)
//   FR05-FR08 -> /mentors, /mentor-assignments, /evaluation-rubrics, /projects (admin duyệt + milestone)
app.use('/api/v1', apiLimiter, apiRoutes);

// 404 cho route không tồn tại -> đẩy sang Error Middleware
app.use(notFoundHandler);

/**
 * Error Middleware hợp nhất 2 nhánh:
 * - Lỗi nghiệp vụ của FR05-FR08 được tạo bằng createError (có statusCode nhưng KHÔNG phải ApiError)
 *   -> dùng handler gốc của FR05-FR08 để giữ nguyên error code riêng
 *      (PROJECT_NOT_FOUND, MENTOR_CAPACITY_EXCEEDED, MILESTONE_NOT_EDITABLE...).
 * - Các lỗi còn lại (ApiError, Mongoose ValidationError/CastError, JWT, JSON body...)
 *   -> dùng handler của FR01-FR04 để trả format thống nhất { success, message, code, errors? }.
 */
app.use((error, req, res, next) => {
  const isLegacyBusinessError =
    Boolean(error?.statusCode) && error.name !== 'ApiError' && !error.isOperational;

  return isLegacyBusinessError
    ? legacyErrorHandler(error, req, res, next)
    : apiErrorHandler(error, req, res, next);
});

module.exports = app;
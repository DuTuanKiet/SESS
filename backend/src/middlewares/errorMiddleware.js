const env = require('../config/env');
const ApiError = require('../utils/apiError');

/** Route không tồn tại -> đẩy sang Error Middleware */
const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Không tìm thấy endpoint ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
};

/** Chuyển mọi loại lỗi (ApiError, Mongoose, JWT, JSON...) về 1 format response duy nhất */
const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error instanceof SyntaxError && 'body' in error) {
    return ApiError.badRequest('Body JSON không hợp lệ', 'INVALID_JSON_BODY');
  }
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
    return ApiError.badRequest('Dữ liệu gửi lên không hợp lệ', 'VALIDATION_ERROR', details);
  }
  if (error.name === 'CastError') {
    return ApiError.badRequest(`Giá trị "${error.value}" không đúng định dạng của trường "${error.path}"`, 'INVALID_ID');
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue ?? {}).join(', ') || 'không xác định';
    return ApiError.conflict(`Giá trị của trường "${field}" đã tồn tại`, 'DUPLICATE_KEY');
  }
  if (error.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token đã hết hạn, vui lòng làm mới phiên đăng nhập', 'TOKEN_EXPIRED');
  }
  if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
    return ApiError.unauthorized('Token không hợp lệ', 'INVALID_TOKEN');
  }
  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'Dữ liệu gửi lên quá lớn', 'PAYLOAD_TOO_LARGE');
  }

  return new ApiError(
    error.statusCode ?? 500,
    env.isProduction ? 'Lỗi hệ thống, vui lòng thử lại sau' : error.message,
    'INTERNAL_ERROR',
  );
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, _req, res, _next) => {
  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error('[Error]', error);
  }

  const body = { success: false, message: normalized.message, code: normalized.code };
  if (normalized.details) body.errors = normalized.details;
  if (!env.isProduction && normalized.statusCode >= 500) body.stack = error.stack;

  res.status(normalized.statusCode).json(body);
};

module.exports = { notFoundHandler, errorHandler };

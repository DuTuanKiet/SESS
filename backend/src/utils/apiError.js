/**
 * Lỗi nghiệp vụ có status code + error code.
 * Chỉ cần `throw ApiError.xxx(...)` ở service/controller,
 * Error Middleware ở app.js sẽ lo phần trả response.
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện hành động này', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Không tìm thấy tài nguyên', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }

  static tooManyRequests(message, code = 'TOO_MANY_REQUESTS') {
    return new ApiError(429, message, code);
  }

  static serviceUnavailable(message, code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}

module.exports = ApiError;

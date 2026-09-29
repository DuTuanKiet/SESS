/**
 * Centralized Error Handler (Express error-handling middleware).
 * Bắt tất cả lỗi từ next(error) trong controllers và services.
 * Xử lý mã MongoDB 11000 (Duplicate Key) thành 409 Conflict.
 * Không để lộ stack trace trong môi trường production.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // MongoDB Duplicate Key Error -> 409 Conflict
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'Dữ liệu bị trùng lặp. Thao tác này vi phạm ràng buộc duy nhất.',
    });
  }

  // Mongoose CastError (ObjectId không đúng định dạng) -> 400 Bad Request
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ID_FORMAT',
      message: `ID '${err.value}' không đúng định dạng ObjectId hợp lệ.`,
    });
  }

  // Lỗi nghiệp vụ có gắn statusCode (ném từ service)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code || 'BUSINESS_ERROR',
      message: err.message,
    });
  }

  // Lỗi không xác định - ghi log nội bộ, không lộ chi tiết ra ngoài
  console.error('[ErrorHandler]', err);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Hệ thống gặp sự cố. Vui lòng thử lại sau.',
  });
}
//Tạo đối tượng AppError có gắn statusCode để service có thể ném về controller.

function createError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

module.exports = { errorHandler, createError };

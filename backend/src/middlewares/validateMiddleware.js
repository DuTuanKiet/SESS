//Middleware validate dữ liệu request bằng Zod schema.
//Đặt trước controller để dữ liệu lỗi không bao giờ vào tầng business logic.
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    function extractErrors(zodError) {
      const issues = zodError?.issues || zodError?.errors || [];
      return issues.map((e) => ({
        field: e.path.join('.') || 'root',
        message: e.message,
      }));
    }

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...extractErrors(result.error));
      } else {
        req.body = result.data;
      }
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...extractErrors(result.error));
      } else {
        Object.defineProperty(req, 'params', {
          value: result.data,
          writable: true,
          configurable: true,
        });
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...extractErrors(result.error));
      } else {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu đầu vào không hợp lệ.',
        errors,
      });
    }

    next();
  };
}

module.exports = validate;

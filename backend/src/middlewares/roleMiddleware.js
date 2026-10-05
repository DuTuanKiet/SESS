// Middleware phân quyền dựa trên systemRole (RBAC).
// Phải đặt sau authMiddleware để req.user đã được gán.
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.systemRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện thao tác này. Chỉ Admin mới có quyền.',
      });
    }
    next();
  };
}

module.exports = authorizeRoles;

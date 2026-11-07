// Middleware phân quyền ưu tiên role, fallback systemRole cho dữ liệu cũ (RBAC).
// Phải đặt sau authMiddleware để req.user đã được gán.
function authorizeRoles(...roles) {
  const allowed = new Set(roles.map((role) => String(role).toLowerCase()));
  // alias mentor<->teacher
  if (allowed.has('mentor') || allowed.has('teacher')) { allowed.add('mentor'); allowed.add('teacher'); }
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' });
    // Merge: không hợp quyền từ systemRole cũ khi role hiện tại đã được hạ quyền.
    const userRole = String(req.user.role || req.user.systemRole || '').toLowerCase();
    if (!allowed.has(userRole)) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}
module.exports = authorizeRoles;

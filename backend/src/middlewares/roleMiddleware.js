// Middleware phân quyền dựa trên systemRole (RBAC).
// Phải đặt sau authMiddleware để req.user đã được gán.
function authorizeRoles(...roles) {
  const allowed = new Set(roles.flatMap((r) => [r, r.toLowerCase()]));
  // alias mentor<->teacher
  if (allowed.has('mentor') || allowed.has('teacher')) { allowed.add('mentor'); allowed.add('teacher'); }
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' });
    const userRoles = [req.user.role, req.user.systemRole].filter(Boolean).map((r) => String(r).toLowerCase());
    if (!userRoles.some((r) => allowed.has(r))) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
  };
}
module.exports = authorizeRoles;

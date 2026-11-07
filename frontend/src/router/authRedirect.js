const dashboardPaths = {
  student: '/student', mentor: '/advisor', teacher: '/advisor', judge: '/judge', admin: '/admin',
};

/** Merge: ưu tiên đích nội bộ đúng quyền, rồi đích backend; portal không quyết định vai trò. */
export function getLoginRedirect(router, { user, requestedPath, redirectPath }) {
  const role = String(user?.role || user?.systemRole || '').toLowerCase();

  function resolveAllowed(candidate, depth = 0) {
    if (depth > 8) return null;
    if (typeof candidate === 'string') {
      if (!candidate.startsWith('/') || candidate.startsWith('//')) return null;
      try {
        const decoded = decodeURIComponent(candidate);
        if (decoded.startsWith('//') || /[\\\s]/.test(decoded)) return null;
      } catch {
        return null;
      }
    } else if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return null;
    }
    try {
      const target = router.resolve(candidate);
      if (!target.matched.length || target.name === 'not-found'
        || /^\/auth(?:\/|$)/.test(target.path) || target.path === '/admin/login') return null;
      const allowed = target.matched.every(({ meta = {} }) =>
        !meta.guestOnly && (!meta.roles?.length
          || meta.roles.some((allowedRole) => String(allowedRole).toLowerCase() === role)));
      if (!allowed) return null;
      const redirect = target.matched[target.matched.length - 1].redirect;
      if (redirect) {
        const next = typeof redirect === 'function' ? redirect(target) : redirect;
        return resolveAllowed(next, depth + 1);
      }
      return target.fullPath;
    } catch {
      return null;
    }
  }

  // Query và response chỉ chấp nhận chuỗi URL nội bộ, không nhận route object từ bên ngoài.
  return (typeof requestedPath === 'string' && resolveAllowed(requestedPath))
    || (typeof redirectPath === 'string' && resolveAllowed(redirectPath))
    || dashboardPaths[role] || '/';
}

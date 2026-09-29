const userService = require('../services/userService');

/** GET /users/me - authenticate middleware đã nạp user mới nhất nên không query lại DB */
const getMyProfile = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lấy thông tin cá nhân thành công.',
    data: { user: req.user },
  });
};

/** PATCH /admin/users/:id/status */
const updateUserStatus = async (req, res) => {
  const { user, changed } = await userService.updateStatus({
    targetUserId: req.params.id,
    status: req.body?.status,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: changed
      ? `Đã cập nhật trạng thái tài khoản thành ${user.status}.`
      : `Tài khoản đang ở trạng thái ${user.status}, không có thay đổi nào.`,
    data: { user },
  });
};

/** POST /admin/users - admin tạo tài khoản (không có API đăng ký tự do) */
const createUser = async (req, res) => {
  const { user, mentor } = await userService.createUser({ payload: req.body, actor: req.user, req });

  res.status(201).json({
    success: true,
    message: mentor
      ? `Đã tạo tài khoản ${user.email} (${user.role}) và khởi tạo hồ sơ Mentor.`
      : `Đã tạo tài khoản ${user.email} (${user.role}).`,
    data: { user, mentorProfileReady: Boolean(mentor) },
  });
};

/** PATCH /admin/users/:id/role - đổi vai trò; chuyển sang MENTOR sẽ tự tạo hồ sơ Mentor */
const updateUserRole = async (req, res) => {
  const { user, mentor, changed } = await userService.updateRole({
    targetUserId: req.params.id,
    role: req.body?.role,
    actor: req.user,
    req,
  });

  res.status(200).json({
    success: true,
    message: changed
      ? `Đã đổi vai trò tài khoản thành ${user.role}.${mentor ? ' Hồ sơ Mentor đã được khởi tạo.' : ''}`
      : `Tài khoản đã ở vai trò ${user.role}, không có thay đổi nào.`,
    data: { user, mentorProfileReady: Boolean(mentor) },
  });
};

/** PUT /users/profile/me - cập nhật thông tin bổ trợ của hồ sơ (FR02) */
const updateMyProfileDetail = async (req, res) => {
  const data = await userService.updateMyProfileDetail(req.user, req.body);
  res.status(200).json({ success: true, message: 'Cập nhật hồ sơ cá nhân thành công.', data });
};

/** GET /users/profile/me - hồ sơ cá nhân đầy đủ (FR02) */
const getMyProfileDetail = async (req, res) => {
  const data = await userService.getMyProfileDetail(req.user);
  res.status(200).json({ success: true, message: 'Lấy hồ sơ cá nhân thành công.', data });
};

module.exports = {
  getMyProfile,
  updateUserStatus,
  createUser,
  updateUserRole,
  getMyProfileDetail,
  updateMyProfileDetail,
};

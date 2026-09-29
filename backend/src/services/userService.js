const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const tokenService = require('./tokenService');
const whitelistService = require('./whitelistService');
const mentorService = require('./mentorService');
const ApiError = require('../utils/apiError');
const { logAuditAction } = require('../utils/audit');
const {
  USER_STATUS,
  USER_ROLES,
  AUTH_PROVIDERS,
  AUDIT_ACTIONS,
  AUDIT_TARGETS,
} = require('../utils/constants');
const {
  assertEnum,
  assertRequired,
  assertEmail,
  assertOptionalString,
  assertStringArray,
  assertOptionalUrl,
  assertOptionalPhone,
} = require('../utils/validation');

/** Chuẩn hoá vai trò/trạng thái nhận từ client (SRS dùng MENTOR/ACTIVE, DB lưu chữ thường) */
const normalizeRoleInput = (role) => String(role ?? '').trim().toLowerCase();
const normalizeStatusInput = (status) => String(status ?? '').trim().toUpperCase();

/** Admin khoá / mở khoá tài khoản (có ghi AuditLog - FR14) */
const updateStatus = async ({ targetUserId, status, actor, req }) => {
  assertEnum(normalizeStatusInput(status), Object.values(USER_STATUS), 'status');

  // ObjectId sai định dạng sẽ được Error Middleware trả về 400 INVALID_ID
  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng cần cập nhật', 'USER_NOT_FOUND');

  if (String(user._id) === String(actor.id) && status === USER_STATUS.SUSPENDED) {
    throw ApiError.badRequest('Bạn không thể tự tạm khoá tài khoản của chính mình', 'CANNOT_SUSPEND_SELF');
  }
  if (user.status === status) return { user, changed: false };

  const previousStatus = user.status;
  user.status = status;
  await user.save();

  // Bị khoá -> thu hồi toàn bộ phiên đăng nhập ngay lập tức
  if (status === USER_STATUS.SUSPENDED) await tokenService.revokeAllSessions(user._id);

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CHANGE_USER_STATUS,
    targetEntity: AUDIT_TARGETS.USER,
    targetId: user._id,
    oldValues: { status: previousStatus },
    newValues: { status: user.status },
    req,
  });

  return { user, changed: true };
};

/**
 * Admin đổi vai trò hệ thống (systemRole) của user.
 * FR-MENTOR-01: khi vai trò là MENTOR -> tự động upsert hồ sơ Mentor (default expertise/fields/maxProjects/status).
 */
const updateRole = async ({ targetUserId, role, actor, req }) => {
  const normalizedRole = normalizeRoleInput(role);
  assertEnum(normalizedRole, Object.values(USER_ROLES), 'role');

  const user = await User.findById(targetUserId);
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng cần cập nhật', 'USER_NOT_FOUND');

  if (String(user._id) === String(actor.id) && normalizedRole !== USER_ROLES.ADMIN) {
    throw ApiError.badRequest('Bạn không thể tự hạ quyền của chính mình', 'CANNOT_CHANGE_OWN_ROLE');
  }

  const previousRole = user.role;
  if (previousRole === normalizedRole) {
    const mentor = await mentorService.ensureMentorProfile(user);
    return { user, mentor, changed: false };
  }

  user.role = normalizedRole;
  await user.save();

  const mentor = await mentorService.ensureMentorProfile(user);

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CHANGE_USER_ROLE,
    targetEntity: AUDIT_TARGETS.USER,
    targetId: user._id,
    oldValues: { role: previousRole },
    newValues: { role: user.role, mentorProfileReady: Boolean(mentor) },
    req,
  });

  return { user, mentor, changed: true };
};

/** Admin tạo tài khoản mới (hệ thống KHÔNG có API đăng ký tự do) */
const createUser = async ({ payload = {}, actor, req }) => {
  const email = assertEmail(payload.email);
  const role = payload.role
    ? assertEnum(normalizeRoleInput(payload.role), Object.values(USER_ROLES), 'role')
    : USER_ROLES.STUDENT;
  const password = assertRequired(payload.password, 'password');
  if (password.length < 8) {
    throw ApiError.badRequest('"password" phải có tối thiểu 8 ký tự', 'INVALID_PASSWORD');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.conflict('Email này đã được sử dụng', 'EMAIL_ALREADY_EXISTS');

  // Tài khoản sinh viên bắt buộc phải có trong danh sách của trường
  if (role === USER_ROLES.STUDENT) {
    await whitelistService.assertStudentInWhitelist(email);
  }

  const user = new User({
    email,
    password,
    role,
    fullName: payload.fullName?.trim() ?? '',
    studentId: payload.studentId?.trim() || undefined,
    status: USER_STATUS.ACTIVE,
    authProvider: AUTH_PROVIDERS.LOCAL,
    isEmailVerified: Boolean(payload.isEmailVerified),
  });
  await user.save();

  // FR-MENTOR-01: tạo tài khoản mentor -> tự khởi tạo hồ sơ Mentor
  const mentor = await mentorService.ensureMentorProfile(user);

  await logAuditAction({
    actor,
    action: AUDIT_ACTIONS.CREATE_USER,
    targetEntity: AUDIT_TARGETS.USER,
    targetId: user._id,
    newValues: { email: user.email, role: user.role, mentorProfileReady: Boolean(mentor) },
    req,
  });

  return { user, mentor };
};

/** Trường do nhà trường quản lý - sinh viên KHÔNG được sửa */
const SCHOOL_MANAGED_FIELDS = ['email', 'fullName', 'studentId', 'className', 'advisorEmail'];

/** Trường bổ trợ sinh viên được phép cập nhật */
const EDITABLE_PROFILE_FIELDS = ['bio', 'skills', 'phone', 'avatarUrl', 'socialLinks'];

const SOCIAL_LINK_FIELDS = ['facebook', 'github', 'linkedin', 'website'];

/** Validate riêng cho socialLinks */
const assertSocialLinks = (value) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw ApiError.badRequest('"socialLinks" phải là object', 'INVALID_FIELD');
  }

  return Object.entries(value).reduce((result, [key, url]) => {
    if (!SOCIAL_LINK_FIELDS.includes(key)) {
      throw ApiError.badRequest(`"socialLinks.${key}" không được hệ thống hỗ trợ`, 'INVALID_FIELD');
    }
    result[key] = assertOptionalUrl(url, `socialLinks.${key}`);
    return result;
  }, {});
};

/**
 * Lấy hồ sơ cá nhân, tự khởi tạo ở lần truy cập đầu tiên (FR02).
 * Nhóm trường chính thức luôn được đồng bộ từ StudentWhitelist của nhà trường.
 */
const ensureProfile = async (user) => {
  const whitelistStudent = await whitelistService.findStudentByEmail(user.email);
  const officialData = {
    email: user.email,
    fullName: whitelistStudent?.fullName || user.fullName || '',
    studentId: whitelistStudent?.studentId || user.studentId || '',
    className: whitelistStudent?.className || user.className || '',
    advisorEmail: whitelistStudent?.advisorEmail || user.advisorEmail || '',
  };

  const existingProfile = await UserProfile.findOne({ userId: user._id });
  if (!existingProfile) {
    return UserProfile.create({ userId: user._id, ...officialData });
  }

  existingProfile.set(officialData);
  await existingProfile.save();
  return existingProfile;
};

/** GET /users/profile/me */
const getMyProfileDetail = async (user) => ({ profile: await ensureProfile(user) });

/** PUT /users/profile/me - chỉ cho phép cập nhật thông tin bổ trợ */
const updateMyProfileDetail = async (user, payload = {}) => {
  const blockedFields = SCHOOL_MANAGED_FIELDS.filter((field) => payload[field] !== undefined);
  if (blockedFields.length) {
    throw ApiError.badRequest(
      `Không thể thay đổi thông tin do nhà trường quản lý: ${blockedFields.join(', ')}`,
      'SCHOOL_MANAGED_FIELD',
    );
  }

  const unknownFields = Object.keys(payload).filter((field) => !EDITABLE_PROFILE_FIELDS.includes(field));
  if (unknownFields.length) {
    throw ApiError.badRequest(`Trường không được phép cập nhật: ${unknownFields.join(', ')}`, 'INVALID_FIELD');
  }

  const profile = await ensureProfile(user);
  const data = {};

  if (payload.bio !== undefined) data.bio = assertOptionalString(payload.bio, 'bio', 1000) ?? '';
  if (payload.skills !== undefined) data.skills = assertStringArray(payload.skills, 'skills');
  if (payload.phone !== undefined) data.phone = assertOptionalPhone(payload.phone);
  if (payload.avatarUrl !== undefined) data.avatarUrl = assertOptionalUrl(payload.avatarUrl, 'avatarUrl');
  if (payload.socialLinks !== undefined) {
    const currentLinks = profile.socialLinks?.toObject?.() ?? {};
    data.socialLinks = { ...currentLinks, ...assertSocialLinks(payload.socialLinks) };
  }

  if (!Object.keys(data).length) {
    throw ApiError.badRequest('Không có thông tin nào để cập nhật', 'NOTHING_TO_UPDATE');
  }

  profile.set(data);
  await profile.save();
  return { profile };
};

module.exports = {
  updateStatus,
  updateRole,
  createUser,
  getMyProfileDetail,
  updateMyProfileDetail,
};

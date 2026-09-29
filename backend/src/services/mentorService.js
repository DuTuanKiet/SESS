const Mentor = require('../models/Mentor');
const { USER_ROLES, MENTOR_STATUS, MENTOR_DEFAULT_MAX_PROJECTS } = require('../utils/constants');

/**
 * Bảo đảm tồn tại hồ sơ Mentor cho user (FR-MENTOR-01):
 * tạo mới nếu chưa có, giữ nguyên dữ liệu nếu đã có (không ghi đè cấu hình của Mentor).
 */
const ensureMentorProfile = async (user) => {
  if (!user || user.role !== USER_ROLES.MENTOR) return null;

  return Mentor.findOneAndUpdate(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName ?? '',
        expertise: [],
        fields: [],
        maxProjects: MENTOR_DEFAULT_MAX_PROJECTS,
        status: MENTOR_STATUS.ACTIVE,
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
};

/** Lấy hồ sơ Mentor theo userId */
const findMentorByUserId = (userId) => Mentor.findOne({ userId });

module.exports = { ensureMentorProfile, findMentorByUserId };

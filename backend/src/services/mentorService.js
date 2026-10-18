const mongoose = require('mongoose');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const MentorAssignment = require('../models/MentorAssignment');
const AuditLog = require('../models/AuditLog');
const { createAuditLog } = require('./auditService');
const projectService = require('./projectService');
const { createError } = require('../middlewares/errorHandler');
const {
  SYSTEM_ROLES,
  USER_ROLES,
  USER_STATUS,
  PROJECT_STATUS,
  ASSIGNMENT_STATUS,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  MAX_PROJECTS_PER_MENTOR,
  MENTOR_STATUS,
  MENTOR_DEFAULT_MAX_PROJECTS,
  MENTORSHIP_ELIGIBLE_STATUSES,
} = require('../utils/constants');
/**
 * Lấy danh sách mentor trực tiếp từ bảng Mentor với số lượng dự án đang phát triển (UnderMentorship).
 * Hỗ trợ phân trang, lọc theo lĩnh vực/chuyên môn, tìm kiếm tên/email và lọc theo tình trạng tải.
 * Một mentor tối đa chỉ nhận 2 dự án cố vấn đồng thời.
 */
async function getMentors({ page = 1, limit = 10, field, keyword, availability = 'all' } = {}) {
  const matchConditions = [];

  // Lọc theo lĩnh vực nhận hướng dẫn (fields) hoặc chuyên môn sâu (expertise) trực tiếp từ bảng Mentor
  if (field) {
    matchConditions.push({
      $or: [
        { fields: { $regex: field, $options: 'i' } },
        { expertise: { $regex: field, $options: 'i' } },
      ],
    });
  }

  // Lọc theo họ tên hoặc email trực tiếp từ bảng Mentor
  if (keyword) {
    matchConditions.push({
      $or: [
        { fullName: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ],
    });
  }

  const matchStage = matchConditions.length > 0 ? { $and: matchConditions } : {};
  const skip = (page - 1) * limit;

  // Aggregation bắt đầu trực tiếp từ Model Mentor
  const pipeline = [
    { $match: matchStage },
    // Join với bảng User để lấy thông tin tài khoản (avatarUrl, role)
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
    // Join với MentorAssignments để đếm các dự án ĐANG PHÁT TRIỂN (UNDER_MENTORSHIP)
    {
      $lookup: {
        from: 'mentorassignments',
        let: { mentorUserId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$mentorId', '$$mentorUserId'] },
              status: ASSIGNMENT_STATUS.ASSIGNED,
            },
          },
          {
            $lookup: {
              from: 'projects',
              localField: 'projectId',
              foreignField: '_id',
              as: 'project',
            },
          },
          { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
          // Chỉ tính các dự án đang trong giai đoạn cố vấn phát triển (UNDER_MENTORSHIP)
          {
            $match: {
              'project.status': PROJECT_STATUS.UNDER_MENTORSHIP,
            },
          },
          {
            $project: {
              _id: 0,
              projectId: '$project._id',
              projectName: '$project.name',
              projectField: '$project.field',
              status: '$project.status',
            },
          },
        ],
        as: 'activeAssignments',
      },
    },
    {
      $addFields: {
        activeProjectsCount: { $size: '$activeAssignments' },
        maxProjects: MAX_PROJECTS_PER_MENTOR, // Luôn cố định là 2 dự án đồng thời
        canAcceptMore: {
          $and: [
            { $eq: ['$status', MENTOR_STATUS.ACTIVE] },
            { $lt: [{ $size: '$activeAssignments' }, MAX_PROJECTS_PER_MENTOR] },
          ],
        },
        currentProjects: '$activeAssignments',
      },
    },
    // Whitelist Positive Projection: Nhận trường role từ bảng User, thông tin chuyên môn từ bảng Mentor
    {
      $project: {
        _id: '$userId',
        mentorProfileId: '$_id',
        userId: '$userId',
        email: 1,
        fullName: 1,
        avatarUrl: { $ifNull: ['$user.avatarUrl', ''] },
        role: { $ifNull: ['$user.role', USER_ROLES.MENTOR] },
        systemRole: { $ifNull: ['$user.systemRole', SYSTEM_ROLES.MENTOR] },
        status: 1,
        expertise: 1,
        fields: 1,
        bio: 1,
        profile: {
          fullName: '$fullName',
          bio: '$bio',
          field: { $ifNull: [{ $arrayElemAt: ['$fields', 0] }, ''] },
        },
        activeProjectsCount: 1,
        maxProjects: 1,
        canAcceptMore: 1,
        currentProjects: 1,
        createdAt: 1,
      },
    },
  ];

  // Lọc theo availability nếu có
  if (availability === 'available') {
    pipeline.push({ $match: { canAcceptMore: true } });
  } else if (availability === 'full') {
    pipeline.push({ $match: { canAcceptMore: false, status: MENTOR_STATUS.ACTIVE } });
  }

  const countPipeline = [...pipeline, { $count: 'total' }];
  const [countResult] = await Mentor.aggregate(countPipeline);
  const total = countResult?.total ?? 0;

  pipeline.push({ $skip: skip }, { $limit: limit });
  const mentors = await Mentor.aggregate(pipeline);

  return {
    mentors,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
  };
}

/**
 * Lấy chi tiết hồ sơ một mentor thông qua bảng Mentor.
 * Tái sử dụng findMentorByUserId và ensureMentorProfile đã có sẵn.
 */
async function getMentorById(mentorId) {
  // Tái sử dụng hàm findMentorByUserId đã có sẵn
  let mentor = await findMentorByUserId(mentorId).lean();
  if (!mentor) {
    // Dự phòng trường hợp caller truyền Mentor._id thay vì userId
    mentor = await Mentor.findById(mentorId).lean();
  }

  // Nếu chưa có trong bảng Mentor, kiểm tra bảng User theo đúng trường role (USER_ROLES.MENTOR)
  if (!mentor) {
    const user = await User.findOne({ _id: mentorId, role: USER_ROLES.MENTOR }).lean();
    if (!user) {
      throw createError('Không tìm thấy mentor.', 404, 'MENTOR_NOT_FOUND');
    }
    // Tái sử dụng ensureMentorProfile đã có sẵn
    const created = await ensureMentorProfile(user);
    mentor = created ? (created.toObject ? created.toObject() : created) : null;
  }

  if (!mentor) {
    throw createError('Không tìm thấy mentor.', 404, 'MENTOR_NOT_FOUND');
  }

  // Lấy avatarUrl và role từ User
  const user = await User.findById(mentor.userId).select('avatarUrl role').lean();

  const assignments = await MentorAssignment.find({ mentorId: mentor.userId })
    .populate('projectId', 'name field status')
    .sort({ assignedAt: -1 })
    .lean();

  // Dự án đang phát triển (UnderMentorship và Assigned)
  const activeProjects = assignments
    .filter(
      (a) =>
        a.status === ASSIGNMENT_STATUS.ASSIGNED &&
        a.projectId?.status === PROJECT_STATUS.UNDER_MENTORSHIP
    )
    .map((a) => ({
      ...a.projectId,
      assignmentStatus: a.status,
      assignedAt: a.assignedAt,
      startedAt: a.startedAt,
    }));

  // Dự án đã kết thúc hoặc không còn trong UnderMentorship
  const pastProjects = assignments
    .filter(
      (a) =>
        a.status !== ASSIGNMENT_STATUS.ASSIGNED ||
        a.projectId?.status !== PROJECT_STATUS.UNDER_MENTORSHIP
    )
    .map((a) => ({
      ...a.projectId,
      assignmentStatus: a.status,
      assignedAt: a.assignedAt,
      startedAt: a.startedAt,
      endedAt: a.endedAt,
    }));

  return {
    _id: mentor.userId,
    mentorProfileId: mentor._id,
    userId: mentor.userId,
    email: mentor.email,
    fullName: mentor.fullName,
    avatarUrl: user?.avatarUrl || '',
    role: user?.role || USER_ROLES.MENTOR,
    systemRole: user?.systemRole || SYSTEM_ROLES.MENTOR,
    status: mentor.status,
    expertise: mentor.expertise || [],
    fields: mentor.fields || [],
    bio: mentor.bio || '',
    profile: {
      fullName: mentor.fullName,
      bio: mentor.bio || '',
      field: mentor.fields?.[0] || '',
    },
    activeProjectsCount: activeProjects.length,
    maxProjects: MAX_PROJECTS_PER_MENTOR, // Cố định 2 dự án đồng thời
    canAcceptMore: mentor.status === MENTOR_STATUS.ACTIVE && activeProjects.length < MAX_PROJECTS_PER_MENTOR,
    activeProjects,
    pastProjects,
    createdAt: mentor.createdAt,
  };
}
/** Phân công mentor cho dự án.
 * Ràng buộc: 1 dự án chỉ có 1 mentor active, mentor không quá 2 dự án cùng lúc.*/
async function assignMentorToProject({ projectId, mentorId, adminId, note }) {
  const project = await projectService.getProjectById(projectId);
  // Ràng buộc nghiệp vụ: Dự án phải ở trạng thái đủ điều kiện phân công (trước UnderMentorship)
  if (!MENTORSHIP_ELIGIBLE_STATUSES.includes(project.status)) {
    throw createError(
      `Dự án đang ở trạng thái '${project.status}', không đủ điều kiện phân công mentor. Chỉ chấp nhận các trạng thái: ${MENTORSHIP_ELIGIBLE_STATUSES.join(', ')}.`,
      400,
      'PROJECT_NOT_ELIGIBLE_FOR_ASSIGNMENT'
    );
  }
  // Ràng buộc 1:1: kiểm tra dự án đã có mentor active chưa
  const existingAssignment = await MentorAssignment.findOne({
    projectId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).lean();
  if (existingAssignment) {
    throw createError(
      'Dự án đã có cố vấn.', 409, 'PROJECT_ALREADY_HAS_MENTOR'
    );
  }
  //kiểm tra mentor tồn tại, đúng vai trò và đang hoạt động
  const mentor = await User.findById(mentorId).lean();
  if (!mentor) {
    throw createError('Mentor không tồn tại.', 404, 'MENTOR_NOT_FOUND');
  }
  if (mentor.role !== USER_ROLES.MENTOR && mentor.systemRole !== SYSTEM_ROLES.MENTOR) {
    throw createError('Người dùng không phải mentor.', 400, 'INVALID_MENTOR_ROLE');
  }
  if (mentor.status !== USER_STATUS.ACTIVE) {
    throw createError('Mentor không khả dụng.', 400, 'MENTOR_INACTIVE');
  }
  // Kiểm tra trần 2 dự án của mentor
  const activeProjectsCount = await MentorAssignment.countDocuments({
    mentorId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  });
  if (activeProjectsCount >= MAX_PROJECTS_PER_MENTOR) {
    throw createError(
      `Mentor này đã đạt giới hạn tối đa dự án cố vấn.`,
      422,
      'MENTOR_CAPACITY_EXCEEDED');}
  // Thực thi trong Transaction: tạo assignment, cập nhật project, ghi audit log
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const now = new Date();
      const [assignment] = await MentorAssignment.create(
        [
          {
            projectId,
            mentorId,
            assignedBy: adminId,
            status: ASSIGNMENT_STATUS.ASSIGNED,
            assignedAt: now,
            startedAt: now,
            note: note || '',
          },
        ],
        { session }
      );
      await projectService.updateProjectStatus(
        projectId,
        PROJECT_STATUS.UNDER_MENTORSHIP,
        { session }
      );
      await createAuditLog({
        userId: adminId,
        action: AUDIT_ACTIONS.ASSIGN_MENTOR,
        targetEntity: AUDIT_ENTITIES.MENTOR_ASSIGNMENTS,
        targetId: assignment._id,
        oldValues: null,
        newValues: {
          mentorId,
          projectId,
          note: note || '',
          startedAt: assignment.startedAt,
        },
        session,
      });
      result = {
        assignmentId: assignment._id,
        projectId: assignment.projectId,
        mentorId: assignment.mentorId,
        mentorName: mentor.fullName || mentor.profile?.fullName || '',
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        startedAt: assignment.startedAt,
      };
    });
  } finally {await session.endSession();}
  return result;
}
/**
 * Phân công lại mentor cho dự án.
 * Đóng assignment cũ, tạo assignment mới trong 1 Transaction.
 * Ghi đầy đủ vết oldValues/newValues vào AuditLog để truy vết.*/
async function reassignMentorToProject({ projectId, newMentorId, adminId, reason }) {
  // kiểm tra dự án tồn tại và phải đang trong giai đoạn cố vấn (UnderMentorship)
  const project = await projectService.getProjectById(projectId);
  if (project.status !== PROJECT_STATUS.UNDER_MENTORSHIP) {
    throw createError(
      'Chỉ có thể phân công lại mentor khi dự án đang trong giai đoạn cố vấn (UnderMentorship).',
      400,
      'PROJECT_NOT_UNDER_MENTORSHIP'
    );
  }

  // Kiểm tra dự án đang có mentor active
  const currentAssignment = await MentorAssignment.findOne({
    projectId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).lean();
  if (!currentAssignment) {
    throw createError(
      'Dự án chưa được phân công mentor.', 404, 'NO_ACTIVE_ASSIGNMENT');}
  // Không được chọn mentor mới trùng với mentor hiện tại
  if (currentAssignment.mentorId.toString() === newMentorId) {
    throw createError(
      'Mentor mới không được trùng với mentor hiện tại.', 400, 'SAME_MENTOR_REASSIGN');}
  // Kiểm tra mentor mới tồn tại, đúng vai trò và đang hoạt động
  const newMentor = await User.findById(newMentorId).lean();
  if (!newMentor) {
    throw createError('Không tìm thấy mentor mới.', 404, 'MENTOR_NOT_FOUND');
  }
  if (newMentor.role !== USER_ROLES.MENTOR && newMentor.systemRole !== SYSTEM_ROLES.MENTOR) {
    throw createError('Người dùng mới được chọn không phải là Mentor.', 400, 'INVALID_MENTOR_ROLE');
  }
  if (newMentor.status !== USER_STATUS.ACTIVE) {
    throw createError('Mentor không hoạt động.', 400, 'MENTOR_INACTIVE');
  }
  // Kiểm tra trần 2 dự án của mentor mới
  const newMentorActiveCount = await MentorAssignment.countDocuments({
    mentorId: newMentorId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  });
  if (newMentorActiveCount >= MAX_PROJECTS_PER_MENTOR) {
    throw createError(
      `Mentor đã đạt giới hạn dự án cố vấn.`, 422, 'MENTOR_CAPACITY_EXCEEDED');}
  // Transaction: đóng assignment cũ, tạo assignment mới, ghi audit log
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const now = new Date();
      // Đóng assignment cũ
      await MentorAssignment.findByIdAndUpdate(
        currentAssignment._id,
        { status: ASSIGNMENT_STATUS.REASSIGNED, endedAt: now },
        { session }
      );
      // Tạo assignment mới
      const [newAssignment] = await MentorAssignment.create(
        [
          {
            projectId,
            mentorId: newMentorId,
            assignedBy: adminId,
            status: ASSIGNMENT_STATUS.ASSIGNED,
            assignedAt: now,
            startedAt: now,
            note: reason,
          },
        ],
        { session }
      );
      // Ghi vết đầy đủ để truy vết lịch sử phân công
      await createAuditLog({
        userId: adminId,
        action: AUDIT_ACTIONS.REASSIGN_MENTOR,
        targetEntity: AUDIT_ENTITIES.MENTOR_ASSIGNMENTS,
        targetId: newAssignment._id,
        oldValues: {
          assignmentId: currentAssignment._id,
          mentorId: currentAssignment.mentorId,
          endedAt: now,
        },
        newValues: {
          assignmentId: newAssignment._id,
          mentorId: newMentorId,
          reason,
          startedAt: newAssignment.startedAt,
        },
        session,
      });
      result = {
        previousAssignmentId: currentAssignment._id,
        newAssignmentId: newAssignment._id,
        projectId,
        newMentorId,
        newMentorName: newMentor.fullName || newMentor.profile?.fullName || '',
        reassignedAt: now,
        startedAt: newAssignment.startedAt,
      };
    });
  } finally {
    await session.endSession();
  }
  return result;
}
 //Lấy toàn bộ lịch sử phân công mentor của một dự án, sắp xếp theo thời gian tạo.
async function getAssignmentHistoryByProject(projectId) {
  // Fail Fast: kiểm tra dự án tồn tại qua projectService
  await projectService.getProjectById(projectId);
  const history = await MentorAssignment.find({ projectId })
    .populate('mentorId', 'profile.fullName profile.field email')
    .populate('assignedBy', 'profile.fullName email')
    .sort({ assignedAt: 1 })
    .lean();
  return history;
}
//Lấy lịch sử Audit Log các thao tác phân công và phân công lại mentor.
async function getAuditHistory({ page = 1, limit = 10 } = {}) {
  const query = {
    action: { $in: [AUDIT_ACTIONS.ASSIGN_MENTOR, AUDIT_ACTIONS.REASSIGN_MENTOR] },
  };
  const skip = (page - 1) * limit;
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate('userId', 'profile.fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return {
    logs,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    },
  };
}

// Đóng đợt cố vấn khi dự án hoàn thành.
//Có thể được gọi từ module dự án hoặc dùng độc lập khi cần kết thúc assignment.
async function completeAssignmentByProjectId(projectId, { session = null } = {}) {
  const activeAssignment = await MentorAssignment.findOne({
    projectId,
    status: ASSIGNMENT_STATUS.ASSIGNED,
  }).session(session);

  if (!activeAssignment) return null;

  activeAssignment.status = ASSIGNMENT_STATUS.COMPLETED;
  activeAssignment.endedAt = new Date();
  await activeAssignment.save({ session });
  return activeAssignment;
}

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

module.exports = {
  // --- FR-MENTOR-01 (FR01-FR04): hồ sơ Mentor ---
  ensureMentorProfile,
  findMentorByUserId,

  // --- FR05-FR08: danh sách mentor, phân công / phân công lại, lịch sử ---
  getMentors,
  getMentorById,
  assignMentorToProject,
  reassignMentorToProject,
  getAssignmentHistoryByProject,
  getAuditHistory,
  completeAssignmentByProjectId,
};

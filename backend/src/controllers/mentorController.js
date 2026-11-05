const mentorService = require('../services/mentorService');
const User = require('../models/User');
const StudentWhitelist = require('../models/StudentWhitelist');
const { createError } = require('../middlewares/errorHandler');

//Lấy danh sách mentor với số dự án đang cố vấn và trạng thái tải.
// @route GET /api/v1/mentors
async function handleGetMentors(req, res, next) {
  try {
    const { page, limit, field, keyword, availability } = req.query;
    const data = await mentorService.getMentors({ page, limit, field, keyword, availability });

    return res.status(200).json({
      success: true,
      code: 'MENTORS_FETCHED',
      message: 'Lấy danh sách mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy chi tiết hồ sơ một mentor
// @route GET /api/v1/mentors/:mentorId
async function handleGetMentorById(req, res, next) {
  try {
    const { mentorId } = req.params;
    const data = await mentorService.getMentorById(mentorId);

    return res.status(200).json({
      success: true,
      code: 'MENTOR_FETCHED',
      message: 'Lấy thông tin mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}
//Phân công mentor cho dự án (Assign)
 // @route POST /api/v1/mentor-assignments
async function handleAssignMentor(req, res, next) {
  try {
    const { projectId, mentorId, note } = req.body;
    // Danh tính Admin lấy từ JWT, không tin req.body
    const adminId = req.user.id;

    const data = await mentorService.assignMentorToProject({ projectId, mentorId, adminId, note });

    return res.status(201).json({
      success: true,
      code: 'MENTOR_ASSIGNED_SUCCESSFULLY',
      message: 'Phân công mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Phân công lại mentor cho dự án (Reassign)
// @route POST /api/v1/mentor-assignments/reassign
async function handleReassignMentor(req, res, next) {
  try {
    const { projectId, newMentorId, reason } = req.body;
    // Danh tính Admin lấy từ JWT, không tin req.body
    const adminId = req.user.id;

    const data = await mentorService.reassignMentorToProject({ projectId, newMentorId, adminId, reason });

    return res.status(200).json({
      success: true,
      code: 'MENTOR_REASSIGNED_SUCCESSFULLY',
      message: 'Phân công lại mentor thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy lịch sử phân công mentor của một dự án
// @route GET /api/v1/mentor-assignments/project/:projectId
async function handleGetProjectAssignmentHistory(req, res, next) {
  try {
    const { projectId } = req.params;
    const data = await mentorService.getAssignmentHistoryByProject(projectId);

    return res.status(200).json({
      success: true,
      code: 'ASSIGNMENT_HISTORY_FETCHED',
      message: 'Lấy lịch sử phân công thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

//Lấy lịch sử Audit Log phân công mentor
// @route GET /api/v1/mentor-assignments/audit-history
async function handleGetAuditHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await mentorService.getAuditHistory({ page, limit });

    return res.status(200).json({
      success: true,
      code: 'AUDIT_HISTORY_FETCHED',
      message: 'Lấy lịch sử audit thành công.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

const MentorService = require('../services/mentorService');
const { ASSIGNMENT_STATUS } = require('../utils/constants');
const MentorAssignment = require('../models/MentorAssignment');
const ProjectMember = require('../models/ProjectMember');
const Notification = require('../models/Notification');
const HonorHistory = require('../models/HonorHistory');
const AssignmentCancellationRequest = require('../models/AssignmentCancellationRequest');
const EmailLog = require('../models/EmailLog');
const mailerService = require('../services/mailerService');
const Project = require('../models/Project');

async function handleGetMyMentorProfile(req, res, next) {
  try {
    const User = require('../models/User');
    const Mentor = require('../models/Mentor');
    const user = await User.findById(req.user._id).select('-password -passwordHash').lean();
    let mentor = await Mentor.findOne({ userId: req.user._id }).lean();
    if (!mentor) {
      mentor = await Mentor.create({ userId: req.user._id, email: user.email, fullName: user.fullName });
      mentor = mentor.toObject();
    }
    const { password, passwordHash, refreshToken, refreshTokens, __v, ...safeUser } = user;
    const data = {
      ...safeUser,
      ...mentor,
      staffCode: mentor.staffCode || '',
      faculty: mentor.faculty || user.department || '',
      phone: mentor.phone || user.phoneNumber || '',
      email: user.email,
      fullName: user.fullName,
    };
    res.status(200).json({ success: true, data });
  } catch (e) { next(e); }
}
async function handleUpdateMyMentorProfile(req, res, next) {
  try {
    const Mentor = require('../models/Mentor');
    const mentor = await Mentor.findOneAndUpdate({ userId: req.user._id }, { $set: req.body }, { new: true });
    res.status(200).json({ success: true, data: mentor });
  } catch (e) { next(e); }
}
async function handleGetMyAssignedProjects(req, res, next) {
  try {
    const assignments = await MentorAssignment.find({ mentorId: req.user._id, status: ASSIGNMENT_STATUS.ASSIGNED }).lean();
    const projectIds = assignments.map((a) => a.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } }).lean();
    const enriched = await Promise.all(projects.map(async (p) => {
      const pmMembers = await ProjectMember.find({ projectId: p._id, status: 'ACCEPTED' }).populate('userId', 'fullName email studentId phoneNumber').lean();
      const members = pmMembers.map((pm) => ({
        _id: pm._id,
        userId: pm.userId,
        fullName: pm.userId?.fullName || pm.fullName || '',
        email: pm.userId?.email || pm.email || '',
        studentId: pm.userId?.studentId || pm.studentId || '',
        studentCode: pm.userId?.studentId || pm.studentId || '',
        role: pm.role,
        status: pm.status,
      }));

      const leaderEmail = p.leaderInfo?.email || p.leaderEmail;
      let leader = null;
      if (leaderEmail) {
        let l = await User.findOne({ email: leaderEmail }).select('fullName email studentId phoneNumber role').lean();
        if (!l) {
          l = await StudentWhitelist.findOne({ email: leaderEmail }).select('fullName email studentId phone advisorEmail').lean();
        }
        if (l) {
          leader = { _id: l._id, fullName: l.fullName || '', email: l.email || '', studentId: l.studentId || '', studentCode: l.studentId || '', phone: l.phoneNumber || l.phone || '', role: l.role || 'Thành viên' };
        }
      }
      // Fallback leader from accepted ProjectMember with role LEADER/OWNER
      if (!leader) {
        const leaderPm = pmMembers.find((m) => ['LEADER', 'OWNER'].includes(String(m.role || '').toUpperCase()));
        if (leaderPm?.userId) {
          leader = { _id: leaderPm.userId._id, fullName: leaderPm.userId.fullName || '', email: leaderPm.userId.email || '', studentId: leaderPm.userId.studentId || '', studentCode: leaderPm.userId.studentId || '', phone: leaderPm.userId.phoneNumber || '', role: leaderPm.role };
        }
      }

      return {
        ...p,
        title: p.title || p.name,
        name: p.name || p.title,
        category: p.category || p.field,
        field: p.field || p.category,
        faculty: p.faculty,
        objectives: p.objectives || p.solution,
        members,
        leader,
      };
    }));
    res.status(200).json({ success: true, data: enriched });
  } catch (e) { next(e); }
}
async function handleGetMyNotifications(req, res, next) {
  try {
    const data = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (e) { next(e); }
}
async function handleSendEmail(req, res, next) {
  try {
    const { projectId, subject, content } = req.body;
    if (!projectId) throw createError('Thiếu projectId.', 400, 'MISSING_PROJECT_ID');
    const members = await ProjectMember.find({ projectId, status: 'ACCEPTED' }).populate('userId', 'email').lean();
    const list = [...new Set(members.map((m) => m.userId?.email).filter(Boolean))];
    if (list.length === 0) throw createError('Chưa có sinh viên accepted trong dự án.', 400, 'NO_RECIPIENTS');
    await mailerService.sendMail({ to: list.join(','), subject, text: content, html: content });
    await EmailLog.create({ mentorId: req.user._id, recipients: list, subject, content, projectId });
    res.status(200).json({ success: true, data: { success: true, sentTo: list.length, recipients: list } });
  } catch (e) { next(e); }
}
async function handleRequestCancelAssignment(req, res, next) {
  try {
    const { projectId, reason } = req.body;
    const doc = await AssignmentCancellationRequest.create({ mentorId: req.user._id, projectId, reason });
    res.status(201).json({ success: true, data: doc });
  } catch (e) { next(e); }
}
async function handleGetHonorHistory(req, res, next) {
  try {
    const data = await HonorHistory.find({ mentorId: req.user._id }).sort({ date: -1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (e) { next(e); }
}

module.exports = {
  handleGetMentors,
  handleGetMentorById,
  handleAssignMentor,
  handleReassignMentor,
  handleGetProjectAssignmentHistory,
  handleGetAuditHistory,
  handleGetMyMentorProfile,
  handleGetMyAssignedProjects,
  handleGetMyNotifications,
  handleSendEmail,
  handleRequestCancelAssignment,
  handleGetHonorHistory,
  handleUpdateMyMentorProfile,
};

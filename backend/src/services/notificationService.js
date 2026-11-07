const { randomUUID } = require('node:crypto');
const { normalizeNotification, recipientFilter, unreadFilter } = require('../utils/notificationCompatibility');
const Notification = require('../models/Notification');
const ProjectMember = require('../models/ProjectMember');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const {
  MEMBER_CHANGE_REQUEST_TYPE,
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_STATUS,
  USER_ROLES,
  USER_STATUS,
} = require('../utils/constants');

const EVENT_NAMES = Object.freeze({
  INVITATION_CREATED: 'invitation-created',
  INVITATION_RESPONDED: 'invitation-responded',
  PROJECT_SUBMITTED: 'project-submitted',
  MILESTONE_COMMENT_ADDED: 'milestone-comment-added',
  MEMBER_CHANGE_APPROVED: 'member-change-approved',
  PROJECT_CANCELLATION_APPROVED: 'project-cancellation-approved',
});

const getId = (value) => {
  const id = value?._id ?? value?.id ?? value;
  return id ? String(id) : '';
};

const getEventOccurrenceId = (document) => {
  const id = getId(document);
  // ProjectMember có thể được dùng lại cho lời mời mới sau khi lời mời cũ bị từ chối.
  const timestamp = document?.updatedAt ?? document?.createdAt;
  return timestamp ? `${id}:${new Date(timestamp).getTime()}` : id;
};

const safeString = (value, fallback = '') => String(value ?? fallback).trim();
const describeProject = (project) => {
  const title = safeString(project?.title, 'Đề tài');
  const code = safeString(project?.code);
  return code ? `“${title}” (${code})` : `“${title}”`;
};

/** Lưu thông báo theo khóa sự kiện để retry không tạo bản ghi trùng. */
const createForRecipients = async ({
  eventName,
  eventId,
  recipients,
  title,
  message,
  type,
  actionUrl,
  metadata,
}) => {
  const uniqueRecipients = [...new Set((recipients || []).map(getId).filter(Boolean))];
  if (!eventId || !uniqueRecipients.length) return;

  await Promise.all(
    uniqueRecipients.map(async (recipientId) => {
      const eventKey = `${eventName}:${getId(eventId)}:${recipientId}`;
      try {
        await createNotification({
          recipientId, title, message, type, actionUrl, metadata: metadata || {}, eventKey,
        });
      } catch (error) {
        console.error(`[Notification] Không tạo được ${eventName} cho ${recipientId}:`, error.message);
      }
    }),
  );
};

const safelyNotify = async (eventName, callback) => {
  try {
    await callback();
  } catch (error) {
    console.error(`[Notification] Không xử lý được sự kiện ${eventName}:`, error.message);
  }
};

/** Gửi thông báo tới sinh viên được mời sau khi lời mời đã được lưu. */
const notifyInvitationCreated = async ({ project, invitation, invitee }) =>
  safelyNotify(EVENT_NAMES.INVITATION_CREATED, () =>
    createForRecipients({
      eventName: EVENT_NAMES.INVITATION_CREATED,
      eventId: getEventOccurrenceId(invitation),
      recipients: [invitee?._id],
      title: 'Bạn nhận được lời mời tham gia đề tài',
      message: `Bạn được mời tham gia đề tài ${describeProject(project)}.`,
      type: 'invitation',
      actionUrl: '/student/projects',
      metadata: {
        projectId: getId(project),
        invitationId: getId(invitation),
        projectCode: project?.code ?? '',
      },
    }),
  );

/** Báo cho người gửi lời mời biết sinh viên đã chấp nhận hoặc từ chối. */
const notifyInvitationResponded = async ({ project, invitation }) =>
  safelyNotify(EVENT_NAMES.INVITATION_RESPONDED, () => {
    const accepted = invitation?.status === PROJECT_MEMBER_STATUS.ACCEPTED;
    return createForRecipients({
      eventName: EVENT_NAMES.INVITATION_RESPONDED,
      eventId: getEventOccurrenceId(invitation),
      recipients: [invitation?.invitedBy],
      title: accepted ? 'Lời mời tham gia đề tài đã được chấp nhận' : 'Lời mời tham gia đề tài đã bị từ chối',
      message:
        `Lời mời vào đề tài ${describeProject(project)} ` +
        `đã được ${accepted ? 'chấp nhận' : 'từ chối'}.`,
      type: 'invitation',
      actionUrl: `/student/projects/${getId(project)}`,
      metadata: { projectId: getId(project), invitationId: getId(invitation), response: invitation?.status },
    });
  });

/** Báo cho các Admin có vai trò hiện hành biết đề tài đã được nộp. */
const notifyProjectSubmitted = async ({ project, revision }) =>
  safelyNotify(EVENT_NAMES.PROJECT_SUBMITTED, async () => {
    const admins = await User.find({ role: USER_ROLES.ADMIN, status: USER_STATUS.ACTIVE })
      .select('_id')
      .lean();
    await createForRecipients({
      eventName: EVENT_NAMES.PROJECT_SUBMITTED,
      eventId: revision?._id,
      recipients: admins.map((admin) => admin._id),
      title: 'Có đề tài mới được nộp',
      message: `Đề tài ${describeProject(project)} đã được nộp để xét duyệt.`,
      type: 'project',
      actionUrl: '/admin',
      metadata: { projectId: getId(project), revisionId: getId(revision), projectCode: project?.code ?? '' },
    });
  });

/** Thông báo cho các thành viên đã chấp nhận khi Mentor thêm nhận xét milestone. */
const notifyMilestoneCommentAdded = async ({ project, milestone, comment }) =>
  safelyNotify(EVENT_NAMES.MILESTONE_COMMENT_ADDED, async () => {
    const memberIds = await ProjectMember.distinct('userId', {
      projectId: project?._id,
      status: PROJECT_MEMBER_STATUS.ACCEPTED,
      role: { $in: [PROJECT_MEMBER_ROLES.OWNER, PROJECT_MEMBER_ROLES.MEMBER] },
    });

    await createForRecipients({
      eventName: EVENT_NAMES.MILESTONE_COMMENT_ADDED,
      eventId: comment?._id,
      recipients: memberIds,
      title: 'Mentor đã nhận xét milestone',
      message:
        `Mentor đã thêm nhận xét cho milestone “${safeString(milestone?.title, 'Milestone')}” ` +
        `của đề tài ${describeProject(project)}.`,
      type: 'feedback',
      actionUrl: `/student/projects/${getId(project)}`,
      metadata: {
        projectId: getId(project),
        milestoneId: getId(milestone),
        commentId: getId(comment),
      },
    });
  });

/** Báo cho người gửi yêu cầu và người bị tác động khi Admin duyệt thay đổi thành viên. */
const notifyMemberChangeApproved = async ({ project, changeRequest }) =>
  safelyNotify(EVENT_NAMES.MEMBER_CHANGE_APPROVED, () => {
    const action = changeRequest?.type === MEMBER_CHANGE_REQUEST_TYPE.ADD ? 'thêm' : 'xóa';
    const projectTitle = safeString(project?.title, 'Đề tài');
    return createForRecipients({
      eventName: EVENT_NAMES.MEMBER_CHANGE_APPROVED,
      eventId: changeRequest?._id,
      recipients: [changeRequest?.requesterId, changeRequest?.targetUserId],
      title: 'Yêu cầu thay đổi thành viên đã được duyệt',
      message: `Yêu cầu ${action} thành viên trong đề tài “${projectTitle}” đã được duyệt.`,
      type: 'review',
      actionUrl: `/student/projects/${getId(project)}`,
      metadata: {
        projectId: getId(project),
        requestId: getId(changeRequest),
        requestType: changeRequest?.type,
      },
    });
  });

/** Báo cho người yêu cầu và thành viên hiện tại khi Admin duyệt hủy đề tài. */
const notifyProjectCancellationApproved = async ({ project, request }) =>
  safelyNotify(EVENT_NAMES.PROJECT_CANCELLATION_APPROVED, async () => {
    const memberIds = await ProjectMember.distinct('userId', {
      projectId: project?._id,
      status: PROJECT_MEMBER_STATUS.ACCEPTED,
    });

    await createForRecipients({
      eventName: EVENT_NAMES.PROJECT_CANCELLATION_APPROVED,
      eventId: request?._id,
      recipients: [request?.requestedBy, ...memberIds],
      title: 'Yêu cầu hủy đề tài đã được duyệt',
      message: `Yêu cầu hủy đề tài ${describeProject(project)} đã được Admin duyệt.`,
      type: 'cancellation',
      actionUrl: `/student/projects/${getId(project)}`,
      metadata: { projectId: getId(project), requestId: getId(request), projectCode: project?.code ?? '' },
    });
  });

/** Tạo qua một đường upsert; retry cùng eventKey không tạo thêm thông báo, kể cả đã đọc. */
const createNotification = async (payload) => {
  const normalized = normalizeNotification(payload);
  const eventKey = payload.eventKey || `manual:${randomUUID()}:${getId(normalized.recipientId)}`;
  const data = { ...normalized, eventKey };
  try {
    const notification = await Notification.findOneAndUpdate(
      { eventKey }, { $setOnInsert: data },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return normalizeNotification(notification);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await Notification.findOne({ eventKey }).lean();
    if (!existing) throw error;
    return normalizeNotification(existing);
  }
};

/** Giữ thông báo phân công legacy khi retry sau merge, kể cả bản ghi đó đã đọc. */
const createJudgeNotification = async (payload, { isResend = false } = {}) => {
  if (!isResend) {
    const existing = await Notification.findOne({
      $and: [
        recipientFilter(payload.recipientId),
        { relatedEvaluationId: payload.relatedEvaluationId },
        { $or: [{ eventKey: payload.eventKey }, { eventKey: null }, { eventKey: /^legacy:/ }] },
      ],
    }).lean();
    if (existing) return normalizeNotification(existing);
  }
  return createNotification(payload);
};

/** Merge: lọc chủ sở hữu theo recipientId, fallback userId chỉ khi trường chuẩn chưa tồn tại. */
const getNotifications = async ({ userId, status, unreadOnly, page = 1, limit = 20 }) => {
  const effectiveStatus = status ?? (unreadOnly === true || unreadOnly === 'true' ? 'unread' : 'all');
  const owner = recipientFilter(userId);
  const filter = effectiveStatus === 'unread' ? { $and: [owner, unreadFilter()] } : owner;
  const [notifications, totalItems, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ $and: [owner, unreadFilter()] }),
  ]);
  return {
    notifications: notifications.map(normalizeNotification), unreadCount,
    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  };
};

/** Endpoint mentor cũ vẫn trả toàn bộ danh sách; dùng cùng ownership và serializer với chuông. */
const getMentorNotifications = async ({ userId }) => {
  const notifications = await Notification.find(recipientFilter(userId))
    .sort({ createdAt: -1, _id: -1 }).lean();
  return notifications.map(normalizeNotification);
};

/** Đọc một thông báo không phụ thuộc hook boolean; không cho sửa thông báo của người khác. */
const markNotificationRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findOneAndUpdate(
    { $and: [{ _id: notificationId }, recipientFilter(userId)] },
    { $set: { isRead: true, read: true } }, { new: true },
  ).lean();
  if (!notification) throw ApiError.notFound('Không tìm thấy thông báo', 'NOTIFICATION_NOT_FOUND');
  const unreadCount = await Notification.countDocuments({ $and: [recipientFilter(userId), unreadFilter()] });
  return { notification: normalizeNotification(notification), unreadCount };
};

/** Đồng bộ cả bản ghi đã đọc nhưng còn lệch read/isRead; chỉ thao tác trong phạm vi người nhận. */
const markAllNotificationsRead = async ({ userId }) => {
  const result = await Notification.updateMany(
    { $and: [recipientFilter(userId), { $or: [{ isRead: { $ne: true } }, { read: { $ne: true } }] }] },
    { $set: { isRead: true, read: true } },
  );
  const unreadCount = await Notification.countDocuments({ $and: [recipientFilter(userId), unreadFilter()] });
  return { modifiedCount: result.modifiedCount, unreadCount };
};

module.exports = {
  notifyInvitationCreated, notifyInvitationResponded, notifyProjectSubmitted,
  notifyMilestoneCommentAdded, notifyMemberChangeApproved, notifyProjectCancellationApproved,
  createNotification, createJudgeNotification, getNotifications, getMentorNotifications, markNotificationRead,
  markAllNotificationsRead,
};

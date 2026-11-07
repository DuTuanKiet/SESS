/** Merge: chuẩn hóa hai hợp đồng nhưng không để userId cũ ghi đè chủ sở hữu recipientId. */
const text = (value) => typeof value === 'string' ? value.trim() : '';
const normalizeNotification = (value) => {
  const source = typeof value?.toObject === 'function' ? value.toObject() : value;
  const recipientId = source.recipientId || source.userId;
  const message = text(source.message) || text(source.content);
  const actionUrl = text(source.actionUrl) || text(source.link);
  const isRead = source.isRead === true || source.read === true;
  return {
    ...source, recipientId, userId: recipientId, message, content: message,
    actionUrl, link: actionUrl, isRead, read: isRead,
  };
};

const recipientFilter = (userId) => ({
  $or: [{ recipientId: userId }, { recipientId: null, userId }],
});
const unreadFilter = () => ({ isRead: { $ne: true }, read: { $ne: true } });

module.exports = { normalizeNotification, recipientFilter, unreadFilter };

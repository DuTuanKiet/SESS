const { normalizeNotification } = require('../utils/notificationCompatibility');
const fields = ['recipientId', 'userId', 'message', 'content', 'actionUrl', 'link', 'isRead', 'read', 'eventKey'];
const missing = (value) => value == null || (typeof value === 'string' && value.trim() === '');

/** Lập thay đổi thuần: giữ ID, metadata, liên kết nghiệp vụ và timestamps; không xóa bản ghi lỗi. */
function planNotificationBackfill(document) {
  const normalized = normalizeNotification(document);
  const issues = [];
  const id = String(document._id || '');
  if (!id) issues.push('MISSING_ID');
  if (!/^[a-fA-F0-9]{24}$/.test(String(normalized.recipientId || ''))) issues.push('INVALID_RECIPIENT');
  if (document.recipientId && document.userId && String(document.recipientId) !== String(document.userId)) {
    issues.push('RECIPIENT_CONFLICT');
  }
  if (typeof document.title !== 'string' || !document.title.trim() || document.title.length > 200) issues.push('INVALID_TITLE');
  if (!normalized.message || normalized.message.length > 1000) issues.push('INVALID_MESSAGE');
  for (const field of ['isRead', 'read']) {
    if (document[field] != null && typeof document[field] !== 'boolean') issues.push(`INVALID_${field}`);
  }
  const eventKey = missing(document.eventKey) ? `legacy:${id}` : document.eventKey;
  if (typeof eventKey !== 'string' || eventKey.length > 255) issues.push('INVALID_EVENT_KEY');
  const changes = {};
  for (const field of ['recipientId', 'userId', 'message', 'content', 'actionUrl', 'link']) {
    if (missing(document[field]) && !missing(normalized[field])) changes[field] = normalized[field];
  }
  // Không biến thông báo đã đọc thành chưa đọc nếu hai nhánh đang lưu trạng thái khác nhau.
  for (const field of ['isRead', 'read']) {
    if (document[field] !== normalized.isRead) changes[field] = normalized.isRead;
  }
  if (missing(document.eventKey)) changes.eventKey = eventKey;
  return { id, eventKey, issues, changes };
}

/** Mặc định dry-run. Collection do caller cung cấp; module không nạp config hoặc tự kết nối DB. */
async function migrateNotifications({ collection, dryRun = true, createIndex = false }) {
  const report = { dryRun, scanned: 0, pending: 0, modified: 0, issues: [], conflicts: [], indexCreated: false };
  const plans = [];
  const keys = new Map();
  const projection = Object.fromEntries(['_id', 'title', ...fields].map((field) => [field, 1]));
  for await (const document of collection.find({}, { projection })) {
    report.scanned += 1;
    const plan = planNotificationBackfill(document);
    if (keys.has(plan.eventKey)) report.issues.push({ id: plan.id, code: 'DUPLICATE_EVENT_KEY', otherId: keys.get(plan.eventKey) });
    else keys.set(plan.eventKey, plan.id);
    for (const code of plan.issues) report.issues.push({ id: plan.id, code });
    if (Object.keys(plan.changes).length) { report.pending += 1; plans.push({ document, ...plan }); }
  }
  // Kiểm tra toàn bộ dữ liệu trước lần ghi đầu tiên; dry-run tuyệt đối không ghi hay tạo index.
  if (dryRun || report.issues.length) return report;
  for (const plan of plans) {
    const conditions = fields.map((field) => Object.hasOwn(plan.document, field)
      ? { [field]: { $eq: plan.document[field], $exists: true } } : { [field]: { $exists: false } });
    const result = await collection.updateOne(
      { _id: plan.document._id, $and: conditions }, { $set: plan.changes },
    );
    if (!result.matchedCount) report.conflicts.push(plan.id);
    report.modified += result.modifiedCount;
  }
  if (createIndex && !report.conflicts.length) {
    // Quét lại sau backfill trước khi áp unique; không syncIndexes hoặc xóa index có sẵn.
    const verification = await migrateNotifications({ collection });
    report.issues.push(...verification.issues);
    if (verification.pending > 0) report.issues.push({ code: 'PENDING_BACKFILL' });
    if (!verification.issues.length && verification.pending === 0) {
      try {
        await collection.createIndex({ eventKey: 1 }, { unique: true });
        report.indexCreated = true;
      } catch (error) {
        // Giữ báo cáo số bản ghi đã sửa nếu index có sẵn xung đột; không tự drop/rebuild index.
        report.issues.push({ code: 'INDEX_CREATION_FAILED', errorCode: error.code || null });
      }
    }
  }
  return report;
}
module.exports = { planNotificationBackfill, migrateNotifications };

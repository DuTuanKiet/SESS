const AuditLog = require('../models/AuditLog');

/**
 * Ghi nhật ký thao tác trọng yếu (FR14) - Enterprise Immutable Audit Log.
 * Đây là MỘT ĐIỂM GHI NHẬT KÝ DUY NHẤT cho toàn hệ thống, hợp nhất 2 nhánh:
 * - FR01-FR04: qua `logAuditAction({ actor, action, targetEntity, targetId, oldValues, newValues, req })`
 * - FR05-FR08: qua `logAuditAction({ actor, action, targetEntity, targetId, oldValues, newValues, session })`
 *
 * Đây là hoạt động phụ trợ nên TUYỆT ĐỐI không được làm hỏng luồng nghiệp vụ:
 * mọi lỗi ghi log chỉ được in ra console.
 *
 * @param {object} params
 * @param {object|string} params.actor         User document (hoặc id) thực hiện hành động
 * @param {string} params.action               Mã hành động, VD: CHANGE_PROJECT_STATUS
 * @param {string} params.targetEntity         PROJECT | PROJECT_MEMBER | USER | MENTOR | EVALUATION_RUBRICS | ...
 * @param {object|string} params.targetId      Id của thực thể bị tác động
 * @param {object} [params.oldValues]          Giá trị trước khi thay đổi
 * @param {object} [params.newValues]          Giá trị sau khi thay đổi
 * @param {object} [params.req]                Express request (lấy IP)
 * @param {string} [params.ipAddress]          IP trực tiếp (không cần req)
 * @param {object} [params.session]            Mongoose session (dùng trong transaction)
 */
const logAuditAction = async ({
  actor,
  action,
  targetEntity,
  targetId,
  oldValues,
  newValues,
  req,
  ipAddress,
  session,
} = {}) => {
  try {
    const createOptions = session ? { session } : {};

    const actorId = actor?._id ?? actor ?? null;
    const actorEmail = actor?.email ?? '';

    // Dùng dạng mảng + options: đây là cách Mongoose nhận saveOptions (session).
    // Nếu gọi create(doc, options) với doc đơn, Mongoose sẽ BỎ QUA toàn bộ field trong doc.
    const [created] = await AuditLog.create(
      [
        {
          actorId,
          actorEmail,
          userId: actorId, // đồng bộ alias FR05-FR08
          action,
          targetEntity,
          targetId: targetId ?? null,
          oldValues: oldValues ?? null,
          newValues: newValues ?? null,
          ipAddress: ipAddress ?? (req?.ip ?? ''),
          timestamp: new Date(),
        },
      ],
      createOptions,
    );

    return created;
  } catch (error) {
    console.error(`[Audit] Không ghi được nhật ký ${action} cho ${targetEntity}: ${error.message}`);
  }
};

/**
 * Ghi nhiều Audit Log cùng lúc (dùng cho tác vụ hàng loạt).
 * Được đẩy vào BullMQ để tránh ghi N lần riêng lẻ gây Write Lock trên MongoDB.
 * Khi không có Redis -> chạy inline bằng insertMany (1 lần ghi).
 *
 * @param {object[]} entries Danh sách entry cùng cấu trúc với logAuditAction
 */
const logAuditActions = async (entries = []) => {
  if (!Array.isArray(entries) || !entries.length) return { queued: false, skipped: true };

  try {
    const queueService = require('../services/queueService');
    return await queueService.enqueueAuditBatch(entries);
  } catch (error) {
    console.error(`[Audit] Không ghi được nhật ký hàng loạt: ${error.message}`);
    return { queued: false, error: error.message };
  }
};

module.exports = { logAuditAction, logAuditActions };

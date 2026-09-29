const AuditLog = require('../models/AuditLog');

/**
 * Ghi nhật ký thao tác trọng yếu (FR14).
 *
 * Đây là hoạt động phụ trợ nên TUYỆT ĐỐI không được làm hỏng luồng nghiệp vụ:
 * mọi lỗi ghi log chỉ được in ra console.
 *
 * @param {object} params
 * @param {object|string} params.actor   User document (hoặc id) thực hiện hành động
 * @param {string} params.action         Mã hành động, VD: CHANGE_PROJECT_STATUS
 * @param {string} params.targetEntity   PROJECT | PROJECT_MEMBER | USER | MENTOR
 * @param {object|string} params.targetId Id của thực thể bị tác động
 * @param {object} [params.oldValues]    Giá trị trước khi thay đổi
 * @param {object} [params.newValues]    Giá trị sau khi thay đổi
 * @param {object} [params.req]          Express request (lấy IP)
 */
const logAuditAction = async ({ actor, action, targetEntity, targetId, oldValues, newValues, req } = {}) => {
  try {
    await AuditLog.create({
      actorId: actor?._id ?? actor ?? null,
      actorEmail: actor?.email ?? '',
      action,
      targetEntity,
      targetId: targetId ?? null,
      oldValues: oldValues ?? null,
      newValues: newValues ?? null,
      ipAddress: req?.ip ?? '',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`[Audit] Không ghi được nhật ký ${action} cho ${targetEntity}: ${error.message}`);
  }
};

module.exports = { logAuditAction };

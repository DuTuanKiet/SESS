const { logAuditAction } = require('../utils/audit');

/**
 * Ghi vết thao tác quản trị con người vào AuditLogs (FR05-FR08).
 * Delegates sang utils/audit.js (nguồn duy nhất) để đảm bảo IP + actorId luôn được ghi.
 * Hỗ trợ Mongoose session cho transaction.
 *
 * @param {object} params
 * @param {string|object} params.userId        ID hoặc document người thực hiện
 * @param {string} params.action               Mã hành động
 * @param {string} params.targetEntity         Thực thể bị tác động
 * @param {string|object} params.targetId      ID thực thể
 * @param {object} [params.oldValues]
 * @param {object} [params.newValues]
 * @param {object} [params.session]            Mongoose session (transaction)
 * @param {object} [params.req]                Express request (lấy IP)
 */
async function createAuditLog({
  userId,
  action,
  targetEntity,
  targetId,
  oldValues = null,
  newValues = null,
  session = null,
  req,
}) {
  return logAuditAction({
    actor: userId,
    action,
    targetEntity,
    targetId,
    oldValues,
    newValues,
    session,
    req,
  });
}

module.exports = { createAuditLog };

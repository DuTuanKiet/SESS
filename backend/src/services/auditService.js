const AuditLog = require('../models/AuditLog');
//Ghi vết thao tác quản trị con người vào AuditLogs
async function createAuditLog({ userId, action, targetEntity, targetId, oldValues = null, newValues = null, session = null }) {
  const options = session ? { session } : {};

  const [log] = await AuditLog.create(
    [
      {
        userId,
        action,
        targetEntity,
        targetId,
        oldValues,
        newValues,
      },
    ],
    options
  );

  return log;
}

module.exports = { createAuditLog };

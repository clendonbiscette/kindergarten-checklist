import prisma from './prisma.js';

/**
 * Create an audit log entry
 * @param {Object} params - Audit parameters
 * @param {string} params.tableName - The table/model being audited
 * @param {string} params.recordId - The ID of the record
 * @param {string} params.action - CREATE, UPDATE, DELETE, or RESTORE
 * @param {Object} params.oldValues - Previous values (for UPDATE/DELETE)
 * @param {Object} params.newValues - New values (for CREATE/UPDATE)
 * @param {string} params.userId - The user performing the action
 * @param {Object} params.req - Express request object (optional, for IP and user agent)
 */
export const createAuditLog = async ({
  tableName,
  recordId,
  action,
  oldValues = null,
  newValues = null,
  userId,
  req = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        oldValues,
        newValues,
        userId,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get?.('User-Agent') || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Get audit history for a specific record
 * @param {string} tableName - The table/model name
 * @param {string} recordId - The record ID
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getRecordAuditHistory = async (tableName, recordId) => {
  return prisma.auditLog.findMany({
    where: {
      tableName,
      recordId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * Get audit history for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of audit log entries
 */
export const getUserAuditHistory = async (userId, options = {}) => {
  const { limit = 50, offset = 0, tableName = null } = options;

  return prisma.auditLog.findMany({
    where: {
      userId,
      ...(tableName && { tableName }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
};

/**
 * Helper to perform soft delete with audit
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @param {string} userId - User performing the delete
 * @param {Object} req - Express request object (optional)
 */
export const softDeleteWithAudit = async (model, id, userId, req = null) => {
  const modelLower = model.toLowerCase();

  // Get current record
  const oldRecord = await prisma[modelLower].findUnique({
    where: { id },
  });

  if (!oldRecord) {
    throw new Error(`${model} not found`);
  }

  // Perform soft delete
  const updated = await prisma[modelLower].update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  // Create audit log
  await createAuditLog({
    tableName: model,
    recordId: id,
    action: 'DELETE',
    oldValues: oldRecord,
    newValues: { deletedAt: updated.deletedAt },
    userId,
    req,
  });

  return updated;
};

/**
 * Helper to restore a soft-deleted record with audit
 * @param {string} model - Prisma model name
 * @param {string} id - Record ID
 * @param {string} userId - User performing the restore
 * @param {Object} req - Express request object (optional)
 */
export const restoreWithAudit = async (model, id, userId, req = null) => {
  const modelLower = model.toLowerCase();

  // Get current record
  const oldRecord = await prisma[modelLower].findUnique({
    where: { id },
  });

  if (!oldRecord) {
    throw new Error(`${model} not found`);
  }

  // Restore record
  const updated = await prisma[modelLower].update({
    where: { id },
    data: {
      deletedAt: null,
    },
  });

  // Create audit log
  await createAuditLog({
    tableName: model,
    recordId: id,
    action: 'RESTORE',
    oldValues: { deletedAt: oldRecord.deletedAt },
    newValues: { deletedAt: null },
    userId,
    req,
  });

  return updated;
};

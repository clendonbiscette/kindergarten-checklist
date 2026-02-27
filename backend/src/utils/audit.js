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

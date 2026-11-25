import AdminAuditLog from '../models/AdminAuditLog.js';
import mongoose from 'mongoose';

export const recordAdminAudit = async (req, action, targetType = '', statusCode = 200) => {
  if (!req.user?._id) {
    throw new Error('Cannot record admin action without an authenticated actor');
  }
  const rawTargetId = req.params?.id || req.body?.targetId || null;

  return AdminAuditLog.create({
    actor: req.user._id,
    action,
    targetType,
    targetId: rawTargetId && mongoose.isValidObjectId(rawTargetId) ? rawTargetId : null,
    targetLabel: String(req.params?.key || req.body?.targetLabel || req.body?.title || '').trim().slice(0, 200),
    reason: String(req.body?.reason || req.body?.resolutionNote || req.body?.adminFeedback || '').trim().slice(0, 500),
    statusCode: Number(statusCode),
    ipAddress: String(req.ip || '').slice(0, 100)
  });
};

export const auditAdminMutation = (action, targetType = '') => (req, res, next) => {
  res.once('finish', () => {
    recordAdminAudit(req, action, targetType, res.statusCode).catch((error) => {
      console.error('[ADMIN AUDIT ERROR]:', error.message);
    });
  });
  next();
};

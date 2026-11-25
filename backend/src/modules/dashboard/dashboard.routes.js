import express from 'express';
import {
  getUserDashboardStats,
  getAdminDashboardStats,
  getLeaderboard,
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  getAdminGroups,
  deleteAdminGroup,
  getAdminPosts,
  deleteAdminPost,
  broadcastGlobalNotification,
  getAdminAuditLogs,
  getAdminHealth,
  getAdminFeatureFlags,
  updateAdminFeatureFlag,
  updateAdminUserAccess,
  suspendAdminUser,
  restoreAdminUser
} from './dashboard.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { requireAdminPermission } from '../../middlewares/adminPermissions.js';
import { auditAdminMutation } from '../../services/adminAuditService.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  leaderboardQuerySchema,
  adminPaginationQuerySchema,
  updateAdminUserRoleSchema,
  adminDeleteIdParamSchema,
  broadcastNotificationSchema,
  updateAdminUserAccessSchema,
  suspendAdminUserSchema,
  restoreAdminUserSchema,
  adminAuditQuerySchema,
  updateFeatureFlagSchema
} from './dashboard.schema.js';

const router = express.Router();

// User stats
router.get('/user', protect, getUserDashboardStats);
router.get('/leaderboard', protect, validateRequest(leaderboardQuerySchema), getLeaderboard);

// Admin-specific stats and management
router.get('/admin', protect, adminOnly, requireAdminPermission('dashboard.read'), getAdminDashboardStats);
router.get('/admin/users', protect, adminOnly, requireAdminPermission('users.read'), validateRequest(adminPaginationQuerySchema), getAdminUsers);
router.put('/admin/users/:id/role', protect, adminOnly, requireAdminPermission('permissions.manage'), auditAdminMutation('update_user_role', 'user'), validateRequest(updateAdminUserRoleSchema), updateAdminUserRole);
router.put('/admin/users/:id/access', protect, adminOnly, requireAdminPermission('permissions.manage'), auditAdminMutation('update_admin_access', 'user'), validateRequest(updateAdminUserAccessSchema), updateAdminUserAccess);
router.post('/admin/users/:id/suspend', protect, adminOnly, requireAdminPermission('users.manage'), auditAdminMutation('suspend_user', 'user'), validateRequest(suspendAdminUserSchema), suspendAdminUser);
router.put('/admin/users/:id/restore', protect, adminOnly, requireAdminPermission('users.manage'), auditAdminMutation('restore_user', 'user'), validateRequest(restoreAdminUserSchema), restoreAdminUser);
router.delete('/admin/users/:id', protect, adminOnly, requireAdminPermission('users.manage'), auditAdminMutation('delete_user', 'user'), validateRequest(adminDeleteIdParamSchema), deleteAdminUser);

router.get('/admin/groups', protect, adminOnly, requireAdminPermission('content.read'), validateRequest(adminPaginationQuerySchema), getAdminGroups);
router.delete('/admin/groups/:id', protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('delete_group', 'group'), validateRequest(adminDeleteIdParamSchema), deleteAdminGroup);

router.get('/admin/posts', protect, adminOnly, requireAdminPermission('content.read'), validateRequest(adminPaginationQuerySchema), getAdminPosts);
router.delete('/admin/posts/:id', protect, adminOnly, requireAdminPermission('content.manage'), auditAdminMutation('delete_post', 'post'), validateRequest(adminDeleteIdParamSchema), deleteAdminPost);

router.get('/admin/audit', protect, adminOnly, requireAdminPermission('audit.read'), validateRequest(adminAuditQuerySchema), getAdminAuditLogs);
router.get('/admin/health', protect, adminOnly, requireAdminPermission('health.read'), getAdminHealth);
router.get('/admin/feature-flags', protect, adminOnly, requireAdminPermission('feature_flags.manage'), getAdminFeatureFlags);
router.put('/admin/feature-flags/:key', protect, adminOnly, requireAdminPermission('feature_flags.manage'), auditAdminMutation('update_feature_flag', 'feature_flag'), validateRequest(updateFeatureFlagSchema), updateAdminFeatureFlag);
router.post('/admin/broadcast', protect, adminOnly, requireAdminPermission('system.manage'), auditAdminMutation('broadcast_notification'), validateRequest(broadcastNotificationSchema), broadcastGlobalNotification);

export default router;

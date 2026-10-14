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
  broadcastGlobalNotification
} from './dashboard.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import {
  leaderboardQuerySchema,
  adminPaginationQuerySchema,
  updateAdminUserRoleSchema,
  adminDeleteIdParamSchema,
  broadcastNotificationSchema
} from './dashboard.schema.js';

const router = express.Router();

// User stats
router.get('/user', protect, getUserDashboardStats);
router.get('/leaderboard', protect, validateRequest(leaderboardQuerySchema), getLeaderboard);

// Admin-specific stats and management
router.get('/admin', protect, adminOnly, getAdminDashboardStats);
router.get('/admin/users', protect, adminOnly, validateRequest(adminPaginationQuerySchema), getAdminUsers);
router.put('/admin/users/:id/role', protect, adminOnly, validateRequest(updateAdminUserRoleSchema), updateAdminUserRole);
router.delete('/admin/users/:id', protect, adminOnly, validateRequest(adminDeleteIdParamSchema), deleteAdminUser);

router.get('/admin/groups', protect, adminOnly, validateRequest(adminPaginationQuerySchema), getAdminGroups);
router.delete('/admin/groups/:id', protect, adminOnly, validateRequest(adminDeleteIdParamSchema), deleteAdminGroup);

router.get('/admin/posts', protect, adminOnly, validateRequest(adminPaginationQuerySchema), getAdminPosts);
router.delete('/admin/posts/:id', protect, adminOnly, validateRequest(adminDeleteIdParamSchema), deleteAdminPost);

router.post('/admin/broadcast', protect, adminOnly, validateRequest(broadcastNotificationSchema), broadcastGlobalNotification);

export default router;

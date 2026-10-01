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
} from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User stats
router.get('/user', protect, getUserDashboardStats);
router.get('/leaderboard', protect, getLeaderboard);

// Admin-specific stats and management
router.get('/admin', protect, adminOnly, getAdminDashboardStats);
router.get('/admin/users', protect, adminOnly, getAdminUsers);
router.put('/admin/users/:id/role', protect, adminOnly, updateAdminUserRole);
router.delete('/admin/users/:id', protect, adminOnly, deleteAdminUser);

router.get('/admin/groups', protect, adminOnly, getAdminGroups);
router.delete('/admin/groups/:id', protect, adminOnly, deleteAdminGroup);

router.get('/admin/posts', protect, adminOnly, getAdminPosts);
router.delete('/admin/posts/:id', protect, adminOnly, deleteAdminPost);

router.post('/admin/broadcast', protect, adminOnly, broadcastGlobalNotification);

export default router;

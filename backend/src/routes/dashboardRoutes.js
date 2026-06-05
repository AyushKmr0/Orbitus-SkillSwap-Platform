import express from 'express';
import { getUserDashboardStats, getAdminDashboardStats, getLeaderboard } from '../controllers/dashboardController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/user', protect, getUserDashboardStats);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/admin', protect, adminOnly, getAdminDashboardStats);

export default router;

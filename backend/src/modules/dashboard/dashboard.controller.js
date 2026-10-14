import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import {
  dashboardService,
  BADGE_RULES,
  buildBadgeProgress
} from './dashboard.service.js';

export { BADGE_RULES, buildBadgeProgress };

export class DashboardController {
  constructor(service = dashboardService) {
    this.service = service;
  }

  getUserDashboardStats = asyncHandler(async (req, res) => {
    const { data, cached } = await this.service.getUserDashboardStats(req.user._id);
    return res.status(200).json(
      new ApiResponse(
        200,
        data,
        cached ? 'User dashboard metrics retrieved (cached)' : 'User dashboard metrics retrieved'
      )
    );
  });

  getAdminDashboardStats = asyncHandler(async (req, res) => {
    const { data, cached } = await this.service.getAdminDashboardStats();
    return res.status(200).json(
      new ApiResponse(
        200,
        data,
        cached ? 'Admin dashboard metrics retrieved (cached)' : 'Admin dashboard metrics retrieved'
      )
    );
  });

  getLeaderboard = asyncHandler(async (req, res) => {
    const rawTimeframe = String(req.query.timeframe || 'all-time').toLowerCase();
    const { data, cached } = await this.service.getLeaderboard(rawTimeframe);
    return res.status(200).json(
      new ApiResponse(
        200,
        data,
        cached ? 'Leaderboard data fetched successfully (cached)' : 'Leaderboard data fetched successfully'
      )
    );
  });

  getAdminUsers = asyncHandler(async (req, res) => {
    const result = await this.service.getAdminUsers(req.query);
    return res.status(200).json(
      new ApiResponse(200, result, 'Admin users retrieved')
    );
  });

  updateAdminUserRole = asyncHandler(async (req, res) => {
    const user = await this.service.updateAdminUserRole(req.params.id, req.body.role);
    return res.status(200).json(
      new ApiResponse(200, { user }, 'User role updated')
    );
  });

  deleteAdminUser = asyncHandler(async (req, res) => {
    await this.service.deleteAdminUser(req.user._id, req.params.id);
    return res.status(200).json(
      new ApiResponse(200, null, 'User deleted by admin')
    );
  });

  getAdminGroups = asyncHandler(async (req, res) => {
    const result = await this.service.getAdminGroups(req.query);
    return res.status(200).json(
      new ApiResponse(200, result, 'Admin groups list retrieved')
    );
  });

  deleteAdminGroup = asyncHandler(async (req, res) => {
    await this.service.deleteAdminGroup(req.params.id);
    return res.status(200).json(
      new ApiResponse(200, null, 'Group deleted by admin')
    );
  });

  getAdminPosts = asyncHandler(async (req, res) => {
    const result = await this.service.getAdminPosts(req.query);
    return res.status(200).json(
      new ApiResponse(200, result, 'Admin posts list retrieved')
    );
  });

  deleteAdminPost = asyncHandler(async (req, res) => {
    await this.service.deleteAdminPost(req.params.id);
    return res.status(200).json(
      new ApiResponse(200, null, 'Post deleted by admin')
    );
  });

  broadcastGlobalNotification = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const result = await this.service.broadcastGlobalNotification(title, content);
    return res.status(200).json(
      new ApiResponse(200, result, 'Broadcast notification dispatched successfully')
    );
  });
}

export const dashboardController = new DashboardController();
export const {
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
} = dashboardController;

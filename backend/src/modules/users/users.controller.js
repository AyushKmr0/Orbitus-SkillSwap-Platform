import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import { usersService } from './users.service.js';

export class UsersController {
  constructor(service = usersService) {
    this.service = service;
  }

  getUserProfile = asyncHandler(async (req, res) => {
    const user = await this.service.getUserProfile(req.user._id);
    return res.status(200).json(
      new ApiResponse(200, { user }, 'Profile retrieved')
    );
  });

  getPublicUserProfile = asyncHandler(async (req, res) => {
    const result = await this.service.getPublicUserProfile(req.user._id, req.params.id);
    return res.status(200).json(
      new ApiResponse(200, result, 'Public profile retrieved')
    );
  });

  searchUsers = asyncHandler(async (req, res) => {
    const users = await this.service.searchUsers(req.user._id, req.query.q);
    return res.status(200).json(
      new ApiResponse(200, { users }, req.query.q ? 'Users found' : 'Suggested users')
    );
  });

  getSuggestedUsers = asyncHandler(async (req, res) => {
    const result = await this.service.getSuggestedUsers(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      users: result.users,
      data: result,
      hasMore: result.hasMore,
      page: result.page,
      total: result.total
    });
  });

  toggleFollowUser = asyncHandler(async (req, res) => {
    const result = await this.service.toggleFollowUser(req.user._id, req.params.id);
    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        result.following ? 'User followed' : 'User unfollowed'
      )
    );
  });

  getFollowersList = asyncHandler(async (req, res) => {
    const list = await this.service.getFollowersList(req.params.id, req.user?._id);
    return res.status(200).json(
      new ApiResponse(200, { followers: list }, 'Followers list retrieved')
    );
  });

  getFollowingList = asyncHandler(async (req, res) => {
    const list = await this.service.getFollowingList(req.params.id, req.user?._id);
    return res.status(200).json(
      new ApiResponse(200, { following: list }, 'Following list retrieved')
    );
  });

  updateUserProfile = asyncHandler(async (req, res) => {
    const user = await this.service.updateUserProfile(req.user._id, req.body);
    return res.status(200).json(
      new ApiResponse(200, { user }, 'Profile updated successfully!')
    );
  });

  deleteAccount = asyncHandler(async (req, res) => {
    await this.service.deleteAccount(res, req.user._id, req.body.username);
    return res.status(200).json(
      new ApiResponse(200, null, 'Account deleted successfully')
    );
  });

  uploadProfileResume = asyncHandler(async (req, res) => {
    const result = await this.service.uploadProfileResume(req.user, req.file, req);
    return res.status(201).json(
      new ApiResponse(201, result, 'Resume uploaded successfully')
    );
  });

  viewUserResume = asyncHandler(async (req, res) => {
    return this.service.viewUserResume(req.params.id, req, res);
  });

  uploadMediaImage = asyncHandler(async (req, res) => {
    const finalUrl = await this.service.uploadMediaImage(req.file, req);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      url: finalUrl,
      data: { url: finalUrl },
      message: 'Image uploaded successfully'
    });
  });
}

export const usersController = new UsersController();
export const {
  getUserProfile,
  getPublicUserProfile,
  searchUsers,
  getSuggestedUsers,
  toggleFollowUser,
  getFollowersList,
  getFollowingList,
  updateUserProfile,
  deleteAccount,
  uploadProfileResume,
  viewUserResume,
  uploadMediaImage
} = usersController;

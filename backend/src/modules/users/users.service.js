import fs from 'fs';
import path from 'path';
import { AppError } from '../../shared/errors/app-error.js';
import { usersRepository } from './users.repository.js';
import {
  publicUserPayload,
  normalizeUsername,
  USERNAME_COOLDOWN_MS,
  refreshCookieOptions
} from '../auth/auth.service.js';
import { invalidateUserDashboard } from '../../services/cacheService.js';
import { activityService } from '../../services/activityService.js';
import { emitNotificationToUser } from '../../socket/socketHandler.js';
import {
  uploadOnCloudinary,
  uploadResumeToCloudinary,
  buildCloudinaryResumeMeta,
  getSignedCloudinaryResumeUrl
} from '../../infrastructure/storage/cloudinary.js';
import User from '../../models/User.js';

export const isAllowedResumeSource = (resumeUrl, req) => {
  try {
    const parsed = new URL(resumeUrl);
    const ownBackendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const ownHost = new URL(ownBackendUrl).host;

    return parsed.host === ownHost || parsed.host === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

export const getResumeContentType = (resumeUrl = '', upstreamType = '') => {
  const cleanUrl = resumeUrl.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'application/pdf';
  if (cleanUrl.endsWith('.doc')) return 'application/msword';
  if (cleanUrl.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (upstreamType && !upstreamType.includes('text/html')) return upstreamType;
  return 'application/octet-stream';
};

export const getLocalResumePath = (resumeUrl = '', req) => {
  try {
    const parsed = new URL(resumeUrl);
    const ownBackendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const ownHost = new URL(ownBackendUrl).host;
    if (parsed.host !== ownHost || !parsed.pathname.startsWith('/uploads/')) return null;

    const fileName = path.basename(parsed.pathname);
    const candidates = [
      path.join(process.cwd(), 'uploads', fileName),
      path.join(process.cwd(), 'backend', 'uploads', fileName)
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
  } catch {
    return null;
  }
};

export class UsersService {
  constructor(repo = usersRepository) {
    this.repo = repo;
  }

  async getUserProfile(userId) {
    const user = await this.repo.findUserByIdWithSkills(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return publicUserPayload(user, userId);
  }

  async getPublicUserProfile(viewerId, rawId) {
    let targetId = rawId;
    if (!rawId || rawId === 'me' || rawId === 'undefined' || rawId === 'null') {
      targetId = viewerId.toString();
    }

    const user = await this.repo.findUserByUsernameOrId(targetId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isFollowing = await this.repo.checkIsFollowing(viewerId, user._id);
    const hasLegacyFollow = (user.followers || []).some(
      (id) => id.toString() === viewerId.toString()
    );

    let stats = null;
    let badges = [];
    let badgeProgress = [];
    let activityMap = {};

    const { sessions, userPostCount, badges: bList, oneYearAgo } =
      await this.repo.findPublicProfileData(user._id);

    badges = bList;
    const completedSessions = sessions.filter((s) => s.status === 'Completed');

    const userTimezone = user.timezone || 'Asia/Kolkata';
    activityMap = await activityService.getActivityHeatmap(user._id, oneYearAgo, userTimezone);

    stats = {
      completedSessions: completedSessions.length,
      postsCount: userPostCount,
      points: user.points,
      sessionsCompleted: completedSessions.length
    };

    return {
      user: publicUserPayload(user, viewerId, {
        isFollowing: Boolean(isFollowing) || hasLegacyFollow
      }),
      stats,
      badges,
      badgeProgress,
      activityMap,
      timezone: userTimezone
    };
  }

  async searchUsers(currentUserId, queryStr = '') {
    const query = String(queryStr || '').trim();
    if (query.length < 1) {
      const suggested = await User.find({ _id: { $ne: currentUserId } })
        .select('-password -refreshToken -otp -dailyLoginTracker')
        .limit(10);
      return suggested.map((u) => publicUserPayload(u, currentUserId));
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 64);
    const users = await this.repo.searchUsers(
      {
        $or: [
          { name: { $regex: safeQuery, $options: 'i' } },
          { username: { $regex: safeQuery, $options: 'i' } }
        ]
      },
      currentUserId,
      20
    );

    return users.map((foundUser) => publicUserPayload(foundUser, currentUserId));
  }

  async getSuggestedUsers(currentUserId, queryParams = {}) {
    const limit = Math.min(Math.max(parseInt(queryParams.limit, 10) || 20, 1), 60);
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const skip = (page - 1) * limit;
    const excludeFollowing = queryParams.excludeFollowing === 'true';

    const currentUser = await this.repo.findUserById(currentUserId);
    const followingIds = (currentUser?.following || []).map((id) => id.toString());

    const filter = {
      _id: { $ne: currentUserId },
      isVerified: true
    };

    if (excludeFollowing && followingIds.length > 0) {
      filter._id = { $nin: [currentUserId, ...currentUser.following] };
    }

    const [users, total] = await this.repo.findSuggestedUsers(filter, { skip, limit });

    const shouldShuffle = queryParams.shuffle === 'true';
    let payload = users.map((user) =>
      publicUserPayload(user, currentUserId, {
        isFollowing: followingIds.includes(user._id.toString())
      })
    );

    if (shouldShuffle && payload.length > 1) {
      payload = [...payload].sort(() => Math.random() - 0.5);
    }

    const hasMore = skip + users.length < total;

    return {
      users: payload,
      page,
      limit,
      total,
      hasMore
    };
  }

  async toggleFollowUser(currentUserId, targetUserId) {
    if (targetUserId === currentUserId.toString()) {
      throw new AppError('You cannot follow yourself', 400);
    }

    const [targetUser, currentUser] = await Promise.all([
      this.repo.findUserById(targetUserId),
      this.repo.findUserById(currentUserId)
    ]);

    if (!targetUser || !currentUser) {
      throw new AppError('User not found', 404);
    }

    const alreadyFollowing = await this.repo.checkIsFollowing(currentUser._id, targetUser._id);

    if (alreadyFollowing) {
      await this.repo.unfollowUser(currentUser._id, targetUser._id);
    } else {
      await this.repo.followUser(currentUser._id, targetUser._id);

      const notification = await this.repo.createNotification({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'Follow',
        content: `${currentUser.name} started following you.`,
        link: `/profile/${currentUser.username || currentUser._id}`
      });

      const populatedNotification = await this.repo.findNotificationById(notification._id);
      emitNotificationToUser(targetUser._id, populatedNotification);
    }

    await Promise.all([
      this.repo.updateUserFollowCounts(targetUser._id),
      this.repo.updateUserFollowCounts(currentUser._id)
    ]);

    const populatedTarget = await this.repo.findUserByIdWithSkills(targetUser._id);

    await Promise.all([
      invalidateUserDashboard(currentUser._id),
      invalidateUserDashboard(targetUser._id)
    ]);

    return {
      following: !alreadyFollowing,
      user: publicUserPayload(populatedTarget, currentUser._id, { isFollowing: !alreadyFollowing })
    };
  }

  async getFollowersList(userId, currentUserId) {
    const user = await this.repo.findFollowers(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const list = (user.followers || []).map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      profileImage: u.profileImage,
      experienceLevel: u.experienceLevel,
      isFollowing: currentUserId ? (u.followers || []).some((f) => f.toString() === currentUserId) : false
    }));

    return list;
  }

  async getFollowingList(userId, currentUserId) {
    const user = await this.repo.findFollowing(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const list = (user.following || []).map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      profileImage: u.profileImage,
      experienceLevel: u.experienceLevel,
      isFollowing: currentUserId ? (u.followers || []).some((f) => f.toString() === currentUserId) : false
    }));

    return list;
  }

  async updateUserProfile(userId, data) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const {
      bio,
      experienceLevel,
      education,
      interests,
      socialLinks,
      skillsTeach,
      skillsLearn,
      name,
      username,
      profileImage,
      coverImage,
      customAiProvider,
      projects,
      resumeFile
    } = data;

    if (name) user.name = name;
    if (username !== undefined) {
      const normalizedUsername = normalizeUsername(username);
      if (normalizedUsername.length < 3) {
        throw new AppError('Username must be at least 3 characters', 400);
      }
      const usernameChanged = normalizedUsername !== user.username;
      if (usernameChanged && user.usernameUpdatedAt) {
        const availableAt = new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS);
        if (availableAt > new Date()) {
          throw new AppError(
            `Username can be changed after ${availableAt.toLocaleDateString('en-IN')}`,
            429
          );
        }
      }
      const usernameOwner = await User.findOne({
        username: normalizedUsername,
        _id: { $ne: user._id }
      });
      if (usernameOwner) {
        throw new AppError('Username is already taken', 400);
      }
      if (usernameChanged) {
        user.username = normalizedUsername;
        user.usernameUpdatedAt = new Date();
      }
    }
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (customAiProvider !== undefined) user.customAiProvider = customAiProvider;
    if (bio !== undefined) user.bio = bio;
    if (experienceLevel) user.experienceLevel = experienceLevel;
    if (education !== undefined) user.education = education;
    if (resumeFile !== undefined) user.resumeFile = resumeFile;
    if (Array.isArray(projects)) {
      user.projects = projects
        .filter((project) => project.title || project.githubUrl || project.liveUrl)
        .map((project) => ({
          title: project.title || '',
          description: project.description || '',
          githubUrl: project.githubUrl || '',
          liveUrl: project.liveUrl || '',
          featured: project.featured !== false
        }));
    }
    if (interests) user.interests = interests;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

    if (skillsTeach) user.skillsTeach = skillsTeach;
    if (skillsLearn) user.skillsLearn = skillsLearn;

    if (data.role && user.role === 'Admin') {
      if (['User', 'Admin'].includes(data.role)) {
        user.role = data.role;
      }
    }

    await user.save();
    await invalidateUserDashboard(user._id);

    const populatedUser = await this.repo.findUserByIdWithSkills(user._id);
    return publicUserPayload(populatedUser, userId);
  }

  async deleteAccount(res, userId, providedUsername) {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (normalizeUsername(providedUsername) !== user.username) {
      throw new AppError('Type your exact username to delete this account', 400);
    }

    await this.repo.deleteFullAccountData(user._id);

    if (res?.clearCookie) {
      res.clearCookie('refreshToken', refreshCookieOptions);
    }

    return true;
  }

  async uploadProfileResume(user, file, req) {
    if (!file) {
      throw new AppError('No resume file uploaded', 400);
    }

    const cloudinaryUpload = await uploadResumeToCloudinary(file.path, file.originalname);
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const resumeFile =
      cloudinaryUpload?.secure_url ||
      `${baseUrl.replace(/\/$/, '')}/uploads/${file.filename}`;
    const resumeCloudinary = buildCloudinaryResumeMeta(cloudinaryUpload);

    if (cloudinaryUpload?.secure_url && file.path) {
      fs.promises.unlink(file.path).catch(() => {});
    }

    const updatedUser = await this.repo.updateUserResume(
      user._id,
      resumeCloudinary
        ? { resumeFile, resumeCloudinary }
        : { resumeFile, $unset: { resumeCloudinary: 1 } }
    );

    return {
      resumeFile,
      user: publicUserPayload(updatedUser, user._id)
    };
  }

  async viewUserResume(userId, req, res) {
    const user = await User.findById(userId).select('resumeFile resumeCloudinary name');

    if (!user?.resumeFile) {
      throw new AppError('Resume not found', 404);
    }

    if (!isAllowedResumeSource(user.resumeFile, req)) {
      throw new AppError('Resume source is not allowed', 400);
    }

    const localResumePath = getLocalResumePath(user.resumeFile, req);
    if (localResumePath) {
      const contentType = getResumeContentType(localResumePath);
      const fileName = `${normalizeUsername(user.name) || 'resume'}${contentType === 'application/pdf' ? '.pdf' : ''}`;
      const fileBuffer = await fs.promises.readFile(localResumePath);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.status(200).send(fileBuffer);
    }

    let sourceUrl = user.resumeFile;
    let response = await fetch(sourceUrl);

    if (!response.ok) {
      const signedUrl = getSignedCloudinaryResumeUrl(user);
      if (signedUrl) {
        sourceUrl = signedUrl;
        response = await fetch(sourceUrl);
      }

      if (!response.ok) {
        throw new AppError('Resume file could not be loaded', 502);
      }
    }

    const contentType = getResumeContentType(sourceUrl, response.headers.get('content-type') || '');
    const fileName = `${normalizeUsername(user.name) || 'resume'}${contentType === 'application/pdf' ? '.pdf' : ''}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  }

  async uploadMediaImage(file, req) {
    if (!file) {
      throw new AppError('Image file is required', 400);
    }

    const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:5000'}`;
    let finalUrl = null;

    try {
      const result = await uploadOnCloudinary(file.path, { folder: 'orbitus/images' });
      if (result?.secure_url) {
        finalUrl = result.secure_url;
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload warning:', cloudErr?.message);
    }

    if (!finalUrl && file?.filename) {
      finalUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.filename}`;
    }

    if (!finalUrl) {
      throw new AppError('Failed to process image upload', 500);
    }

    return finalUrl;
  }
}

export const usersService = new UsersService();

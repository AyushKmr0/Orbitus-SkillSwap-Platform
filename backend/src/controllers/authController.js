import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  asyncHandler,
  ApiError,
  ApiResponse,
  cloudinaryConfigured,
  uploadOnCloudinary,
  uploadResumeToCloudinary,
  buildCloudinaryResumeMeta,
  getSignedCloudinaryResumeUrl
} from '../utils/index.js';
import User from '../models/User.js';
import Skill from '../models/Skill.js';
import Leaderboard from '../models/Leaderboard.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import Review from '../models/Review.js';
import Session from '../models/Session.js';
import Roadmap from '../models/Roadmap.js';
import ChatPreference from '../models/ChatPreference.js';
import Certificate from '../models/Certificate.js';
import Badge from '../models/Badge.js';
import { sendOtpEmail } from '../services/emailService.js';
import { emitNotificationToUser } from '../socket/socketHandler.js';

const generateAccessToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h' }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production',
    { expiresIn: '7d' }
  );
};

const normalizeUsername = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_]+/g, '')
  .slice(0, 24);

const USERNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 15 * 60 * 1000;

const isAllowedResumeSource = (resumeUrl, req) => {
  try {
    const parsed = new URL(resumeUrl);
    const ownBackendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const ownHost = new URL(ownBackendUrl).host;

    return parsed.host === ownHost || parsed.host === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

const getResumeContentType = (resumeUrl = '', upstreamType = '') => {
  const cleanUrl = resumeUrl.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'application/pdf';
  if (cleanUrl.endsWith('.doc')) return 'application/msword';
  if (cleanUrl.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (upstreamType && !upstreamType.includes('text/html')) return upstreamType;
  return 'application/octet-stream';
};

const headersToDebugObject = (headers) => {
  const debugHeaders = {};
  headers?.forEach((value, key) => {
    debugHeaders[key] = value;
  });
  return debugHeaders;
};

const getLocalResumePath = (resumeUrl = '', req) => {
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

const authLog = (message, meta = {}) => {
  const safeMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined && value !== '')
  );
  console.log('[AUTH]', message, safeMeta);
};

const generateOtpChallenge = () => {
  const code = crypto.randomInt(100000, 1000000).toString();
  return {
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MS)
  };
};

const removeUnverifiedUser = async (userId, reason) => {
  const cleanup = await Promise.allSettled([
    Leaderboard.deleteOne({ user: userId }),
    User.deleteOne({ _id: userId, isVerified: false })
  ]);

  authLog('Unverified registration cleanup completed', {
    userId: userId.toString(),
    reason,
    leaderboardCleanup: cleanup[0].status,
    userCleanup: cleanup[1].status
  });
};

const buildUsernameFromName = async (name, email = '') => {
  const base = normalizeUsername(name) || normalizeUsername(email.split('@')[0]) || `user${Date.now()}`;
  let candidate = base;
  let counter = 1;

  while (await User.exists({ username: candidate })) {
    candidate = `${base.slice(0, 20)}${counter}`;
    counter += 1;
  }

  return candidate;
};

const isProfileComplete = (user) => Boolean(
  user?.username &&
  user?.bio &&
  user?.interests?.length
);

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

const publicUserPayload = (user, viewerId = null, options = {}) => {
  const followerIds = (user.followers || []).map((id) => id.toString());
  const followingIds = (user.following || []).map((id) => id.toString());
  const followerTotal = user.followers?.length ?? user.followersCount ?? 0;
  const followingTotal = user.following?.length ?? user.followingCount ?? 0;

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    usernameUpdatedAt: user.usernameUpdatedAt,
    usernameChangeAvailableAt: user.usernameUpdatedAt ? new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS) : null,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    coverImage: user.coverImage || '',
    customAiProvider: user.customAiProvider || 'default',
    bio: user.bio,
    skillsTeach: user.skillsTeach,
    skillsLearn: user.skillsLearn,
    socialLinks: user.socialLinks,
    experienceLevel: user.experienceLevel,
    education: user.education,
    resumeFile: user.resumeFile,
    projects: user.projects,
    interests: user.interests,
    points: user.points,
    followersCount: followerTotal,
    followingCount: followingTotal,
    isFollowing: options.isFollowing ?? (viewerId ? followerIds.includes(viewerId.toString()) : false),
    profileComplete: isProfileComplete(user)
  };
};

const issueSession = async (res, user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return { accessToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide all required fields');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists?.isVerified) {
    throw new ApiError(400, 'User already exists with this email');
  }

  if (userExists && userExists.authProvider !== 'local') {
    throw new ApiError(400, `This email is already registered with ${userExists.authProvider}`);
  }

  const normalizedUsername = normalizeUsername(username) || await buildUsernameFromName(name, normalizedEmail);
  if (normalizedUsername.length < 3) {
    throw new ApiError(400, 'Username must be at least 3 characters');
  }

  const usernameExists = await User.findOne({
    username: normalizedUsername,
    _id: { $ne: userExists?._id }
  });
  if (usernameExists) {
    throw new ApiError(400, 'Username is already taken');
  }

  const otp = generateOtpChallenge();
  authLog('Registration OTP generated', {
    email: normalizedEmail,
    expiresAt: otp.expiresAt.toISOString(),
    isResendForUnverifiedUser: Boolean(userExists)
  });

  let user;
  if (userExists) {
    userExists.name = name;
    userExists.username = normalizedUsername;
    userExists.password = password;
    userExists.otp = otp;
    userExists.profileImage = userExists.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
    user = await userExists.save();
    await Leaderboard.updateOne({ user: user._id }, { $setOnInsert: { points: user.points || 10 } }, { upsert: true });
  } else {
    user = await User.create({
      name,
      email: normalizedEmail,
      username: normalizedUsername,
      password,
      otp,
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      followersCount: 0,
      followingCount: 0,
      points: 10
    });

    await Leaderboard.create({ user: user._id, points: 10 });
  }

  try {
    authLog('Sending registration OTP email', { email: normalizedEmail, userId: user._id.toString() });
    await sendOtpEmail({
      to: normalizedEmail,
      name,
      code: otp.code,
      purpose: 'verify your email'
    });
  } catch (mailError) {
    await removeUnverifiedUser(user._id, 'registration_email_failed');
    console.error('Registration OTP Email Error:', {
      message: mailError.message,
      code: mailError.code,
      command: mailError.command,
      responseCode: mailError.responseCode
    });
    throw new ApiError(500, 'Registration failed because verification email could not be sent');
  }

  return res.status(201).json(
    new ApiResponse(201, { email: user.email }, 'Registration successful! Verification OTP sent to your email.')
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new ApiError(400, 'Please provide email and verification code');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'Email already verified');
  }

  if (!user.otp?.code || user.otp.code !== code || !user.otp.expiresAt || new Date() > user.otp.expiresAt) {
    authLog('OTP verification rejected', {
      email: email.toLowerCase().trim(),
      hasOtp: Boolean(user.otp?.code),
      expired: user.otp?.expiresAt ? new Date() > user.otp.expiresAt : true
    });
    throw new ApiError(400, 'Invalid or expired OTP code');
  }

  user.isVerified = true;
  user.otp.code = '';
  user.otp.expiresAt = null;
  const { accessToken } = await issueSession(res, user);
  authLog('OTP verification successful', { email: user.email, userId: user._id.toString() });

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: publicUserPayload(user, user._id)
    }, 'Email verified successfully!')
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please enter all fields');
  }

  const user = await User.findOne({ email }).populate('skillsTeach.skill skillsLearn.skill');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const today = new Date().toDateString();
  if (!user.dailyLoginTracker || user.dailyLoginTracker.toDateString() !== today) {
    user.dailyLoginTracker = new Date();
    user.points += 10;
    await Leaderboard.findOneAndUpdate({ user: user._id }, { $inc: { points: 10 } });
    console.log(`[GAMIFICATION] ${user.name} earned +10 points for daily login.`);
  }

  const { accessToken } = await issueSession(res, user);

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: publicUserPayload(user, user._id)
    }, 'Login successful')
  );
});

export const refreshTokens = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, 'Session expired, please login again');
  }

  try {
    const decoded = jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production'
    );
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== incomingToken) {
      throw new ApiError(401, 'Invalid refresh token signature');
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(
      new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed')
    );
  } catch (error) {
    console.error('Token Refresh Error:', error.message);
    throw new ApiError(401, 'Session expired');
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
  }

  res.clearCookie('refreshToken', refreshCookieOptions);

  return res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully')
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No user registered with this email address');
  }

  const previousOtp = user.otp ? { code: user.otp.code, expiresAt: user.otp.expiresAt } : null;
  const resetOtp = generateOtpChallenge();
  user.otp = resetOtp;
  await user.save();

  authLog('Password reset OTP generated', {
    email: user.email,
    expiresAt: resetOtp.expiresAt.toISOString()
  });

  try {
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      code: resetOtp.code,
      purpose: 'reset your password'
    });
  } catch (mailError) {
    user.otp = previousOtp || { code: '', expiresAt: null };
    await user.save();
    console.error('Forgot Password OTP Email Error:', {
      message: mailError.message,
      code: mailError.code,
      command: mailError.command,
      responseCode: mailError.responseCode
    });
    throw new ApiError(500, 'Password recovery email could not be sent. Please try again later.');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'Password recovery OTP code dispatched to email.')
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.otp?.code || user.otp.code !== code || !user.otp.expiresAt || new Date() > user.otp.expiresAt) {
    throw new ApiError(400, 'Invalid or expired reset code');
  }

  user.password = newPassword;
  user.otp.code = '';
  user.otp.expiresAt = null;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, null, 'Password reset successfully! You can now log in.')
  );
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('skillsTeach.skill skillsLearn.skill');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, { user: publicUserPayload(user, req.user._id) }, 'Profile retrieved')
  );
});

export const getPublicUserProfile = asyncHandler(async (req, res) => {
  const rawId = req.params.id;
  let targetId = rawId;

  if (!rawId || rawId === 'me' || rawId === 'undefined' || rawId === 'null') {
    targetId = req.user._id.toString();
  }

  let user;
  if (mongoose.isValidObjectId(targetId)) {
    user = await User.findById(targetId)
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill');
  }

  if (!user) {
    user = await User.findOne({ username: rawId })
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill');
  }

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isFollowing = await Follow.exists({ follower: req.user._id, following: user._id });
  const hasLegacyFollow = (user.followers || []).some((id) => id.toString() === req.user._id.toString());

  let stats = null;
  let badges = [];
  let badgeProgress = [];
  let activityMap = {};

  if (user.role !== 'Admin') {
    const sessions = await Session.find({
      $or: [{ mentor: user._id }, { learner: user._id }]
    });
    const completedSessions = sessions.filter((s) => s.status === 'Completed');
    const userPostCount = await Post.countDocuments({ author: user._id });

    badges = await Badge.find({ user: user._id }).sort({ unlockedAt: -1 });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    sessions.forEach((session) => {
      if (session.status === 'Completed' && session.startTime) {
        const d = new Date(session.startTime);
        if (d >= oneYearAgo) {
          const key = d.toISOString().split('T')[0];
          activityMap[key] = (activityMap[key] || 0) + 1;
        }
      }
    });

    const userPosts = await Post.find({ author: user._id, createdAt: { $gte: oneYearAgo } }).select('createdAt');
    userPosts.forEach((post) => {
      const key = new Date(post.createdAt).toISOString().split('T')[0];
      activityMap[key] = (activityMap[key] || 0) + 1;
    });

    stats = {
      completedSessions: completedSessions.length,
      postsCount: userPostCount,
      points: user.points,
      sessionsCompleted: completedSessions.length
    };
  }

  return res.status(200).json(
    new ApiResponse(200, {
      user: publicUserPayload(user, req.user._id, { isFollowing: Boolean(isFollowing) || hasLegacyFollow }),
      stats,
      badges,
      badgeProgress,
      activityMap
    }, 'Public profile retrieved')
  );
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 1) {
    const suggested = await User.find({ _id: { $ne: req.user._id } })
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .limit(10);
    return res.status(200).json(
      new ApiResponse(200, { users: suggested.map((u) => publicUserPayload(u, req.user._id)) }, 'Suggested users')
    );
  }

  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 64);
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: safeQuery, $options: 'i' } },
      { username: { $regex: safeQuery, $options: 'i' } }
    ]
  })
    .select('-password -refreshToken -otp -dailyLoginTracker')
    .populate('skillsTeach.skill skillsLearn.skill')
    .limit(20);

  return res.status(200).json(
    new ApiResponse(200, {
      users: users.map((foundUser) => publicUserPayload(foundUser, req.user._id))
    }, 'Users found')
  );
});

export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 60);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const skip = (page - 1) * limit;
  const excludeFollowing = req.query.excludeFollowing === 'true';

  const currentUser = await User.findById(req.user._id).select('following');
  const followingIds = (currentUser?.following || []).map((id) => id.toString());

  const filter = {
    _id: { $ne: req.user._id },
    isVerified: true
  };

  if (excludeFollowing && followingIds.length > 0) {
    filter._id = { $nin: [req.user._id, ...currentUser.following] };
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password -refreshToken -otp -dailyLoginTracker')
    .populate('skillsTeach.skill skillsLearn.skill')
    .sort({ points: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const shouldShuffle = req.query.shuffle === 'true';
  let payload = users.map((user) => publicUserPayload(user, req.user._id, {
    isFollowing: followingIds.includes(user._id.toString())
  }));

  if (shouldShuffle && payload.length > 1) {
    payload = [...payload].sort(() => Math.random() - 0.5);
  }

  const hasMore = skip + users.length < total;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    users: payload,
    data: { users: payload, page, limit, total, hasMore },
    hasMore,
    page,
    total
  });
});

export const toggleFollowUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const [targetUser, currentUser] = await Promise.all([
    User.findById(req.params.id),
    User.findById(req.user._id)
  ]);

  if (!targetUser || !currentUser) {
    throw new ApiError(404, 'User not found');
  }

  const alreadyFollowing = await Follow.exists({
    follower: currentUser._id,
    following: targetUser._id
  });

  if (alreadyFollowing) {
    await Promise.all([
      Follow.deleteOne({ follower: currentUser._id, following: targetUser._id }),
      User.updateOne({ _id: currentUser._id }, { $pull: { following: targetUser._id } }),
      User.updateOne({ _id: targetUser._id }, { $pull: { followers: currentUser._id } })
    ]);
  } else {
    await Promise.all([
      Follow.create({ follower: currentUser._id, following: targetUser._id }),
      User.updateOne({ _id: currentUser._id }, { $addToSet: { following: targetUser._id } }),
      User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: currentUser._id } })
    ]);

    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: 'Follow',
      content: `${currentUser.name} started following you.`,
      link: `/profile/${currentUser.username || currentUser._id}`
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name profileImage username')
      .lean();

    emitNotificationToUser(targetUser._id, populatedNotification);
  }

  const [freshTarget, freshCurrent] = await Promise.all([
    User.findById(targetUser._id).select('followers following'),
    User.findById(currentUser._id).select('followers following')
  ]);

  await Promise.all([
    User.updateOne({ _id: targetUser._id }, { $set: { followersCount: (freshTarget?.followers || []).length } }),
    User.updateOne({ _id: currentUser._id }, { $set: { followingCount: (freshCurrent?.following || []).length } })
  ]);

  const populatedTarget = await User.findById(targetUser._id)
    .select('-password -refreshToken -otp -dailyLoginTracker')
    .populate('skillsTeach.skill skillsLearn.skill');

  return res.status(200).json(
    new ApiResponse(200, {
      following: !alreadyFollowing,
      user: publicUserPayload(populatedTarget, currentUser._id, { isFollowing: !alreadyFollowing })
    }, !alreadyFollowing ? 'User followed' : 'User unfollowed')
  );
});

export const getFollowersList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('followers')
    .populate('followers', 'name username profileImage experienceLevel followers');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const currentUserId = req.user?._id?.toString();
  const list = (user.followers || []).map((u) => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    profileImage: u.profileImage,
    experienceLevel: u.experienceLevel,
    isFollowing: currentUserId ? (u.followers || []).some((f) => f.toString() === currentUserId) : false
  }));

  return res.status(200).json(
    new ApiResponse(200, { followers: list }, 'Followers list retrieved')
  );
});

export const getFollowingList = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('following')
    .populate('following', 'name username profileImage experienceLevel followers');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const currentUserId = req.user?._id?.toString();
  const list = (user.following || []).map((u) => ({
    _id: u._id,
    name: u.name,
    username: u.username,
    profileImage: u.profileImage,
    experienceLevel: u.experienceLevel,
    isFollowing: currentUserId ? (u.followers || []).some((f) => f.toString() === currentUserId) : false
  }));

  return res.status(200).json(
    new ApiResponse(200, { following: list }, 'Following list retrieved')
  );
});

const oauthConfig = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET
  }
};

const frontendUrl = () => (process.env.FRONTEND_URL || 'https://orbitus-skill-swap-platform.vercel.app').replace(/\/$/, '');
const backendUrl = (req) => {
  const base = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return base.replace(/\/$/, '');
};

export const startOAuth = asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  const config = oauthConfig[provider];

  let clientOrigin = req.query.origin;
  if (!clientOrigin && req.headers.referer) {
    try {
      clientOrigin = new URL(req.headers.referer).origin;
    } catch (_) {}
  }
  const effectiveFrontendUrl = (clientOrigin || frontendUrl()).replace(/\/$/, '');

  if (!config || !config.clientId() || !config.clientSecret()) {
    authLog('OAuth start rejected due to missing config', { provider });
    return res.redirect(`${effectiveFrontendUrl}/login?oauth=${provider}&error=missing_config`);
  }

  const redirectUri = `${backendUrl(req)}/api/auth/oauth/${provider}/callback`;
  const state = jwt.sign(
    { provider, purpose: 'oauth_state', clientOrigin: effectiveFrontendUrl },
    process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production',
    { expiresIn: '10m' }
  );
  const params = new URLSearchParams({
    client_id: config.clientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state
  });
  if (provider === 'google') params.set('prompt', 'select_account');

  authLog('OAuth authorization redirect generated', { provider, redirectUri });
  return res.redirect(`${config.authUrl}?${params.toString()}`);
});

const fetchOAuthProfile = async (provider, accessToken) => {
  const config = oauthConfig[provider];
  const profileRes = await fetch(config.userUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!profileRes.ok) throw new Error(`${provider} profile request failed`);
  const profile = await profileRes.json();

  if (provider === 'github' && !profile.email) {
    const emailsRes = await fetch(config.emailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });
    const emails = emailsRes.ok ? await emailsRes.json() : [];
    profile.email = emails.find((email) => email.primary && email.verified)?.email || emails.find((email) => email.verified)?.email;
  }

  return {
    providerId: String(profile.id),
    email: profile.email,
    name: profile.name || profile.login || (profile.email ? profile.email.split('@')[0] : 'Orbitus User'),
    avatar: profile.picture || profile.avatar_url || ''
  };
};

export const handleOAuthCallback = asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  const config = oauthConfig[provider];
  const code = req.query.code;
  const state = req.query.state;

  let targetFrontendUrl = frontendUrl();

  if (!config || !code) {
    return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=oauth_failed`);
  }

  try {
    const decodedState = jwt.verify(
      state,
      process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production'
    );
    if (decodedState.provider !== provider || decodedState.purpose !== 'oauth_state') {
      throw new Error('OAuth state provider mismatch');
    }
    if (decodedState.clientOrigin) {
      targetFrontendUrl = decodedState.clientOrigin.replace(/\/$/, '');
    }
  } catch (stateError) {
    authLog('OAuth callback rejected due to invalid state', { provider, reason: stateError.message });
    return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=oauth_failed`);
  }

  const redirectUri = `${backendUrl(req)}/api/auth/oauth/${provider}/callback`;
  authLog('OAuth token exchange started', { provider, redirectUri });
  const tokenBody = new URLSearchParams({
    client_id: config.clientId(),
    client_secret: config.clientSecret(),
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenBody.toString()
  });

  const tokenPayload = await tokenRes.json();
  if (!tokenRes.ok || !tokenPayload.access_token) {
    throw new Error(`${provider} token exchange failed`);
  }
  authLog('OAuth token exchange successful', { provider });

  const profile = await fetchOAuthProfile(provider, tokenPayload.access_token);
  if (!profile.email) {
    return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=email_unavailable`);
  }
  authLog('OAuth profile loaded', { provider, email: profile.email });

  let user = await User.findOne({
    $or: [
      { email: profile.email.toLowerCase() },
      { authProvider: provider, providerId: profile.providerId }
    ]
  }).populate('skillsTeach.skill skillsLearn.skill');

  if (!user) {
    user = await User.create({
      name: profile.name,
      email: profile.email,
      username: await buildUsernameFromName(profile.name, profile.email),
      authProvider: provider,
      providerId: profile.providerId,
      isVerified: true,
      profileImage: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff`,
      followersCount: 0,
      followingCount: 0,
      points: 10
    });
    await Leaderboard.create({ user: user._id, points: 10 });
    user = await User.findById(user._id).populate('skillsTeach.skill skillsLearn.skill');
  } else {
    user.authProvider = user.authProvider || provider;
    user.providerId = user.providerId || profile.providerId;
    user.isVerified = true;
    if (!user.username) user.username = await buildUsernameFromName(user.name, user.email);
    if (profile.avatar && (!user.profileImage || user.profileImage.includes('dicebear.com'))) {
      user.profileImage = profile.avatar;
    }
    await user.save();
  }

  const { accessToken } = await issueSession(res, user);
  authLog('OAuth session issued', { provider, userId: user._id.toString(), email: user.email });
  return res.redirect(`${targetFrontendUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(publicUserPayload(user, user._id)))}`);
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
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
  } = req.body;

  if (name) user.name = name;
  if (username !== undefined) {
    const normalizedUsername = normalizeUsername(username);
    if (normalizedUsername.length < 3) {
      throw new ApiError(400, 'Username must be at least 3 characters');
    }
    const usernameChanged = normalizedUsername !== user.username;
    if (usernameChanged && user.usernameUpdatedAt) {
      const availableAt = new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS);
      if (availableAt > new Date()) {
        throw new ApiError(429, `Username can be changed after ${availableAt.toLocaleDateString('en-IN')}`);
      }
    }
    const usernameOwner = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
    if (usernameOwner) {
      throw new ApiError(400, 'Username is already taken');
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

  await user.save();

  const populatedUser = await User.findById(user._id)
    .select('-password -refreshToken -otp')
    .populate('skillsTeach.skill skillsLearn.skill');

  return res.status(200).json(
    new ApiResponse(200, {
      user: publicUserPayload(populatedUser, req.user._id)
    }, 'Profile updated successfully!')
  );
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (normalizeUsername(username) !== user.username) {
    throw new ApiError(400, 'Type your exact username to delete this account');
  }

  await Promise.all([
    Message.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] }),
    Post.deleteMany({ author: user._id }),
    Post.updateMany({}, { $pull: { likes: user._id, comments: { author: user._id } } }),
    Follow.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] }),
    Notification.deleteMany({ $or: [{ recipient: user._id }, { sender: user._id }] }),
    Review.deleteMany({ $or: [{ reviewer: user._id }, { reviewee: user._id }] }),
    Session.deleteMany({ $or: [{ learner: user._id }, { mentor: user._id }] }),
    Roadmap.deleteMany({ user: user._id }),
    ChatPreference.deleteMany({ $or: [{ owner: user._id }, { partner: user._id }] }),
    Certificate.deleteMany({ recipient: user._id }),
    Leaderboard.deleteMany({ user: user._id }),
    User.updateMany({}, { $pull: { followers: user._id, following: user._id } })
  ]);

  await Post.updateMany({}, [
    { $set: { likesCount: { $size: '$likes' }, commentsCount: { $size: '$comments' } } }
  ]);
  await User.updateMany({}, [
    { $set: { followersCount: { $size: '$followers' }, followingCount: { $size: '$following' } } }
  ]);

  await User.deleteOne({ _id: user._id });
  res.clearCookie('refreshToken', refreshCookieOptions);

  return res.status(200).json(
    new ApiResponse(200, null, 'Account deleted successfully')
  );
});

export const uploadProfileResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No resume file uploaded');
  }

  console.log('[RESUME DEBUG] Upload phase started', {
    userId: req.user._id.toString(),
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    localPath: req.file.path,
    cloudinaryConfigured: Boolean(cloudinaryConfigured())
  });

  const cloudinaryUpload = await uploadResumeToCloudinary(req.file.path, req.file.originalname);
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const resumeFile = cloudinaryUpload?.secure_url || `${baseUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;
  const resumeCloudinary = buildCloudinaryResumeMeta(cloudinaryUpload);

  console.log('[RESUME DEBUG] Cloudinary upload response', {
    userId: req.user._id.toString(),
    hasCloudinaryUpload: Boolean(cloudinaryUpload),
    secure_url: cloudinaryUpload?.secure_url,
    url: cloudinaryUpload?.url,
    public_id: cloudinaryUpload?.public_id,
    resource_type: cloudinaryUpload?.resource_type,
    type: cloudinaryUpload?.type,
    format: cloudinaryUpload?.format,
    bytes: cloudinaryUpload?.bytes,
    created_at: cloudinaryUpload?.created_at,
    resumeFileToSave: resumeFile,
    resumeCloudinary
  });

  if (cloudinaryUpload?.secure_url && req.file.path) {
    fs.promises.unlink(req.file.path).catch(() => {});
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    resumeCloudinary
      ? { resumeFile, resumeCloudinary }
      : { resumeFile, $unset: { resumeCloudinary: 1 } },
    { new: true }
  ).select('-password -refreshToken -otp').populate('skillsTeach.skill skillsLearn.skill');

  return res.status(201).json(
    new ApiResponse(201, {
      resumeFile,
      user: publicUserPayload(user, req.user._id)
    }, 'Resume uploaded successfully')
  );
});

export const viewUserResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('resumeFile resumeCloudinary name');
  const viewerUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  console.log('[RESUME DEBUG] View phase started', {
    requestedUserId: req.params.id,
    viewerUrl,
    routeHit: true,
    foundUser: Boolean(user),
    resumeFileFromDb: user?.resumeFile,
    resumeCloudinaryFromDb: user?.resumeCloudinary
  });

  if (!user?.resumeFile) {
    throw new ApiError(404, 'Resume not found');
  }

  if (!isAllowedResumeSource(user.resumeFile, req)) {
    console.error('[RESUME DEBUG] Resume source rejected', {
      requestedUserId: req.params.id,
      resumeFileFromDb: user.resumeFile
    });
    throw new ApiError(400, 'Resume source is not allowed');
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
      throw new ApiError(502, 'Resume file could not be loaded');
    }
  }

  const contentType = getResumeContentType(sourceUrl, response.headers.get('content-type') || '');
  const fileName = `${normalizeUsername(user.name) || 'resume'}${contentType === 'application/pdf' ? '.pdf' : ''}`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

  const buffer = Buffer.from(await response.arrayBuffer());
  return res.status(200).send(buffer);
});

export const uploadMediaImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required');
  }

  const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:5000'}`;
  let finalUrl = null;

  try {
    const result = await uploadOnCloudinary(req.file.path, { folder: 'orbitus/images' });
    if (result?.secure_url) {
      finalUrl = result.secure_url;
    }
  } catch (cloudErr) {
    console.warn('Cloudinary upload warning:', cloudErr?.message);
  }

  // Graceful fallback to locally served uploaded file if Cloudinary fails or is unreachable
  if (!finalUrl && req.file?.filename) {
    finalUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;
  }

  if (!finalUrl) {
    throw new ApiError(500, 'Failed to process image upload');
  }

  return res.status(200).json({
    success: true,
    statusCode: 200,
    url: finalUrl,
    data: { url: finalUrl },
    message: 'Image uploaded successfully'
  });
});

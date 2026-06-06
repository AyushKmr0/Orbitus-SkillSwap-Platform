import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
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
import { sendOtpEmail } from '../services/emailService.js';
import { emitNotificationToUser } from '../socket/socketHandler.js';

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production', { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h' });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production', { expiresIn: '7d' });
};

const normalizeUsername = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9_]+/g, '')
  .slice(0, 24);

const USERNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 15 * 60 * 1000;

const cloudinaryConfigured = () => (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const uploadResumeToCloudinary = async (filePath, originalName = '') => {
  if (!cloudinaryConfigured()) return null;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  return cloudinary.uploader.upload(filePath, {
    folder: 'orbitus/resumes',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    filename_override: originalName || undefined
  });
};

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

    return candidates.find(candidate => fs.existsSync(candidate)) || null;
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
  const followerIds = (user.followers || []).map(id => id.toString());
  const followingIds = (user.following || []).map(id => id.toString());
  const followerTotal = user.followersCount ?? followerIds.length;
  const followingTotal = user.followingCount ?? followingIds.length;

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    usernameUpdatedAt: user.usernameUpdatedAt,
    usernameChangeAvailableAt: user.usernameUpdatedAt ? new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS) : null,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
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

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, username } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists?.isVerified) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    if (userExists && userExists.authProvider !== 'local') {
      return res.status(400).json({ success: false, message: `This email is already registered with ${userExists.authProvider}` });
    }

    const normalizedUsername = normalizeUsername(username) || await buildUsernameFromName(name, normalizedEmail);
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }

    const usernameExists = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: userExists?._id }
    });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
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
      userExists.profileImage = userExists.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
      user = await userExists.save();
      await Leaderboard.updateOne({ user: user._id }, { $setOnInsert: { points: user.points || 10 } }, { upsert: true });
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        username: normalizedUsername,
        password, // hashed automatically via User schema pre-save hook
        otp,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        followersCount: 0,
        followingCount: 0,
        points: 10 // Starting bonus points!
      });

      // Create a corresponding Leaderboard entry
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
      return res.status(500).json({
        success: false,
        message: 'Registration failed because verification email could not be sent'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification OTP sent to your email.',
      email: user.email
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    if (!user.otp?.code || user.otp.code !== code || !user.otp.expiresAt || new Date() > user.otp.expiresAt) {
      authLog('OTP verification rejected', {
        email: email.toLowerCase().trim(),
        hasOtp: Boolean(user.otp?.code),
        expired: user.otp?.expiresAt ? new Date() > user.otp.expiresAt : true
      });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Verify user
    user.isVerified = true;
    user.otp.code = '';
    user.otp.expiresAt = null;
    const { accessToken } = await issueSession(res, user);
    authLog('OTP verification successful', { email: user.email, userId: user._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      accessToken,
      user: publicUserPayload(user, user._id)
    });
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// @desc    Authenticate user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter all fields' });
    }

    const user = await User.findOne({ email }).populate('skillsTeach.skill skillsLearn.skill');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check daily login gamification
    const today = new Date().toDateString();
    if (!user.dailyLoginTracker || user.dailyLoginTracker.toDateString() !== today) {
      user.dailyLoginTracker = new Date();
      user.points += 10; // +10 daily login points
      
      // Update leaderboard
      await Leaderboard.findOneAndUpdate({ user: user._id }, { $inc: { points: 10 } });
      console.log(`[GAMIFICATION] ${user.name} earned +10 points for daily login.`);
    }

    const { accessToken } = await issueSession(res, user);

    res.status(200).json({
      success: true,
      accessToken,
      user: publicUserPayload(user, user._id)
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshTokens = async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    return res.status(401).json({ success: false, message: 'Session expired, please login again' });
  }

  try {
    const decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me_in_production');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== incomingToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token signature' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token Refresh Error:', error.message);
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
};

// @desc    Logout user & clear cookies
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  try {
    if (token) {
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
    }

    res.clearCookie('refreshToken', refreshCookieOptions);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email address' });
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
      return res.status(500).json({
        success: false,
        message: 'Password recovery email could not be sent. Please try again later.'
      });
    }

    res.status(200).json({ success: true, message: 'Password recovery OTP code dispatched to email.' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password recovery initiation' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp?.code || user.otp.code !== code || !user.otp.expiresAt || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Set new password
    user.password = newPassword; // Hashed automatically on save
    user.otp.code = '';
    user.otp.expiresAt = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('skillsTeach.skill skillsLearn.skill');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: publicUserPayload(user, req.user._id) });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile details' });
  }
};

// @desc    Get public profile details for any user
// @route   GET /api/users/:id
// @access  Private
export const getPublicUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isFollowing = await Follow.exists({ follower: req.user._id, following: user._id });
    const hasLegacyFollow = (user.followers || []).some(id => id.toString() === req.user._id.toString());
    res.status(200).json({ success: true, user: publicUserPayload(user, req.user._id, { isFollowing: Boolean(isFollowing) || hasLegacyFollow }) });
  } catch (error) {
    console.error('Get Public Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching public profile' });
  }
};

// @desc    Search people by name or username
// @route   GET /api/users/search?q=
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
      return res.status(200).json({ success: true, users: [] });
    }

    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 64);
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: `^${safeQuery}`, $options: 'i' } },
        { username: { $regex: `^${safeQuery}`, $options: 'i' } }
      ]
    })
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill')
      .limit(12);

    res.status(200).json({
      success: true,
      users: users.map(foundUser => publicUserPayload(foundUser, req.user._id))
    });
  } catch (error) {
    console.error('Search Users Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error searching users' });
  }
};

// @desc    Follow or unfollow a user
// @route   POST /api/users/:id/follow
// @access  Private
export const toggleFollowUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(req.params.id),
      User.findById(req.user._id)
    ]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyFollowing = await Follow.exists({
      follower: currentUser._id,
      following: targetUser._id
    });

    if (alreadyFollowing) {
      await Promise.all([
        Follow.deleteOne({ follower: currentUser._id, following: targetUser._id }),
        User.updateOne({ _id: currentUser._id }, { $pull: { following: targetUser._id }, $inc: { followingCount: -1 } }),
        User.updateOne({ _id: targetUser._id }, { $pull: { followers: currentUser._id }, $inc: { followersCount: -1 } })
      ]);
    } else {
      await Promise.all([
        Follow.create({ follower: currentUser._id, following: targetUser._id }),
        User.updateOne({ _id: currentUser._id }, { $addToSet: { following: targetUser._id }, $inc: { followingCount: 1 } }),
        User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: currentUser._id }, $inc: { followersCount: 1 } })
      ]);

      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'Follow',
        content: `${currentUser.name} started following you.`,
        link: `/profile/${currentUser._id}`
      });
      emitNotificationToUser(targetUser._id, notification);
    }

    const populatedTarget = await User.findById(targetUser._id)
      .select('-password -refreshToken -otp -dailyLoginTracker')
      .populate('skillsTeach.skill skillsLearn.skill');

    res.status(200).json({
      success: true,
      following: !alreadyFollowing,
      user: publicUserPayload(populatedTarget, currentUser._id, { isFollowing: !alreadyFollowing })
    });
  } catch (error) {
    console.error('Toggle Follow Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating follow status' });
  }
};

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

// @desc    Start Google/GitHub OAuth
// @route   GET /api/auth/oauth/:provider
// @access  Public
export const startOAuth = async (req, res) => {
  const provider = req.params.provider;
  const config = oauthConfig[provider];

  if (!config || !config.clientId() || !config.clientSecret()) {
    authLog('OAuth start rejected due to missing config', { provider });
    return res.redirect(`${frontendUrl()}/login?oauth=${provider}&error=missing_config`);
  }

  const redirectUri = `${backendUrl(req)}/api/auth/oauth/${provider}/callback`;
  const state = jwt.sign(
    { provider, purpose: 'oauth_state' },
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
  res.redirect(`${config.authUrl}?${params.toString()}`);
};

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
    profile.email = emails.find(email => email.primary && email.verified)?.email || emails.find(email => email.verified)?.email;
  }

  return {
    providerId: String(profile.id),
    email: profile.email,
    name: profile.name || profile.login || (profile.email ? profile.email.split('@')[0] : 'Orbitus User'),
    avatar: profile.picture || profile.avatar_url || ''
  };
};

// @desc    Handle Google/GitHub OAuth callback
// @route   GET /api/auth/oauth/:provider/callback
// @access  Public
export const handleOAuthCallback = async (req, res) => {
  const provider = req.params.provider;
  const config = oauthConfig[provider];
  const code = req.query.code;
  const state = req.query.state;

  try {
    if (!config || !code) {
      return res.redirect(`${frontendUrl()}/login?oauth=${provider}&error=oauth_failed`);
    }

    try {
      const decodedState = jwt.verify(state, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production');
      if (decodedState.provider !== provider || decodedState.purpose !== 'oauth_state') {
        throw new Error('OAuth state provider mismatch');
      }
    } catch (stateError) {
      authLog('OAuth callback rejected due to invalid state', { provider, reason: stateError.message });
      return res.redirect(`${frontendUrl()}/login?oauth=${provider}&error=oauth_failed`);
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
      return res.redirect(`${frontendUrl()}/login?oauth=${provider}&error=email_unavailable`);
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
        profileImage: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
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
    res.redirect(`${frontendUrl()}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(publicUserPayload(user, user._id)))}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error.message);
    res.redirect(`${frontendUrl()}/login?oauth=${provider}&error=oauth_failed`);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { bio, experienceLevel, education, interests, socialLinks, skillsTeach, skillsLearn, name, username, profileImage, projects, resumeFile } = req.body;

    if (name) user.name = name;
    if (username !== undefined) {
      const normalizedUsername = normalizeUsername(username);
      if (normalizedUsername.length < 3) {
        return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
      }
      const usernameChanged = normalizedUsername !== user.username;
      if (usernameChanged && user.usernameUpdatedAt) {
        const availableAt = new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS);
        if (availableAt > new Date()) {
          return res.status(429).json({
            success: false,
            message: `Username can be changed after ${availableAt.toLocaleDateString('en-IN')}`,
            usernameChangeAvailableAt: availableAt
          });
        }
      }
      const usernameOwner = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
      if (usernameOwner) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      if (usernameChanged) {
        user.username = normalizedUsername;
        user.usernameUpdatedAt = new Date();
      }
    }
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (bio !== undefined) user.bio = bio;
    if (experienceLevel) user.experienceLevel = experienceLevel;
    if (education !== undefined) user.education = education;
    if (resumeFile !== undefined) user.resumeFile = resumeFile;
    if (Array.isArray(projects)) {
      user.projects = projects
        .filter(project => project.title || project.githubUrl || project.liveUrl)
        .map(project => ({
          title: project.title || '',
          description: project.description || '',
          githubUrl: project.githubUrl || '',
          liveUrl: project.liveUrl || '',
          featured: project.featured !== false
        }));
    }
    if (interests) user.interests = interests;
    if (socialLinks) user.socialLinks = { ...user.socialLinks, ...socialLinks };

    // Format skill objects correctly
    if (skillsTeach) user.skillsTeach = skillsTeach;
    if (skillsLearn) user.skillsLearn = skillsLearn;

    await user.save();

    // Reload with populated details
    const populatedUser = await User.findById(user._id)
      .select('-password -refreshToken -otp')
      .populate('skillsTeach.skill skillsLearn.skill');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: publicUserPayload(populatedUser, req.user._id)
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile details' });
  }
};

// @desc    Delete current account after username confirmation
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (normalizeUsername(username) !== user.username) {
      return res.status(400).json({ success: false, message: 'Type your exact username to delete this account' });
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

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete Account Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting account' });
  }
};

// @desc    Upload a resume document to attach to profile
// @route   POST /api/users/profile/resume
// @access  Private
export const uploadProfileResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resume file uploaded' });
    }

    const cloudinaryUpload = await uploadResumeToCloudinary(req.file.path, req.file.originalname);
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const resumeFile = cloudinaryUpload?.secure_url || `${baseUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;

    if (cloudinaryUpload?.secure_url && req.file.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resumeFile },
      { new: true }
    ).select('-password -refreshToken -otp').populate('skillsTeach.skill skillsLearn.skill');

    res.status(201).json({ success: true, resumeFile, user: publicUserPayload(user, req.user._id) });
  } catch (error) {
    console.error('Resume Upload Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error uploading resume' });
  }
};

// @desc    Open a user's public resume with browser-friendly headers
// @route   GET /api/users/:id/resume
// @access  Public
export const viewUserResume = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('resumeFile name');
    if (!user?.resumeFile) {
      return res.status(404).send('Resume not found');
    }

    if (!isAllowedResumeSource(user.resumeFile, req)) {
      return res.status(400).send('Resume source is not allowed');
    }

    const localResumePath = getLocalResumePath(user.resumeFile, req);
    if (localResumePath) {
      const contentType = getResumeContentType(localResumePath);
      const fileName = `${normalizeUsername(user.name) || 'resume'}${contentType === 'application/pdf' ? '.pdf' : ''}`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.status(200).send(await fs.promises.readFile(localResumePath));
    }

    const response = await fetch(user.resumeFile);
    if (!response.ok) {
      console.error('Resume upstream load failed:', {
        userId: user._id.toString(),
        status: response.status,
        statusText: response.statusText,
        host: new URL(user.resumeFile).host
      });
      return res.status(502).send('Resume file could not be loaded');
    }

    const contentType = getResumeContentType(user.resumeFile, response.headers.get('content-type') || '');
    const fileName = `${normalizeUsername(user.name) || 'resume'}${contentType === 'application/pdf' ? '.pdf' : ''}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Resume View Error:', error.message);
    return res.status(500).send('Server error opening resume');
  }
};

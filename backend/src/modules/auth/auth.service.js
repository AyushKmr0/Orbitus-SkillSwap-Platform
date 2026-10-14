import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../../shared/errors/app-error.js';
import { authRepository } from './auth.repository.js';
import { sendOtpEmail } from '../../infrastructure/email/mailer.js';
import { getJwtSecret, getJwtRefreshSecret } from '../../config/env.js';
import User from '../../models/User.js';
import Leaderboard from '../../models/Leaderboard.js';
import { activityService } from '../../services/activityService.js';

export const USERNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export const OTP_TTL_MS = 15 * 60 * 1000;

export const generateAccessToken = (id) => {
  return jwt.sign(
    { id },
    getJwtSecret(),
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h' }
  );
};

export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    getJwtRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

export const normalizeUsername = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
    .slice(0, 24);

export const generateOtpChallenge = () => {
  const code = crypto.randomInt(100000, 1000000).toString();
  return {
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MS)
  };
};

export const buildUsernameFromName = async (name, email = '') => {
  const base =
    normalizeUsername(name) || normalizeUsername(email.split('@')[0]) || `user${Date.now()}`;
  let candidate = base;
  let counter = 1;

  while (await User.exists({ username: candidate })) {
    candidate = `${base.slice(0, 20)}${counter}`;
    counter += 1;
  }

  return candidate;
};

export const isProfileComplete = (user) =>
  Boolean(user?.username && user?.bio && user?.interests?.length);

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

export const publicUserPayload = (user, viewerId = null, options = {}) => {
  const followerIds = (user.followers || []).map((id) => id.toString());
  const followerTotal = user.followers?.length ?? user.followersCount ?? 0;
  const followingTotal = user.following?.length ?? user.followingCount ?? 0;

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    usernameUpdatedAt: user.usernameUpdatedAt,
    usernameChangeAvailableAt: user.usernameUpdatedAt
      ? new Date(user.usernameUpdatedAt.getTime() + USERNAME_COOLDOWN_MS)
      : null,
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
    timezone: user.timezone || 'Asia/Kolkata',
    isFollowing:
      options.isFollowing ?? (viewerId ? followerIds.includes(viewerId.toString()) : false),
    profileComplete: isProfileComplete(user)
  };
};

export class AuthService {
  constructor(repo = authRepository) {
    this.repo = repo;
  }

  async issueSession(res, user) {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    if (res?.cookie) {
      res.cookie('refreshToken', refreshToken, {
        ...refreshCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    return { accessToken, refreshToken };
  }

  async registerUser({ name, email, password, username }) {
    if (!name || !email || !password) {
      throw new AppError('Please provide all required fields', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await this.repo.findUserByEmailWithoutPassword(normalizedEmail);

    if (userExists?.isVerified) {
      throw new AppError('User already exists with this email', 400);
    }

    if (userExists && userExists.authProvider !== 'local') {
      throw new AppError(`This email is already registered with ${userExists.authProvider}`, 400);
    }

    const normalizedUsername =
      normalizeUsername(username) || (await buildUsernameFromName(name, normalizedEmail));
    if (normalizedUsername.length < 3) {
      throw new AppError('Username must be at least 3 characters', 400);
    }

    const usernameExists = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: userExists?._id }
    });
    if (usernameExists) {
      throw new AppError('Username is already taken', 400);
    }

    const otp = generateOtpChallenge();

    let user;
    if (userExists) {
      userExists.name = name;
      userExists.username = normalizedUsername;
      userExists.password = password;
      userExists.otp = otp;
      userExists.profileImage =
        userExists.profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
      user = await userExists.save();
      await Leaderboard.updateOne(
        { user: user._id },
        { $setOnInsert: { points: user.points || 10 } },
        { upsert: true }
      );
    } else {
      user = await this.repo.createUser({
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
      await this.repo.createLeaderboardEntry(user._id, 10);
    }

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        name,
        code: otp.code,
        purpose: 'verify your email'
      });
    } catch (mailError) {
      await this.repo.deleteUnverifiedUser(user._id);
      console.error('Registration OTP Email Error:', {
        message: mailError.message,
        code: mailError.code,
        command: mailError.command,
        responseCode: mailError.responseCode
      });
      throw new AppError('Registration failed because verification email could not be sent', 500);
    }

    return { email: user.email };
  }

  async verifyOtp(res, { email, code }) {
    if (!email || !code) {
      throw new AppError('Please provide email and verification code', 400);
    }

    const user = await this.repo.findUserByEmailWithoutPassword(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isVerified) {
      throw new AppError('Email already verified', 400);
    }

    if (
      !user.otp?.code ||
      user.otp.code !== code ||
      !user.otp.expiresAt ||
      new Date() > user.otp.expiresAt
    ) {
      throw new AppError('Invalid or expired OTP code', 400);
    }

    user.isVerified = true;
    user.otp.code = '';
    user.otp.expiresAt = null;

    const { accessToken } = await this.issueSession(res, user);
    return {
      accessToken,
      user: publicUserPayload(user, user._id)
    };
  }

  async loginUser(res, { email, password }) {
    if (!email || !password) {
      throw new AppError('Please enter all fields', 400);
    }

    const user = await User.findOne({ email }).populate('skillsTeach.skill skillsLearn.skill');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const userTimezone = user.timezone || 'Asia/Kolkata';
    const loginReward = await activityService.recordDailyLogin({
      userId: user._id,
      timeZone: userTimezone
    });
    if (loginReward.totalPoints !== undefined && loginReward.totalPoints !== null) {
      user.points = loginReward.totalPoints;
    }
    if (loginReward.awarded) {
      user.dailyLoginTracker = new Date();
    }

    const { accessToken } = await this.issueSession(res, user);
    return {
      accessToken,
      user: publicUserPayload(user, user._id)
    };
  }

  async refreshTokens(res, incomingToken) {
    if (!incomingToken) {
      throw new AppError('Session expired, please login again', 401);
    }

    try {
      const decoded = jwt.verify(incomingToken, getJwtRefreshSecret());
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== incomingToken) {
        throw new AppError('Invalid refresh token signature', 401);
      }

      const newAccessToken = generateAccessToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      user.refreshToken = newRefreshToken;
      await user.save();

      if (res?.cookie) {
        res.cookie('refreshToken', newRefreshToken, {
          ...refreshCookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
      }

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Session expired', 401);
    }
  }

  async logoutUser(res, token) {
    if (token) {
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
    }

    if (res?.clearCookie) {
      res.clearCookie('refreshToken', refreshCookieOptions);
    }
    return true;
  }

  async forgotPassword({ email }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No user registered with this email address', 404);
    }

    const previousOtp = user.otp ? { code: user.otp.code, expiresAt: user.otp.expiresAt } : null;
    const resetOtp = generateOtpChallenge();
    user.otp = resetOtp;
    await user.save();

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
      throw new AppError(
        'Password recovery email could not be sent. Please try again later.',
        500
      );
    }

    return true;
  }

  async resetPassword({ email, code, newPassword }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (
      !user.otp?.code ||
      user.otp.code !== code ||
      !user.otp.expiresAt ||
      new Date() > user.otp.expiresAt
    ) {
      throw new AppError('Invalid or expired reset code', 400);
    }

    user.password = newPassword;
    user.otp.code = '';
    user.otp.expiresAt = null;
    await user.save();

    return true;
  }

  async verifyAdminKeyAndLogin(res, reqUser, { email, password, key, adminKey } = {}) {
    let user = reqUser;
    const providedKey = String(key || adminKey || '').trim();
    const configuredKey = String(process.env.ADMIN_SECRET_KEY || 'orbitus-v2-secret710').trim();

    if (providedKey && providedKey === configuredKey) {
      user = await User.findOne({
        $or: [
          { role: { $regex: /^admin$/i } },
          { email: process.env.ADMIN_EMAIL || 'admin@orbitus.com' }
        ]
      }).select('-password');
    }

    if (!user && email && password) {
      const candidateUser = await User.findOne({ email: email.toLowerCase() });
      if (candidateUser && (await candidateUser.matchPassword(password))) {
        user = candidateUser;
      }
    }

    if (!user || String(user.role || '').toLowerCase() !== 'admin') {
      throw new AppError('Access denied: invalid administrator key or credentials', 403);
    }

    const { accessToken } = await this.issueSession(res, user);
    const userData = publicUserPayload(user);

    return { token: accessToken, user: userData };
  }
}

export const authService = new AuthService();

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppError } from '../../shared/errors/app-error.js';
import { authRepository } from './auth.repository.js';
import { sendOtpEmail, sendEmailChangeNotice } from '../../infrastructure/email/mailer.js';
import { getJwtSecret, getJwtRefreshSecret } from '../../config/env.js';
import User from '../../models/User.js';
import SystemSetting from '../../models/SystemSetting.js';
import { getEffectiveAdminSecretKey, setCachedAdminSecretKey } from '../../config/systemSettings.js';
import Leaderboard from '../../models/Leaderboard.js';
import { activityService } from '../../services/activityService.js';
import { isAccountSuspended } from '../../shared/auth/accountStatus.js';

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

export const hashEmailChangeOtp = (otp) =>
  crypto.createHmac('sha256', getJwtSecret()).update(String(otp || '').trim()).digest('hex');

const matchesEmailChangeOtp = (storedHash, otp) => {
  const expected = Buffer.from(hashEmailChangeOtp(otp));
  const actual = Buffer.from(String(storedHash || ''));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
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
    streak: user.streak || 0,
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
    hasPassword: Boolean(user.password && user.password.length > 0),
    authProvider: user.authProvider || 'local',
    ...(String(user.role || '').toLowerCase() === 'admin'
      ? {
          adminAccessLevel: user.adminAccessLevel || 'full',
          adminPermissions: user.adminPermissions || []
        }
      : {}),
    profileComplete: isProfileComplete(user)
  };
};

export class AuthService {
  constructor(
    repo = authRepository,
    mailer = { sendOtpEmail, sendEmailChangeNotice }
  ) {
    this.repo = repo;
    this.mailer = mailer;
  }

  async issueSession(res, user) {
    const loginReward = await activityService.recordDailyLogin({
      userId: user._id,
      timeZone: user.timezone || 'Asia/Kolkata'
    });
    if (loginReward.totalPoints !== undefined && loginReward.totalPoints !== null) {
      user.points = loginReward.totalPoints;
    }
    if (loginReward.streak !== undefined && loginReward.streak !== null) {
      user.streak = loginReward.streak;
    }
    if (loginReward.awarded) {
      user.dailyLoginTracker = new Date();
    }

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

    return {
      accessToken,
      refreshToken,
      dailyReward: {
        awarded: Boolean(loginReward.awarded),
        pointsAwarded: loginReward.awarded ? (loginReward.pointsAwarded ?? 10) : 0,
        totalPoints: user.points || 0,
        streak: user.streak || 0
      }
    };
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
      await this.mailer.sendOtpEmail({
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

  async verifyOtp(res, { email, code, otp }) {
    const verificationCode = String(code || otp || '').trim();
    if (!email || !verificationCode) {
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
      user.otp.code !== verificationCode ||
      !user.otp.expiresAt ||
      new Date() > user.otp.expiresAt
    ) {
      throw new AppError('Invalid or expired OTP code', 400);
    }

    user.isVerified = true;
    user.otp.code = '';
    user.otp.expiresAt = null;

    const { accessToken, dailyReward } = await this.issueSession(res, user);
    return {
      accessToken,
      user: publicUserPayload(user, user._id),
      dailyReward
    };
  }

  async loginUser(res, { email, password }) {
    if (!email || !password) {
      throw new AppError('Please enter all fields', 400);
    }

    const user = await User.findOne({ email });
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
    if (isAccountSuspended(user)) {
      throw new AppError(
        user.suspendedUntil
          ? `Account suspended until ${new Date(user.suspendedUntil).toISOString()}`
          : 'Account suspended',
        403
      );
    }

    const { accessToken, dailyReward } = await this.issueSession(res, user);
    return {
      accessToken,
      user: publicUserPayload(user, user._id),
      dailyReward
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
      if (isAccountSuspended(user)) {
        user.refreshToken = '';
        await user.save();
        throw new AppError('Account suspended. Contact support for assistance.', 403);
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
      await this.mailer.sendOtpEmail({
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

  async resetPassword({ email, code, token, otp, newPassword }) {
    const resetCode = String(code || token || otp || '').trim();
    if (!resetCode) {
      throw new AppError('Reset verification code is required', 400);
    }

    let user = null;
    if (email) {
      user = await User.findOne({ email: String(email).trim().toLowerCase() });
    }
    if (!user) {
      user = await User.findOne({ 'otp.code': resetCode });
    }
    if (!user) {
      throw new AppError('No account found for this reset request', 404);
    }

    if (
      !user.otp?.code ||
      user.otp.code !== resetCode ||
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

  async sendPasswordOtp(user) {
    if (!user) {
      throw new AppError('Unauthorized: User not found', 401);
    }
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }

    const previousOtp = freshUser.otp ? { code: freshUser.otp.code, expiresAt: freshUser.otp.expiresAt } : null;
    const otpChallenge = generateOtpChallenge();
    freshUser.otp = otpChallenge;
    await freshUser.save();

    const purpose = freshUser.password ? 'change your account password' : 'set up a password for your account';

    try {
      await this.mailer.sendOtpEmail({
        to: freshUser.email,
        name: freshUser.name,
        code: otpChallenge.code,
        purpose
      });
    } catch (mailError) {
      freshUser.otp = previousOtp || { code: '', expiresAt: null };
      await freshUser.save();
      console.error('[PASSWORD OTP MAIL ERROR]:', mailError.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] OTP Code for ${freshUser.email}:`, otpChallenge.code);
      }
      throw new AppError('Failed to send verification code email. Please try again.', 500);
    }

    return true;
  }

  async updatePasswordWithOtp(user, { otp, newPassword }) {
    if (!user) {
      throw new AppError('Unauthorized: User not found', 401);
    }
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }

    const code = String(otp || '').trim();
    if (
      !freshUser.otp?.code ||
      freshUser.otp.code !== code ||
      !freshUser.otp.expiresAt ||
      new Date() > freshUser.otp.expiresAt
    ) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    freshUser.password = newPassword;
    freshUser.otp.code = '';
    freshUser.otp.expiresAt = null;
    await freshUser.save();

    return publicUserPayload(freshUser, freshUser._id);
  }

  async requestEmailChange(user, { newEmail }) {
    if (!user?._id) {
      throw new AppError('Unauthorized: User not found', 401);
    }

    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }
    if (!freshUser.isVerified) {
      throw new AppError('Verify your current email before changing it', 403);
    }

    const normalizedEmail = String(newEmail || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail === freshUser.email) {
      throw new AppError('Enter a different email address', 400);
    }
    if (await User.exists({ email: normalizedEmail, _id: { $ne: freshUser._id } })) {
      throw new AppError('That email address is already in use', 409);
    }

    const challenge = generateOtpChallenge();
    freshUser.emailChange = {
      pendingEmail: normalizedEmail,
      currentOtpHash: hashEmailChangeOtp(challenge.code),
      currentOtpExpiresAt: challenge.expiresAt,
      newOtpHash: '',
      newOtpExpiresAt: null,
      currentVerifiedAt: null
    };
    await freshUser.save();

    try {
      await this.mailer.sendOtpEmail({
        to: freshUser.email,
        name: freshUser.name,
        code: challenge.code,
        purpose: 'authorize changing your account email'
      });
    } catch (mailError) {
      freshUser.emailChange = undefined;
      await freshUser.save();
      console.error('[EMAIL CHANGE OTP ERROR]:', mailError.message);
      throw new AppError('Could not send verification code to your current email', 500);
    }

    return { pendingEmail: normalizedEmail, step: 'verify_current' };
  }

  async verifyCurrentEmailChange(user, { otp }) {
    const freshUser = await User.findById(user?._id);
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }

    const emailChange = freshUser.emailChange;
    if (
      !emailChange?.pendingEmail ||
      !emailChange.currentOtpHash ||
      !matchesEmailChangeOtp(emailChange.currentOtpHash, otp) ||
      !emailChange.currentOtpExpiresAt ||
      new Date() > emailChange.currentOtpExpiresAt
    ) {
      throw new AppError('Invalid or expired current-email verification code', 400);
    }

    if (await User.exists({ email: emailChange.pendingEmail, _id: { $ne: freshUser._id } })) {
      freshUser.emailChange = undefined;
      await freshUser.save();
      throw new AppError('That email address is already in use', 409);
    }

    const challenge = generateOtpChallenge();
    emailChange.currentOtpHash = '';
    emailChange.currentOtpExpiresAt = null;
    emailChange.currentVerifiedAt = new Date();
    emailChange.newOtpHash = hashEmailChangeOtp(challenge.code);
    emailChange.newOtpExpiresAt = challenge.expiresAt;
    await freshUser.save();

    try {
      await this.mailer.sendOtpEmail({
        to: emailChange.pendingEmail,
        name: freshUser.name,
        code: challenge.code,
        purpose: 'verify your new account email'
      });
    } catch (mailError) {
      emailChange.newOtpHash = '';
      emailChange.newOtpExpiresAt = null;
      await freshUser.save();
      console.error('[NEW EMAIL VERIFICATION ERROR]:', mailError.message);
      throw new AppError('Could not send verification code to the new email address', 500);
    }

    return { pendingEmail: emailChange.pendingEmail, step: 'verify_new' };
  }

  async resendEmailChangeCode(user) {
    const freshUser = await User.findById(user?._id);
    if (!freshUser?.emailChange?.pendingEmail) {
      throw new AppError('Start an email change request first', 400);
    }

    const emailChange = freshUser.emailChange;
    const verifyNewAddress = Boolean(emailChange.currentVerifiedAt);
    const challenge = generateOtpChallenge();
    if (verifyNewAddress) {
      emailChange.newOtpHash = hashEmailChangeOtp(challenge.code);
      emailChange.newOtpExpiresAt = challenge.expiresAt;
    } else {
      emailChange.currentOtpHash = hashEmailChangeOtp(challenge.code);
      emailChange.currentOtpExpiresAt = challenge.expiresAt;
    }
    await freshUser.save();

    try {
      await this.mailer.sendOtpEmail({
        to: verifyNewAddress ? emailChange.pendingEmail : freshUser.email,
        name: freshUser.name,
        code: challenge.code,
        purpose: verifyNewAddress
          ? 'verify your new account email'
          : 'authorize changing your account email'
      });
    } catch (mailError) {
      if (verifyNewAddress) {
        emailChange.newOtpHash = '';
        emailChange.newOtpExpiresAt = null;
      } else {
        emailChange.currentOtpHash = '';
        emailChange.currentOtpExpiresAt = null;
      }
      await freshUser.save();
      console.error('[EMAIL CHANGE OTP RESEND ERROR]:', mailError.message);
      throw new AppError('Could not resend the verification code', 500);
    }

    return { step: verifyNewAddress ? 'verify_new' : 'verify_current' };
  }

  async verifyNewEmailChange(user, { otp }) {
    const freshUser = await User.findById(user?._id);
    if (!freshUser) {
      throw new AppError('User not found', 404);
    }

    const emailChange = freshUser.emailChange;
    if (
      !emailChange?.pendingEmail ||
      !emailChange.currentVerifiedAt ||
      !emailChange.newOtpHash ||
      !matchesEmailChangeOtp(emailChange.newOtpHash, otp) ||
      !emailChange.newOtpExpiresAt ||
      new Date() > emailChange.newOtpExpiresAt
    ) {
      throw new AppError('Invalid or expired new-email verification code', 400);
    }
    if (await User.exists({ email: emailChange.pendingEmail, _id: { $ne: freshUser._id } })) {
      throw new AppError('That email address is already in use', 409);
    }

    const previousEmail = freshUser.email;
    freshUser.email = emailChange.pendingEmail;
    freshUser.isVerified = true;
    freshUser.emailChange = undefined;
    try {
      await freshUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError('That email address is already in use', 409);
      }
      throw error;
    }

    try {
      await this.mailer.sendEmailChangeNotice({
        to: previousEmail,
        name: freshUser.name,
        newEmail: freshUser.email
      });
    } catch (mailError) {
      console.error('[EMAIL CHANGE NOTICE ERROR]:', mailError.message);
    }

    return publicUserPayload(freshUser, freshUser._id);
  }

  async adminChangeSecretKey(adminUser, { currentPassword, newSecretKey }) {
    if (!adminUser || String(adminUser.role || '').toLowerCase() !== 'admin') {
      throw new AppError('Access denied: Administrator privileges required', 403);
    }

    const userInDb = await User.findById(adminUser._id);
    if (!userInDb) {
      throw new AppError('Administrator account not found', 404);
    }

    const isMatch = await userInDb.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Invalid administrator password', 401);
    }

    const cleanKey = String(newSecretKey || '').trim();
    if (!cleanKey || cleanKey.length < 6) {
      throw new AppError('New secret key must be at least 6 characters long', 400);
    }

    await SystemSetting.findOneAndUpdate(
      { key: 'admin_secret_key' },
      { key: 'admin_secret_key', value: cleanKey, updatedBy: userInDb._id },
      { upsert: true, new: true }
    );

    setCachedAdminSecretKey(cleanKey);
    return true;
  }


  async verifyAdminKeyAndLogin(res, reqUser, { email, username, password, key, adminKey, secretKey } = {}) {
    let user = reqUser;
    const providedKey = String(key || adminKey || secretKey || '').trim();
    const configuredKey = await getEffectiveAdminSecretKey();

    if (!providedKey || providedKey !== configuredKey) {
      throw new AppError('Access denied: Invalid administrator secret key', 403);
    }

    const identifier = String(username || email || '').trim().toLowerCase();
    const providedPassword = String(password || '');

    if (identifier && providedPassword) {
      const candidateUser = await User.findOne({
        $or: [
          { email: identifier },
          { username: identifier }
        ]
      });

      if (!candidateUser) {
        throw new AppError('Access denied: Administrator account not found', 404);
      }

      const isMatch = await candidateUser.comparePassword(providedPassword);
      if (!isMatch) {
        throw new AppError('Access denied: Invalid administrator password', 401);
      }

      if (String(candidateUser.role || '').toLowerCase() !== 'admin') {
        throw new AppError('Access denied: Account does not have administrator privileges', 403);
      }

      user = candidateUser;
    } else if (!user) {
      user = await User.findOne({
        $or: [
          { role: { $regex: /^admin$/i } },
          { email: process.env.ADMIN_EMAIL || 'admin@orbitus.com' }
        ]
      }).select('-password');
    }

    if (!user || String(user.role || '').toLowerCase() !== 'admin') {
      throw new AppError('Access denied: invalid administrator key or credentials', 403);
    }

    const { accessToken, dailyReward } = await this.issueSession(res, user);
    const userData = publicUserPayload(user);

    return { token: accessToken, user: userData, dailyReward };
  }
}

export const authService = new AuthService();

import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../shared/http/async-handler.js';
import { ApiResponse } from '../../shared/http/api-response.js';
import { getJwtSecret } from '../../config/env.js';
import {
  authService,
  publicUserPayload
} from './auth.service.js';
import {
  oauthConfig,
  getFrontendUrl,
  getBackendUrl,
  buildAuthorizationUrl,
  fetchOAuthProfile,
  sanitizeAndValidateOrigin
} from '../../services/oauthService.js';
import User from '../../models/User.js';
import { buildUsernameFromName } from './auth.service.js';
import { activityService } from '../../services/activityService.js';

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  registerUser = asyncHandler(async (req, res) => {
    const result = await this.service.registerUser(req.body);
    return res.status(201).json(
      new ApiResponse(201, result, 'Registration successful! Verification OTP sent to your email.')
    );
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const result = await this.service.verifyOtp(res, req.body);
    return res.status(200).json(
      new ApiResponse(200, result, 'Email verified successfully!')
    );
  });

  loginUser = asyncHandler(async (req, res) => {
    const result = await this.service.loginUser(res, req.body);
    return res.status(200).json(
      new ApiResponse(200, result, 'Login successful')
    );
  });

  refreshTokens = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await this.service.refreshTokens(res, token);
    return res.status(200).json(
      new ApiResponse(200, result, 'Token refreshed')
    );
  });

  logoutUser = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await this.service.logoutUser(res, token);
    return res.status(200).json(
      new ApiResponse(200, null, 'Logged out successfully')
    );
  });

  forgotPassword = asyncHandler(async (req, res) => {
    await this.service.forgotPassword(req.body);
    return res.status(200).json(
      new ApiResponse(200, null, 'Password recovery OTP code dispatched to email.')
    );
  });

  resetPassword = asyncHandler(async (req, res) => {
    await this.service.resetPassword(req.body);
    return res.status(200).json(
      new ApiResponse(200, null, 'Password reset successfully! You can now log in.')
    );
  });

  startOAuth = asyncHandler(async (req, res) => {
    const provider = req.params.provider;

    let rawOrigin = req.query.origin;
    if (!rawOrigin && req.headers?.referer) {
      try {
        rawOrigin = new URL(req.headers.referer).origin;
      } catch {}
    }
    const clientOrigin = sanitizeAndValidateOrigin(rawOrigin);

    const authData = buildAuthorizationUrl(provider, { clientOrigin, req });
    if (!authData) {
      const fallbackFrontend = sanitizeAndValidateOrigin(clientOrigin);
      return res.redirect(`${fallbackFrontend}/login?oauth=${provider}&error=missing_config`);
    }

    return res.redirect(authData.authRedirectUrl);
  });

  handleOAuthCallback = asyncHandler(async (req, res) => {
    const provider = req.params.provider;
    const config = oauthConfig[provider];
    const code = req.query.code;
    const state = req.query.state;

    let targetFrontendUrl = getFrontendUrl();

    if (!config || !code) {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider || 'unknown'}&error=oauth_failed`);
    }

    let decodedState;
    try {
      decodedState = jwt.verify(state, getJwtSecret());
      if (decodedState.provider !== provider || decodedState.purpose !== 'oauth_state') {
        throw new Error('OAuth state provider mismatch');
      }
      if (decodedState.clientOrigin) {
        targetFrontendUrl = sanitizeAndValidateOrigin(decodedState.clientOrigin);
      }
    } catch {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=invalid_state`);
    }

    const redirectUri =
      decodedState.redirectUri || `${getBackendUrl(req)}/api/auth/oauth/${provider}/callback`;

    const tokenBody = new URLSearchParams({
      client_id: config.clientId(),
      client_secret: config.clientSecret(),
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    let tokenRes;
    try {
      tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenBody.toString(),
        signal: AbortSignal.timeout(10000)
      });
    } catch {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=network_error`);
    }

    let tokenPayload = {};
    try {
      tokenPayload = await tokenRes.json();
    } catch {
      tokenPayload = {};
    }

    if (!tokenRes.ok || !tokenPayload.access_token) {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=token_exchange_failed`);
    }

    let profile;
    try {
      profile = await fetchOAuthProfile(provider, tokenPayload.access_token);
    } catch {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=profile_fetch_failed`);
    }

    if (!profile.email) {
      return res.redirect(`${targetFrontendUrl}/login?oauth=${provider}&error=email_unavailable`);
    }

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
        profileImage:
          profile.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff`,
        followersCount: 0,
        followingCount: 0,
        points: 0
      });
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

    const { accessToken } = await this.service.issueSession(res, user);
    return res.redirect(
      `${targetFrontendUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(publicUserPayload(user, user._id)))}`
    );
  });

  verifyAdminKeyAndLogin = asyncHandler(async (req, res) => {
    const params = { ...req.query, ...req.body };
    const result = await this.service.verifyAdminKeyAndLogin(res, req.user, params);
    return res.status(200).json({
      success: true,
      message: 'Admin access verified successfully',
      token: result.token,
      accessToken: result.token,
      user: result.user,
      data: {
        token: result.token,
        accessToken: result.token,
        user: result.user
      }
    });
  });
}

export const authController = new AuthController();
export const {
  registerUser,
  verifyOtp,
  loginUser,
  refreshTokens,
  logoutUser,
  forgotPassword,
  resetPassword,
  startOAuth,
  handleOAuthCallback,
  verifyAdminKeyAndLogin
} = authController;

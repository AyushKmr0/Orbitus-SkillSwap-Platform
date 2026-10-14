import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/env.js';

export const oauthConfig = {
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

export const getAllowedFrontendOrigins = () => {
  const allowed = new Set([
    'https://orbitus-skill-swap-platform.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000'
  ]);

  if (process.env.FRONTEND_URL) {
    try {
      allowed.add(new URL(process.env.FRONTEND_URL).origin);
    } catch {
      allowed.add(process.env.FRONTEND_URL.replace(/\/$/, ''));
    }
  }

  if (process.env.FRONTEND_URLS) {
    process.env.FRONTEND_URLS.split(',').forEach((url) => {
      const trimmed = url.trim();
      if (trimmed) {
        try {
          allowed.add(new URL(trimmed).origin);
        } catch {
          allowed.add(trimmed.replace(/\/$/, ''));
        }
      }
    });
  }

  return allowed;
};

export const sanitizeAndValidateOrigin = (candidateOrigin) => {
  if (!candidateOrigin || typeof candidateOrigin !== 'string') {
    return getFrontendUrl();
  }

  try {
    const parsed = new URL(candidateOrigin).origin;
    const allowed = getAllowedFrontendOrigins();
    if (allowed.has(parsed)) {
      return parsed;
    }

    const isDevOrLocalAllowed = process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_ORIGINS === 'true';
    if (isDevOrLocalAllowed && /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(parsed)) {
      return parsed;
    }
  } catch {
    // Malformed candidate origin
  }

  return getFrontendUrl();
};

export const getFrontendUrl = () => (process.env.FRONTEND_URL || 'https://orbitus-skill-swap-platform.vercel.app').replace(/\/$/, '');

export const getBackendUrl = (req) => {
  const base = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return base.replace(/\/$/, '');
};

export const buildAuthorizationUrl = (provider, { clientOrigin, req }) => {
  const config = oauthConfig[provider];
  if (!config || !config.clientId() || !config.clientSecret()) {
    return null;
  }

  const effectiveFrontendUrl = sanitizeAndValidateOrigin(clientOrigin);
  const redirectUri = `${getBackendUrl(req)}/api/auth/oauth/${provider}/callback`;
  const state = jwt.sign(
    { provider, purpose: 'oauth_state', clientOrigin: effectiveFrontendUrl, redirectUri },
    getJwtSecret(),
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

  return {
    authRedirectUrl: `${config.authUrl}?${params.toString()}`,
    redirectUri,
    effectiveFrontendUrl
  };
};

export const exchangeCodeForToken = async (provider, code, redirectUri) => {
  const config = oauthConfig[provider];
  if (!config) throw new Error('Unsupported provider');

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
    body: tokenBody.toString(),
    signal: AbortSignal.timeout(10000)
  });

  let tokenPayload = {};
  try {
    tokenPayload = await tokenRes.json();
  } catch {
    tokenPayload = {};
  }

  if (!tokenRes.ok || !tokenPayload.access_token) {
    const error = new Error('Token exchange rejected by provider');
    error.stage = 'token_exchange';
    error.status = tokenRes.status;
    error.payload = tokenPayload;
    throw error;
  }

  return tokenPayload;
};

export const fetchOAuthProfile = async (provider, accessToken) => {
  const config = oauthConfig[provider];
  let profileRes;
  try {
    profileRes = await fetch(config.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
  } catch (err) {
    const error = new Error(`${provider} profile network error`);
    error.stage = 'profile_fetch';
    error.cause = err;
    throw error;
  }

  if (!profileRes.ok) {
    const error = new Error(`${provider} profile request failed with status ${profileRes.status}`);
    error.stage = 'profile_fetch';
    error.status = profileRes.status;
    throw error;
  }

  const profile = await profileRes.json();

  if (provider === 'github' && !profile.email) {
    try {
      const emailsRes = await fetch(config.emailUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      const emails = emailsRes.ok ? await emailsRes.json() : [];
      profile.email = emails.find((email) => email.primary && email.verified)?.email || emails.find((email) => email.verified)?.email;
    } catch {
      // Ignore secondary email fetch error
    }
  }

  return {
    providerId: String(profile.id || profile.sub),
    email: profile.email,
    name: profile.name || profile.login || (profile.email ? profile.email.split('@')[0] : 'Orbitus User'),
    avatar: profile.picture || profile.avatar_url || ''
  };
};

export const findOrCreateOAuthUser = async (provider, profile) => {
  let user = await User.findOne({
    $or: [
      { email: profile.email.toLowerCase() },
      { authProvider: provider, providerId: profile.providerId }
    ]
  }).populate('skillsTeach.skill skillsLearn.skill');

  if (!user) {
    user = await User.create({
      name: profile.name,
      email: profile.email.toLowerCase(),
      authProvider: provider,
      providerId: profile.providerId,
      profileImage: profile.avatar || '',
      isVerified: true
    });
    user = await User.findById(user._id).populate('skillsTeach.skill skillsLearn.skill');
  } else {
    let shouldSave = false;
    if (!user.authProvider || user.authProvider === 'local') {
      user.authProvider = provider;
      user.providerId = profile.providerId;
      shouldSave = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }
    if (!user.profileImage && profile.avatar) {
      user.profileImage = profile.avatar;
      shouldSave = true;
    }
    if (shouldSave) {
      await user.save();
    }
  }

  return user;
};

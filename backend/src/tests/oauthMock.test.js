import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { handleOAuthCallback } from '../modules/auth/auth.controller.js';
import User from '../models/User.js';
import { getJwtSecret } from '../config/env.js';

describe('OAuth Error Handling & Mocked Flow Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-google-client-secret';
    process.env.FRONTEND_URL = 'http://localhost:5173';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const generateValidState = (provider = 'google', redirectUri = 'http://localhost:5000/api/auth/oauth/google/callback') => {
    return jwt.sign(
      {
        provider,
        purpose: 'oauth_state',
        clientOrigin: 'http://localhost:5173',
        redirectUri
      },
      getJwtSecret(),
      { expiresIn: '10m' }
    );
  };

  it('should redirect with error=invalid_state when state JWT is invalid or tampered', async () => {
    const req = {
      params: { provider: 'google' },
      query: { code: 'test-auth-code', state: 'invalid.tampered.token' },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).toContain('error=invalid_state');
  });

  it('should redirect with error=network_error when token exchange throws fetch failed', async () => {
    const validState = generateValidState();

    // Mock fetch throwing native Node.js TypeError: fetch failed
    const networkError = new TypeError('fetch failed');
    networkError.cause = { code: 'ENOTFOUND' };
    global.fetch = vi.fn().mockRejectedValue(networkError);

    const req = {
      params: { provider: 'google' },
      query: { code: 'test-auth-code', state: validState },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).toContain('error=network_error');
    expect(redirectedUrl).toContain('oauth=google');
  });

  it('should redirect with error=token_exchange_failed when Google responds with 400 invalid_grant', async () => {
    const validState = generateValidState();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        error: 'invalid_grant',
        error_description: 'Bad Request'
      })
    });

    const req = {
      params: { provider: 'google' },
      query: { code: 'expired-or-bad-code', state: validState },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).toContain('error=token_exchange_failed');
  });

  it('should redirect with error=profile_fetch_failed when profile fetch fails with network error', async () => {
    const validState = generateValidState();

    // Token exchange succeeds
    const tokenResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        access_token: 'mock-valid-access-token',
        expires_in: 3600
      })
    };

    // Profile request throws fetch failed
    const profileNetworkError = new TypeError('fetch failed');
    profileNetworkError.cause = { code: 'ECONNRESET' };

    global.fetch = vi.fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockRejectedValueOnce(profileNetworkError);

    const req = {
      params: { provider: 'google' },
      query: { code: 'test-auth-code', state: validState },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).toContain('error=profile_fetch_failed');
  });

  it('should redirect with tokens when token exchange and profile fetch succeed', async () => {
    const validState = generateValidState();

    // 1. Mock token response
    const tokenResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        access_token: 'mock-valid-access-token',
        expires_in: 3600
      })
    };

    // 2. Mock profile response
    const profileResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 'google-uid-12345',
        email: 'user@example.com',
        name: 'OAuth User',
        picture: 'https://example.com/avatar.jpg'
      })
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(profileResponse);

    const mockUser = {
      _id: '65f123456789abcdef123456',
      name: 'OAuth User',
      username: 'oauthuser',
      email: 'user@example.com',
      authProvider: 'google',
      providerId: 'google-uid-12345',
      points: 10,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findOne').mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockUser)
    });

    const req = {
      params: { provider: 'google' },
      query: { code: 'valid-auth-code', state: validState },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      cookie: vi.fn(),
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).toContain('/auth/callback?accessToken=');
    expect(redirectedUrl).toContain('user=');
  });
});

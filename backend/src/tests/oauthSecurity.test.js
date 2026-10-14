import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  getAllowedFrontendOrigins,
  sanitizeAndValidateOrigin,
  buildAuthorizationUrl,
  getFrontendUrl
} from '../services/oauthService.js';
import { handleOAuthCallback } from '../modules/auth/auth.controller.js';
import { getJwtSecret } from '../config/env.js';

describe('OAuth Open Redirect Prevention & Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://orbitus-skill-swap-platform.vercel.app';
    process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'mock-google-client-secret';
    delete process.env.FRONTEND_URLS;
  });

  it('should include default trusted origins in getAllowedFrontendOrigins', () => {
    const allowed = getAllowedFrontendOrigins();
    expect(allowed.has('https://orbitus-skill-swap-platform.vercel.app')).toBe(true);
    expect(allowed.has('http://localhost:5173')).toBe(true);
    expect(allowed.has('http://localhost:3000')).toBe(true);
  });

  it('should parse additional origins from FRONTEND_URLS environment variable', () => {
    process.env.FRONTEND_URLS = 'https://staging.orbitus.app, https://preview.orbitus.app/';
    const allowed = getAllowedFrontendOrigins();
    expect(allowed.has('https://staging.orbitus.app')).toBe(true);
    expect(allowed.has('https://preview.orbitus.app')).toBe(true);
  });

  it('should allow legitimate frontend origins in sanitizeAndValidateOrigin', () => {
    expect(sanitizeAndValidateOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(sanitizeAndValidateOrigin('https://orbitus-skill-swap-platform.vercel.app')).toBe('https://orbitus-skill-swap-platform.vercel.app');
  });

  it('should reject hostile/untrusted origins and fallback to canonical frontend URL', () => {
    const canonical = getFrontendUrl();
    expect(sanitizeAndValidateOrigin('https://evil-phishing-site.com')).toBe(canonical);
    expect(sanitizeAndValidateOrigin('http://attacker.com/steal-token')).toBe(canonical);
    expect(sanitizeAndValidateOrigin('javascript:alert(1)')).toBe(canonical);
    expect(sanitizeAndValidateOrigin('')).toBe(canonical);
    expect(sanitizeAndValidateOrigin(null)).toBe(canonical);
    expect(sanitizeAndValidateOrigin(undefined)).toBe(canonical);
    expect(sanitizeAndValidateOrigin('not-a-valid-url')).toBe(canonical);
  });

  it('buildAuthorizationUrl should sanitize clientOrigin before creating signed state', () => {
    const req = {
      protocol: 'https',
      get: () => 'api.orbitus.app'
    };

    const hostileAttempt = buildAuthorizationUrl('google', {
      clientOrigin: 'https://evil.phishing.attacker.com',
      req
    });

    expect(hostileAttempt).not.toBeNull();
    expect(hostileAttempt.effectiveFrontendUrl).toBe(getFrontendUrl());

    const decoded = jwt.verify(
      new URL(hostileAttempt.authRedirectUrl).searchParams.get('state'),
      getJwtSecret()
    );
    expect(decoded.clientOrigin).toBe(getFrontendUrl());
    expect(decoded.clientOrigin).not.toContain('evil');
  });

  it('handleOAuthCallback should sanitize origin from state JWT and never redirect to hostile domain', async () => {
    // Malicious token that bypassed earlier check or crafted externally with secret
    const maliciousState = jwt.sign(
      {
        provider: 'google',
        purpose: 'oauth_state',
        clientOrigin: 'https://evil.attacker.com',
        redirectUri: 'http://localhost:5000/api/auth/oauth/google/callback'
      },
      getJwtSecret(),
      { expiresIn: '10m' }
    );

    const req = {
      params: { provider: 'google' },
      query: { code: 'test-code', state: maliciousState },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    let redirectedUrl = '';
    const res = {
      redirect: (url) => {
        redirectedUrl = url;
      }
    };

    // Mock fetch error to trigger redirect early with error
    global.fetch = vi.fn().mockRejectedValue(new Error('Simulated fetch failure'));

    await handleOAuthCallback(req, res);

    expect(redirectedUrl).not.toContain('evil.attacker.com');
    expect(redirectedUrl.startsWith(getFrontendUrl())).toBe(true);
  });
});

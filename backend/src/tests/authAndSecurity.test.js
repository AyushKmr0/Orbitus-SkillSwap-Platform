import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireRole } from '../middlewares/authMiddleware.js';
import { getJwtSecret } from '../config/env.js';
import { objectIdSchema, paginationQuerySchema } from '../shared/index.js';
import { encryptText, decryptText } from '../utils/encryption.js';

describe('Orbitus Security & Auth Middleware Tests', () => {
  it('should enforce role-based access control for Admin role', () => {
    const middleware = requireRole('Admin');
    const req = { user: { role: 'User' } };
    const res = { status: () => ({ json: () => {} }) };
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
  });

  it('should sign and verify valid JWT tokens correctly', () => {
    const payload = { id: '6abc45dad3eed89a11585fa7', role: 'Admin' };
    const secret = getJwtSecret();

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
  });

  it('should reject invalid or expired JWT tokens', () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ id: '123' }, 'different_secret', { expiresIn: '1h' });

    expect(() => jwt.verify(token, secret)).toThrow();
  });

  it('should encrypt and decrypt custom AI key strings at rest', () => {
    const rawApiKey = 'AIzaSyD-1234567890abcdefghijklmnopqrst';
    const encrypted = encryptText(rawApiKey);

    expect(encrypted).not.toBe(rawApiKey);
    expect(encrypted.startsWith('enc:')).toBe(true);

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(rawApiKey);
  });

  it('should handle unencrypted legacy fallback strings safely', () => {
    const legacyPlaintext = 'legacy_api_key_123';
    expect(decryptText(legacyPlaintext)).toBe(legacyPlaintext);
  });
});

describe('Orbitus Validation Middleware Tests', () => {
  it('should validate 24-character hex MongoDB ObjectIds', () => {
    const validId = '6abc45dad3eed89a11585fa7';
    const invalidId = 'invalid-123-id';

    expect(objectIdSchema.safeParse(validId).success).toBe(true);
    expect(objectIdSchema.safeParse(invalidId).success).toBe(false);
  });

  it('should parse and sanitize pagination query parameters', () => {
    const parsed = paginationQuerySchema.parse({ page: '2', limit: '50' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);

    const boundedMax = paginationQuerySchema.parse({ page: '-5', limit: '500' });
    expect(boundedMax.page).toBe(1);
    expect(boundedMax.limit).toBe(100);
  });
});

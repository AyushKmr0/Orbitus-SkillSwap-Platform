import { describe, it, expect, vi } from 'vitest';
import { AuthService, normalizeUsername, generateOtpChallenge } from '../modules/auth/auth.service.js';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../modules/auth/auth.schema.js';

describe('Auth Domain & Schemas', () => {
  it('validates correct registration payload', () => {
    const valid = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123'
      }
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short passwords in registration', () => {
    const invalid = {
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short'
      }
    };
    expect(registerSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates 6-digit OTP schema', () => {
    expect(verifyOtpSchema.safeParse({ body: { email: 'jane@example.com', otp: '123456' } }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ body: { email: 'jane@example.com', otp: '123' } }).success).toBe(false);
  });

  it('normalizes username string appropriately', () => {
    expect(normalizeUsername('  Jane.Doe-123! ')).toBe('janedoe123');
  });

  it('validates login, forgot password, and reset password schemas', () => {
    expect(loginSchema.safeParse({ body: { email: 'jane@example.com', password: 'Password123' } }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ body: { email: 'jane@example.com' } }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ body: { token: 'tok123', newPassword: 'Password123' } }).success).toBe(true);
  });

  it('generates 6-digit otp challenge with expiry', () => {
    const challenge = generateOtpChallenge();
    expect(challenge.code).toMatch(/^\d{6}$/);
    expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws error if user attempts login with unverified email', async () => {
    const mockRepo = {};
    const service = new AuthService(mockRepo);
    const mockUser = {
      email: 'unverified@example.com',
      isVerified: false
    };

    // We can directly mock User.findOne
    const User = (await import('../models/User.js')).default;
    vi.spyOn(User, 'findOne').mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockUser)
    });

    await expect(
      service.loginUser({}, { email: 'unverified@example.com', password: 'Password123' })
    ).rejects.toThrow('Please verify your email before logging in');
  });
});

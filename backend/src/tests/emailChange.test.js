import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import User from '../models/User.js';
import { AuthService, hashEmailChangeOtp } from '../modules/auth/auth.service.js';
import {
  emailChangeOtpSchema,
  emailChangeRequestSchema
} from '../modules/auth/auth.schema.js';
import { activityService } from '../services/activityService.js';

const makeUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'old@example.com',
  isVerified: true,
  role: 'User',
  followers: [],
  emailChange: {},
  save: vi.fn().mockResolvedValue(true),
  ...overrides
});

const makeMailer = () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailChangeNotice: vi.fn().mockResolvedValue(undefined)
});

describe('Verified email change flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates new email and six-digit verification codes', () => {
    expect(emailChangeRequestSchema.safeParse({
      body: { newEmail: 'new@example.com' }
    }).success).toBe(true);
    expect(emailChangeRequestSchema.safeParse({
      body: { newEmail: 'not-an-email' }
    }).success).toBe(false);
    expect(emailChangeOtpSchema.safeParse({ body: { otp: '123456' } }).success).toBe(true);
    expect(emailChangeOtpSchema.safeParse({ body: { otp: '123' } }).success).toBe(false);
  });

  it('accepts the registered email OTP payload and completes verification', async () => {
    const user = makeUser({
      isVerified: false,
      points: 10,
      otp: {
        code: '654321',
        expiresAt: new Date(Date.now() + 60_000)
      }
    });
    const repo = { findUserByEmailWithoutPassword: vi.fn().mockResolvedValue(user) };
    vi.spyOn(activityService, 'recordDailyLogin').mockResolvedValue({
      awarded: true,
      pointsAwarded: 10,
      totalPoints: 20
    });
    const response = await new AuthService(repo, makeMailer()).verifyOtp(
      { cookie: vi.fn() },
      { email: user.email, otp: '654321' }
    );

    expect(user.isVerified).toBe(true);
    expect(user.otp.code).toBe('');
    expect(response.dailyReward.totalPoints).toBe(20);
    expect(response.user.email).toBe(user.email);
  });

  it('returns the daily points reward and updated streak from password login', async () => {
    const user = makeUser({
      points: 50,
      streak: 2,
      timezone: 'Asia/Kolkata',
      comparePassword: vi.fn().mockResolvedValue(true)
    });
    vi.spyOn(User, 'findOne').mockResolvedValue(user);
    const loginReward = vi.spyOn(activityService, 'recordDailyLogin').mockResolvedValue({
      awarded: true,
      pointsAwarded: 10,
      totalPoints: 60,
      streak: 3
    });

    const response = await new AuthService({}, makeMailer()).loginUser(
      { cookie: vi.fn() },
      { email: user.email, password: 'Password123' }
    );

    expect(loginReward).toHaveBeenCalledWith({
      userId: user._id,
      timeZone: 'Asia/Kolkata'
    });
    expect(response.dailyReward).toEqual({
      awarded: true,
      pointsAwarded: 10,
      totalPoints: 60,
      streak: 3
    });
    expect(response.user).toMatchObject({ points: 60, streak: 3 });
  });

  it('sends the first verification code to the current address', async () => {
    const user = makeUser();
    const mailer = makeMailer();
    vi.spyOn(User, 'findById').mockResolvedValue(user);
    vi.spyOn(User, 'exists').mockResolvedValue(false);

    const result = await new AuthService({}, mailer).requestEmailChange(
      { _id: user._id },
      { newEmail: '  NEW@example.com ' }
    );

    expect(result).toEqual({ pendingEmail: 'new@example.com', step: 'verify_current' });
    expect(user.emailChange.pendingEmail).toBe('new@example.com');
    expect(mailer.sendOtpEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'old@example.com',
      purpose: 'authorize changing your account email'
    }));
  });

  it('requires current-address verification before sending the new-address code', async () => {
    const mailer = makeMailer();
    const user = makeUser({
      emailChange: {
        pendingEmail: 'new@example.com',
        currentOtpHash: hashEmailChangeOtp('654321'),
        currentOtpExpiresAt: new Date(Date.now() + 60_000),
        newOtpHash: '',
        newOtpExpiresAt: null,
        currentVerifiedAt: null
      }
    });
    vi.spyOn(User, 'findById').mockResolvedValue(user);
    vi.spyOn(User, 'exists').mockResolvedValue(false);

    const result = await new AuthService({}, mailer).verifyCurrentEmailChange(
      { _id: user._id },
      { otp: '654321' }
    );

    expect(result).toEqual({ pendingEmail: 'new@example.com', step: 'verify_new' });
    expect(user.emailChange.currentVerifiedAt).toBeInstanceOf(Date);
    expect(user.emailChange.currentOtpHash).toBe('');
    expect(mailer.sendOtpEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'new@example.com',
      purpose: 'verify your new account email'
    }));
  });

  it('changes the address only after the new address code is valid and notifies the old address', async () => {
    const mailer = makeMailer();
    const user = makeUser({
      emailChange: {
        pendingEmail: 'new@example.com',
        currentVerifiedAt: new Date(),
        newOtpHash: hashEmailChangeOtp('123456'),
        newOtpExpiresAt: new Date(Date.now() + 60_000)
      }
    });
    vi.spyOn(User, 'findById').mockResolvedValue(user);
    vi.spyOn(User, 'exists').mockResolvedValue(false);

    const updatedUser = await new AuthService({}, mailer).verifyNewEmailChange(
      { _id: user._id },
      { otp: '123456' }
    );

    expect(user.email).toBe('new@example.com');
    expect(updatedUser.email).toBe('new@example.com');
    expect(user.emailChange).toBeUndefined();
    expect(mailer.sendEmailChangeNotice).toHaveBeenCalledWith({
      to: 'old@example.com',
      name: 'Test User',
      newEmail: 'new@example.com'
    });
  });

  it('rejects expired verification codes without changing the registered email', async () => {
    const mailer = makeMailer();
    const user = makeUser({
      emailChange: {
        pendingEmail: 'new@example.com',
        currentVerifiedAt: new Date(),
        newOtpHash: hashEmailChangeOtp('123456'),
        newOtpExpiresAt: new Date(Date.now() - 60_000)
      }
    });
    vi.spyOn(User, 'findById').mockResolvedValue(user);
    vi.spyOn(User, 'exists').mockResolvedValue(false);

    await expect(new AuthService({}, mailer).verifyNewEmailChange(
      { _id: user._id },
      { otp: '123456' }
    )).rejects.toThrow('Invalid or expired new-email verification code');
    expect(user.email).toBe('old@example.com');
    expect(mailer.sendEmailChangeNotice).not.toHaveBeenCalled();
  });
});

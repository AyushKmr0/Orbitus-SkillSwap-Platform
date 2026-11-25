import { describe, expect, it, vi } from 'vitest';
import {
  getAdminPermissions,
  requireAdminPermission
} from '../middlewares/adminPermissions.js';
import { isAccountSuspended } from '../shared/auth/accountStatus.js';
import { getFeatureFlag } from '../config/featureFlags.js';
import {
  adminAuditQuerySchema,
  suspendAdminUserSchema,
  updateAdminUserAccessSchema,
  updateFeatureFlagSchema
} from '../modules/dashboard/dashboard.schema.js';
import {
  createModerationReportSchema,
  reviewModerationReportSchema
} from '../modules/moderation/moderation.schema.js';
import { ModerationService } from '../modules/moderation/moderation.service.js';
import ModerationReport from '../models/ModerationReport.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Granular administrator permissions', () => {
  it('grants built-in access profiles only their intended capabilities', () => {
    expect(getAdminPermissions({ role: 'Admin', adminAccessLevel: 'moderator' }))
      .toContain('moderation.manage');
    expect(getAdminPermissions({ role: 'Admin', adminAccessLevel: 'moderator' }))
      .not.toContain('users.manage');
    expect(getAdminPermissions({
      role: 'Admin',
      adminAccessLevel: 'custom',
      adminPermissions: ['audit.read']
    })).toEqual(['audit.read']);
    expect(getAdminPermissions({ role: 'User', adminAccessLevel: 'full' })).toEqual([]);
  });

  it('rejects custom admins without the requested permission', () => {
    const middleware = requireAdminPermission('system.manage');
    const req = { user: { role: 'Admin', adminAccessLevel: 'custom', adminPermissions: ['audit.read'] } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Admin upgrade validation', () => {
  it('requires explicit permissions for a custom administrator profile', () => {
    const params = { id: '507f1f77bcf86cd799439011' };
    expect(updateAdminUserAccessSchema.safeParse({
      params,
      body: { accessLevel: 'custom', permissions: ['audit.read'] }
    }).success).toBe(true);
    expect(updateAdminUserAccessSchema.safeParse({
      params,
      body: { accessLevel: 'custom' }
    }).success).toBe(false);
  });

  it('validates suspension, feature flag, audit and moderation inputs', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(suspendAdminUserSchema.safeParse({
      params: { id },
      body: { reason: 'Policy violation' }
    }).success).toBe(true);
    expect(updateFeatureFlagSchema.safeParse({
      params: { key: 'postsEnabled' },
      body: { enabled: false }
    }).success).toBe(true);
    expect(adminAuditQuerySchema.safeParse({ query: { page: '1', limit: '50' } }).success).toBe(true);
    expect(createModerationReportSchema.safeParse({
      body: { targetType: 'post', targetId: id, reason: 'spam' }
    }).success).toBe(true);
    expect(reviewModerationReportSchema.safeParse({
      params: { id },
      body: { decision: 'resolved', removeContent: true }
    }).success).toBe(true);
  });

  it('rejects unknown feature flags explicitly', async () => {
    await expect(getFeatureFlag('unknownFlag')).rejects.toThrow('Unknown feature flag');
  });
});

describe('Account suspension state', () => {
  it('blocks indefinite and unexpired suspensions but allows expired suspensions', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(isAccountSuspended({ suspendedAt: now, suspendedUntil: null }, now)).toBe(true);
    expect(isAccountSuspended({
      suspendedAt: now,
      suspendedUntil: new Date('2026-01-02T00:00:00.000Z')
    }, now)).toBe(true);
    expect(isAccountSuspended({
      suspendedAt: now,
      suspendedUntil: new Date('2025-12-31T23:59:59.000Z')
    }, now)).toBe(false);
    expect(isAccountSuspended({ suspendedAt: null }, now)).toBe(false);
  });

  it('blocks suspended accounts from logging in after valid credentials', async () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      isVerified: true,
      suspendedAt: new Date(),
      suspendedUntil: null,
      comparePassword: vi.fn().mockResolvedValue(true)
    };
    vi.spyOn(User, 'findOne').mockResolvedValue(user);

    await expect(new AuthService({}).loginUser({}, {
      email: 'suspended@example.com',
      password: 'valid-password'
    })).rejects.toThrow('Account suspended');

    expect(user.comparePassword).toHaveBeenCalledWith('valid-password');
    vi.restoreAllMocks();
  });
});

describe('Content moderation workflow', () => {
  it('prevents members from reporting their own posts', async () => {
    const targetQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ author: 'reporter-id' })
    };
    vi.spyOn(Post, 'findById').mockReturnValue(targetQuery);
    const createSpy = vi.spyOn(ModerationReport, 'create').mockResolvedValue({});

    await expect(new ModerationService().createReport('reporter-id', {
      targetType: 'post',
      targetId: '507f1f77bcf86cd799439011',
      reason: 'spam'
    })).rejects.toThrow('You cannot report your own content');

    expect(createSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('removes content only when a report is resolved with removal requested', async () => {
    const report = {
      _id: '507f1f77bcf86cd799439012',
      targetType: 'post',
      targetId: '507f1f77bcf86cd799439011',
      status: 'pending',
      save: vi.fn().mockResolvedValue(true)
    };
    vi.spyOn(ModerationReport, 'findById').mockResolvedValue(report);
    const removeSpy = vi.spyOn(Post, 'findByIdAndDelete').mockResolvedValue({});

    await new ModerationService().reviewReport('admin-id', report._id, {
      decision: 'resolved',
      removeContent: true,
      resolutionNote: 'Confirmed spam'
    });

    expect(removeSpy).toHaveBeenCalledWith(report.targetId);
    expect(report.status).toBe('resolved');
    expect(report.reviewedBy).toBe('admin-id');
    vi.restoreAllMocks();
  });
});

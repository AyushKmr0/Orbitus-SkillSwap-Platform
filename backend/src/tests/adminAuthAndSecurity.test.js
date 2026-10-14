import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../middlewares/authMiddleware.js';
import { getEncryptionKey } from '../config/env.js';

describe('Admin Authentication & RBAC Policy Tests', () => {
  it('should deny non-admin user with 403 status', () => {
    const middleware = requireRole('Admin');
    const req = { user: { _id: '123', role: 'User' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('administrator privileges required')
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow admin user to proceed regardless of role casing (Admin vs admin vs ADMIN)', () => {
    ['Admin', 'admin', 'ADMIN', ' Admin '].forEach((roleVariation) => {
      const middleware = requireRole('Admin');
      const req = { user: { _id: 'admin_123', role: roleVariation.trim() } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  it('should reject unauthenticated request with 401', () => {
    const middleware = requireRole('Admin');
    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Admin Schema Validation Tests', () => {
  it('should accept valid admin pagination queries including role filter', async () => {
    const { adminPaginationQuerySchema } = await import('../modules/dashboard/dashboard.schema.js');
    const parsed = adminPaginationQuerySchema.safeParse({
      query: {
        page: '2',
        limit: '15',
        search: 'alex',
        role: 'Admin'
      }
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data.query.role).toBe('Admin');
  });

  it('should allow admin pagination queries without role filter', async () => {
    const { adminPaginationQuerySchema } = await import('../modules/dashboard/dashboard.schema.js');
    const parsed = adminPaginationQuerySchema.safeParse({
      query: {
        page: '1',
        limit: '20'
      }
    });
    expect(parsed.success).toBe(true);
  });
});

describe('Admin Secret Key Validation Tests', () => {
  it('should authenticate admin user when secret master key matches', async () => {
    const { authService } = await import('../modules/auth/auth.service.js');
    const mockAdmin = {
      _id: 'admin_id_999',
      name: 'System Admin',
      email: 'admin@orbitus.com',
      role: 'Admin',
      points: 100,
      save: vi.fn().mockResolvedValue(true)
    };

    const User = (await import('../models/User.js')).default;
    const findOneSpy = vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue(mockAdmin)
    });

    const res = { cookie: vi.fn() };
    const result = await authService.verifyAdminKeyAndLogin(res, null, {
      key: process.env.ADMIN_SECRET_KEY || 'orbitus-v2-secret710'
    });

    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('admin@orbitus.com');
    findOneSpy.mockRestore();
  });

  it('should reject invalid admin secret master key', async () => {
    const { authService } = await import('../modules/auth/auth.service.js');
    const res = { cookie: vi.fn() };

    await expect(
      authService.verifyAdminKeyAndLogin(res, null, { key: 'invalid-secret-key-xyz' })
    ).rejects.toThrow('Access denied');
  });
});

describe('Production Environment Validation Tests', () => {
  it('should throw error when getEncryptionKey is called in production without ENCRYPTION_KEY', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalKey = process.env.ENCRYPTION_KEY;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ENCRYPTION_KEY;

      expect(() => getEncryptionKey()).toThrow('ENCRYPTION_KEY must be set in production environment');
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalKey) process.env.ENCRYPTION_KEY = originalKey;
    }
  });

  it('should return dev fallback key when in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'development';
      const key = getEncryptionKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

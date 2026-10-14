import { describe, it, expect } from 'vitest';
import { ApiResponse } from '../shared/http/api-response.js';
import { ApiError } from '../shared/errors/app-error.js';

describe('API Contract Integration & Dual-Serialization Contract Tests', () => {
  describe('ApiResponse Dual-Contract Serialization', () => {
    it('spreads payload object properties directly onto response instance for legacy frontend compatibility', () => {
      const payload = {
        user: { _id: 'u1', name: 'Alice', email: 'alice@example.com' },
        token: 'mock-jwt-token'
      };

      const res = new ApiResponse(200, payload, 'User fetched successfully');

      // Canonical ApiResponse envelope
      expect(res.statusCode).toBe(200);
      expect(res.success).toBe(true);
      expect(res.message).toBe('User fetched successfully');
      expect(res.data).toEqual(payload);
      expect(res.data.user.name).toBe('Alice');

      // Backward-compatible direct properties (Axios res.data.user)
      expect(res.user).toBeDefined();
      expect(res.user.name).toBe('Alice');
      expect(res.token).toBe('mock-jwt-token');
    });

    it('preserves group payload at both res.data.group and res.group to prevent GroupDetail crashes', () => {
      const payload = {
        group: {
          _id: 'g1',
          name: 'React Learners',
          description: 'Frontend group',
          members: []
        }
      };

      const res = new ApiResponse(200, payload, 'Group loaded');

      expect(res.data.group.name).toBe('React Learners');
      expect(res.group.name).toBe('React Learners');
    });

    it('preserves skills array at both res.data.skills and res.skills to prevent SkillCatalog length crashes', () => {
      const payload = {
        skills: [
          { _id: 's1', name: 'JavaScript', category: 'Programming' },
          { _id: 's2', name: 'TypeScript', category: 'Programming' }
        ],
        total: 2
      };

      const res = new ApiResponse(200, payload, 'Skills retrieved');

      expect(Array.isArray(res.data.skills)).toBe(true);
      expect(res.data.skills.length).toBe(2);
      expect(Array.isArray(res.skills)).toBe(true);
      expect(res.skills.length).toBe(2);
      expect(res.total).toBe(2);
    });

    it('does not overwrite envelope core keys (statusCode, data, message, success) if present in payload', () => {
      const maliciousPayload = {
        statusCode: 999,
        success: false,
        message: 'Overridden',
        data: 'malicious',
        customKey: 'valid'
      };

      const res = new ApiResponse(200, maliciousPayload, 'Original message');

      expect(res.statusCode).toBe(200);
      expect(res.success).toBe(true);
      expect(res.message).toBe('Original message');
      expect(res.data).toEqual(maliciousPayload);
      expect(res.customKey).toBe('valid');
    });

    it('safely handles non-object and array payloads without crashing or spreading keys', () => {
      const arrayRes = new ApiResponse(200, [1, 2, 3], 'List');
      expect(arrayRes.data).toEqual([1, 2, 3]);
      expect(arrayRes.statusCode).toBe(200);

      const nullRes = new ApiResponse(200, null, 'Empty');
      expect(nullRes.data).toBeNull();

      const stringRes = new ApiResponse(200, 'text-value', 'Text');
      expect(stringRes.data).toBe('text-value');
    });

    it('handles Mongoose doc toObject serialization if passed', () => {
      const mockDoc = {
        toObject: () => ({ user: { name: 'Bob' } })
      };

      const res = new ApiResponse(200, mockDoc, 'Success');
      expect(res.user).toEqual({ name: 'Bob' });
    });
  });

  describe('Contract Normalization Guarantees for Frontend Consumers', () => {
    it('allows frontend helper pattern (res.data?.data?.user || res.data?.user) to reliably extract user', () => {
      // Simulating Axios response structure where Axios puts HTTP body in res.data
      const httpBody = new ApiResponse(200, {
        user: { _id: 'u123', name: 'Sarah Connor', points: 120 }
      });

      const axiosRes = { data: httpBody };

      // Strategy 1: Canonical
      const canonicalUser = axiosRes.data?.data?.user;
      // Strategy 2: Legacy direct
      const legacyUser = axiosRes.data?.user;

      expect(canonicalUser?.name).toBe('Sarah Connor');
      expect(legacyUser?.name).toBe('Sarah Connor');
      expect((canonicalUser || legacyUser)?.points).toBe(120);
    });

    it('allows frontend helper pattern (res.data?.data?.skills || res.data?.skills) to reliably measure length', () => {
      const httpBody = new ApiResponse(200, {
        skills: [{ _id: 'sk1', name: 'Node.js' }],
        count: 1
      });

      const axiosRes = { data: httpBody };

      const rawSkills = axiosRes.data?.data?.skills || axiosRes.data?.skills || [];
      expect(Array.isArray(rawSkills)).toBe(true);
      expect(rawSkills.length).toBe(1);
    });

    it('provides standardized ApiError for 404 / 400 responses', () => {
      const error = new ApiError(404, 'User not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.success).toBe(false);
    });
  });
});

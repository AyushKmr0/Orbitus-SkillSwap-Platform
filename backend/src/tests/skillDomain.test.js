import { describe, it, expect, vi, beforeEach } from 'vitest';
import { skillService } from '../modules/skills/skill.service.js';
import { createSkillSchema, requestSkillSchema } from '../modules/skills/skill.schema.js';
import Skill from '../models/Skill.js';
import SkillRequest from '../models/SkillRequest.js';

describe('Skill Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schemas', () => {
    it('should reject skill creation without category', () => {
      const result = createSkillSchema.safeParse({
        body: { name: 'Rust' }
      });
      expect(result.success).toBe(false);
    });

    it('should parse comma-separated tags into array', () => {
      const result = createSkillSchema.safeParse({
        body: { name: 'Rust Programming', category: 'Systems', tags: 'rust, systems, memory-safety' }
      });
      expect(result.success).toBe(true);
      expect(result.data.body.tags).toEqual(['rust', 'systems', 'memory-safety']);
    });

    it('should reject skill request with empty name', () => {
      const result = requestSkillSchema.safeParse({
        body: { name: '', category: 'General' }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Skill Service', () => {
    it('should throw 400 when creating skill that already exists', async () => {
      vi.spyOn(Skill, 'findOne').mockResolvedValue({ _id: 'skill-1', name: 'Rust' });

      await expect(
        skillService.createSkill({ name: 'Rust', category: 'Systems' })
      ).rejects.toThrow('Skill already exists in the master database');
    });

    it('should reject skill request if course already exists in catalog', async () => {
      vi.spyOn(Skill, 'findOne').mockResolvedValue({ _id: 'skill-existing', name: 'Docker' });

      await expect(
        skillService.requestSkill({
          userId: 'user-1',
          name: 'Docker',
          category: 'DevOps'
        })
      ).rejects.toThrow('already exists in the catalog');
    });

    it('should reject duplicate pending skill request from same user', async () => {
      vi.spyOn(Skill, 'findOne').mockResolvedValue(null);
      vi.spyOn(SkillRequest, 'findOne').mockResolvedValue({ _id: 'req-1', status: 'pending' });

      await expect(
        skillService.requestSkill({
          userId: 'user-1',
          name: 'Kubernetes',
          category: 'DevOps'
        })
      ).rejects.toThrow('You have already submitted a pending request');
    });
  });
});

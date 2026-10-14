import { describe, it, expect, vi } from 'vitest';
import { GroupService } from '../modules/groups/group.service.js';
import {
  createGroupSchema,
  updateGroupSchema,
  sendGroupMessageSchema
} from '../modules/groups/group.schema.js';

describe('Groups Domain & Schemas', () => {
  it('validates valid group creation payload', () => {
    const valid = {
      body: {
        name: 'Node.js Study Group',
        description: 'Deep dive into asynchronous programming',
        privacy: 'public',
        category: 'Programming & Tech',
        tags: ['nodejs', 'express']
      }
    };
    const parsed = createGroupSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects empty group name', () => {
    const invalid = {
      body: {
        name: '   ',
        description: 'Test'
      }
    };
    const parsed = createGroupSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates updateGroupSchema', () => {
    const validUpdate = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { name: 'Updated Name', privacy: 'private' }
    };
    expect(updateGroupSchema.safeParse(validUpdate).success).toBe(true);
  });

  it('validates message sending payload with text or file', () => {
    const validText = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { content: 'Hello everyone!' }
    };
    expect(sendGroupMessageSchema.safeParse(validText).success).toBe(true);

    const validFile = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { fileUrl: 'https://example.com/notes.pdf', fileType: 'pdf' }
    };
    expect(sendGroupMessageSchema.safeParse(validFile).success).toBe(true);

    const empty = {
      params: { id: '507f1f77bcf86cd799439011' },
      body: { content: '' }
    };
    expect(sendGroupMessageSchema.safeParse(empty).success).toBe(false);
  });

  it('creates a group through GroupService', async () => {
    const mockRepo = {
      createGroup: vi.fn().mockResolvedValue({ _id: 'grp123' }),
      findGroupById: vi.fn().mockResolvedValue({
        _id: 'grp123',
        populate: vi.fn().mockResolvedValue(true)
      })
    };

    const service = new GroupService(mockRepo);
    const result = await service.createGroup('usr123', {
      name: 'Test Group',
      privacy: 'public'
    });

    expect(mockRepo.createGroup).toHaveBeenCalled();
    expect(result._id).toBe('grp123');
  });

  it('blocks non-admin from updating group settings', async () => {
    const mockRepo = {
      findGroupById: vi.fn().mockResolvedValue({
        _id: 'grp123',
        admins: ['adminUserId']
      })
    };

    const service = new GroupService(mockRepo);
    await expect(
      service.updateGroup('grp123', 'nonAdminId', { name: 'New Name' })
    ).rejects.toThrow('Only group admins can update settings');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '../modules/chat/chat.service.js';
import {
  chatRoomIdParamSchema,
  partnerIdParamSchema,
  getMessageHistorySchema
} from '../modules/chat/chat.schema.js';

describe('Chat Domain & Schemas', () => {
  it('validates valid chat room ID param', () => {
    const valid = { params: { chatRoomId: 'room_123_456' } };
    expect(chatRoomIdParamSchema.safeParse(valid).success).toBe(true);

    const invalid = { params: { chatRoomId: '' } };
    expect(chatRoomIdParamSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates 24-char ObjectId for partnerId', () => {
    const valid = { params: { partnerId: '507f1f77bcf86cd799439011' } };
    expect(partnerIdParamSchema.safeParse(valid).success).toBe(true);

    const invalid = { params: { partnerId: 'not-an-objectid' } };
    expect(partnerIdParamSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates message history query parameters', () => {
    const valid = {
      params: { chatRoomId: 'room_abc_def' },
      query: { limit: '25', cursor: 'eyJkYXRlIjoxMjM0fQ==' }
    };
    expect(getMessageHistorySchema.safeParse(valid).success).toBe(true);
  });

  it('blocks chat access when conversation is blocked', async () => {
    const mockRepo = {
      findChatPreference: vi.fn().mockImplementation((query) => {
        if (query.isBlocked) return Promise.resolve({ isBlocked: true });
        return Promise.resolve(null);
      })
    };

    const service = new ChatService(mockRepo);
    await expect(
      service.ensureCanViewChat('userA', 'userB')
    ).rejects.toThrow('Chat is blocked');
  });

  it('toggles user block status', async () => {
    const mockRepo = {
      findUserById: vi.fn().mockResolvedValue({ _id: 'userB' }),
      findChatPreference: vi.fn().mockResolvedValue({ isBlocked: false }),
      upsertChatPreference: vi.fn().mockResolvedValue(true)
    };

    const service = new ChatService(mockRepo);
    const result = await service.toggleBlockUser('userA', 'userB');
    expect(result).toBe(true);
    expect(mockRepo.upsertChatPreference).toHaveBeenCalled();
  });
});

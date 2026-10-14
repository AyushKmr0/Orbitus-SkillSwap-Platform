import { describe, it, expect } from 'vitest';
import {
  privateMessageSocketSchema,
  groupMessageSocketSchema,
  typingSocketSchema,
  markSeenSocketSchema,
  reactMessageSocketSchema
} from '../socket/socketHandler.js';

describe('Socket.IO Payload Zod Validation Tests', () => {
  it('validates private message socket payload', () => {
    const valid = {
      recipientId: '507f1f77bcf86cd799439011',
      chatRoomId: 'room_123_456',
      content: 'Hello via socket!'
    };
    expect(privateMessageSocketSchema.safeParse(valid).success).toBe(true);

    const empty = {
      recipientId: '507f1f77bcf86cd799439011',
      chatRoomId: 'room_123_456',
      content: ''
    };
    expect(privateMessageSocketSchema.safeParse(empty).success).toBe(false);
  });

  it('validates group message socket payload', () => {
    const valid = {
      groupId: '507f1f77bcf86cd799439011',
      content: 'Group discussion message'
    };
    expect(groupMessageSocketSchema.safeParse(valid).success).toBe(true);
  });

  it('validates typing payload schema', () => {
    expect(typingSocketSchema.safeParse({ chatRoomId: 'room_1', isTyping: true }).success).toBe(true);
    expect(typingSocketSchema.safeParse({ chatRoomId: '', isTyping: false }).success).toBe(false);
  });

  it('validates mark seen payload schema', () => {
    expect(markSeenSocketSchema.safeParse({ chatRoomId: 'room_1' }).success).toBe(true);
    expect(markSeenSocketSchema.safeParse({ chatRoomId: '' }).success).toBe(false);
  });

  it('validates reaction payload schema', () => {
    const valid = {
      messageId: '507f1f77bcf86cd799439011',
      emoji: '👍',
      chatRoomId: 'room_1'
    };
    expect(reactMessageSocketSchema.safeParse(valid).success).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encodeCursor, parseCursor, getMessageHistory } from '../modules/chat/chat.controller.js';
import Message from '../models/Message.js';
import ChatPreference from '../models/ChatPreference.js';

describe('Chat History Cursor Pagination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should encode and parse composite cursor with createdAt and _id', () => {
    const date = new Date('2026-10-02T12:00:00.000Z');
    const id = '65f123456789abcdef123456';

    const cursorStr = encodeCursor(date, id);
    expect(cursorStr).toBeTypeOf('string');

    const parsed = parseCursor(cursorStr);
    expect(parsed).not.toBeNull();
    expect(parsed.cursorDate.toISOString()).toBe(date.toISOString());
    expect(parsed.cursorId).toBe(id);
  });

  it('should parse legacy ISO string cursor for backward compatibility', () => {
    const isoString = '2026-10-02T12:00:00.000Z';
    const parsed = parseCursor(isoString);

    expect(parsed).not.toBeNull();
    expect(parsed.cursorDate.toISOString()).toBe(isoString);
    expect(parsed.cursorId).toBeNull();
  });

  it('should reject malformed or invalid cursor with null', () => {
    expect(parseCursor('not-a-valid-cursor')).toBeNull();
    expect(parseCursor('12345_invalid_date')).toBeNull();
    expect(parseCursor(null)).toBeNull();
    expect(parseCursor('')).toBeNull();
  });

  it('should reject malformed cursor query in getMessageHistory with 400 error', async () => {
    const req = {
      params: { chatRoomId: 'room_123_456' },
      query: { cursor: 'totally_invalid_cursor_string' },
      user: { _id: '123' }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    vi.spyOn(ChatPreference, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    });

    await expect(getMessageHistory(req, res)).rejects.toThrow('Invalid pagination cursor format');
  });

  it('should construct lexicographical $or query when cursor has both date and id', async () => {
    const date = new Date('2026-10-02T12:00:00.000Z');
    const id = '65f123456789abcdef123456';
    const cursorStr = encodeCursor(date, id);

    const req = {
      params: { chatRoomId: 'room_123_456' },
      query: { cursor: cursorStr, limit: '10' },
      user: { _id: '123' }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    vi.spyOn(ChatPreference, 'findOne').mockReturnValue({
      lean: vi.fn().mockResolvedValue(null)
    });

    let capturedQuery = null;
    const mockFind = vi.fn((query) => {
      capturedQuery = query;
      return {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          { _id: 'msg_1', createdAt: new Date('2026-10-02T11:59:00.000Z'), content: 'hello' }
        ])
      };
    });
    vi.spyOn(Message, 'find').mockImplementation(mockFind);

    await getMessageHistory(req, res);

    expect(capturedQuery).toBeDefined();
    expect(capturedQuery.$or).toEqual([
      { createdAt: { $lt: date } },
      { createdAt: date, _id: { $lt: id } }
    ]);
  });
});

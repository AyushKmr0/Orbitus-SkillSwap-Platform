import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  socketHandler,
  emitNotificationToUser,
  emitUserFollowUpdate,
  onlineUsers
} from '../socket/socketHandler.js';

describe('Socket Notification Deduplication & Multi-Device Presence Tests', () => {
  let mockIo;
  let connectionHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    onlineUsers.clear();

    const roomsEmitted = new Map();
    mockIo = {
      use: vi.fn(),
      on: (event, handler) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      },
      to: vi.fn((target) => {
        return {
          emit: vi.fn((event, _data) => {
            const count = roomsEmitted.get(`${target}:${event}`) || 0;
            roomsEmitted.set(`${target}:${event}`, count + 1);
          }),
          except: vi.fn(() => ({
            emit: vi.fn()
          }))
        };
      }),
      emit: vi.fn()
    };
    mockIo._roomsEmitted = roomsEmitted;

    socketHandler(mockIo);
  });

  it('should deliver notifications to user room exactly once without socket-ID duplicate iteration', () => {
    const userId = 'user_123';
    onlineUsers.set(userId, new Set(['socket_a', 'socket_b']));

    const notificationPayload = {
      _id: 'notif_1',
      type: 'SessionAccepted',
      content: 'Your study session was accepted'
    };

    emitNotificationToUser(userId, notificationPayload);

    // Assert that mockIo.to was called with user room 'user_user_123'
    expect(mockIo.to).toHaveBeenCalledWith('user_user_123');

    // Assert that mockIo.to was NOT called with individual socket IDs 'socket_a' or 'socket_b'
    expect(mockIo.to).not.toHaveBeenCalledWith('socket_a');
    expect(mockIo.to).not.toHaveBeenCalledWith('socket_b');
  });

  it('should deliver follow updates to user room exactly once without socket-ID duplicate iteration', () => {
    const userId = 'user_456';
    onlineUsers.set(userId, new Set(['socket_x']));

    const followPayload = {
      action: 'followed',
      user: { name: 'Alice' }
    };

    emitUserFollowUpdate(userId, followPayload);

    expect(mockIo.to).toHaveBeenCalledWith('user_user_456');
    expect(mockIo.to).not.toHaveBeenCalledWith('socket_x');
  });

  it('should maintain multi-device presence: offline is only emitted when ALL sockets disconnect', async () => {
    const userId = 'user_multi_device';

    const socketEventsA = {};
    const mockSocketA = {
      id: 'socket_tab_1',
      userId,
      user: { _id: userId, name: 'Multi User' },
      join: vi.fn(),
      emit: vi.fn(),
      on: (event, handler) => {
        socketEventsA[event] = handler;
      }
    };

    const socketEventsB = {};
    const mockSocketB = {
      id: 'socket_tab_2',
      userId,
      user: { _id: userId, name: 'Multi User' },
      join: vi.fn(),
      emit: vi.fn(),
      on: (event, handler) => {
        socketEventsB[event] = handler;
      }
    };

    // Connect Tab 1
    connectionHandler(mockSocketA);
    expect(onlineUsers.get(userId).size).toBe(1);
    expect(mockIo.emit).toHaveBeenCalledWith('user_status_changed', { userId, status: 'online' });

    mockIo.emit.mockClear();

    // Connect Tab 2
    connectionHandler(mockSocketB);
    expect(onlineUsers.get(userId).size).toBe(2);
    // Should NOT emit online again since user is already online
    expect(mockIo.emit).not.toHaveBeenCalledWith('user_status_changed', { userId, status: 'online' });

    // Disconnect Tab 1 (Tab 2 remains open)
    await socketEventsA['disconnect']();
    expect(onlineUsers.get(userId).size).toBe(1);
    // User is still online on Tab 2: must NOT emit offline!
    expect(mockIo.emit).not.toHaveBeenCalledWith('user_status_changed', { userId, status: 'offline' });

    // Disconnect Tab 2 (Last active socket)
    await socketEventsB['disconnect']();
    expect(onlineUsers.has(userId)).toBe(false);
    // All sockets gone: must now emit offline
    expect(mockIo.emit).toHaveBeenCalledWith('user_status_changed', { userId, status: 'offline' });
  });
});

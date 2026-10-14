import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { socketHandler } from '../socket/socketHandler.js';
import User from '../models/User.js';
import { getJwtSecret } from '../config/env.js';

describe('Socket.IO Connection & Authentication Middleware Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getMiddleware = () => {
    let middlewareFn = null;
    const mockIo = {
      use: (fn) => {
        middlewareFn = fn;
      },
      on: vi.fn(),
      emit: vi.fn(),
      adapter: vi.fn()
    };
    socketHandler(mockIo);
    return middlewareFn;
  };

  it('should reject socket connection with 400 auth error when token is absent', async () => {
    const middleware = getMiddleware();
    expect(middleware).toBeTypeOf('function');

    const mockSocket = {
      handshake: {
        headers: {},
        auth: {}
      }
    };

    let errorReceived = null;
    await middleware(mockSocket, (err) => {
      errorReceived = err;
    });

    expect(errorReceived).toBeInstanceOf(Error);
    expect(errorReceived.message).toContain('Authentication error: Token required');
  });

  it('should reject socket connection when token is invalid or expired', async () => {
    const middleware = getMiddleware();

    const mockSocket = {
      handshake: {
        headers: {},
        auth: { token: 'invalid.expired.jwt' }
      }
    };

    let errorReceived = null;
    await middleware(mockSocket, (err) => {
      errorReceived = err;
    });

    expect(errorReceived).toBeInstanceOf(Error);
    expect(errorReceived.message).toContain('Authentication error:');
  });

  it('should authenticate socket connection and attach user when valid JWT token is provided', async () => {
    const middleware = getMiddleware();
    const userId = '65f123456789abcdef123456';
    const validToken = jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: '1h' });

    const mockUser = {
      _id: userId,
      name: 'Socket User',
      email: 'socket@example.com',
      role: 'User'
    };

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      })
    });

    const mockSocket = {
      handshake: {
        headers: {},
        auth: { token: validToken }
      }
    };

    let errorReceived = null;
    await middleware(mockSocket, (err) => {
      errorReceived = err;
    });

    expect(errorReceived).toBeUndefined();
    expect(mockSocket.userId).toBe(userId);
    expect(mockSocket.user).toEqual(mockUser);
  });
});

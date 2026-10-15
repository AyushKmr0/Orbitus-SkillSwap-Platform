import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisConnected } from '../config/redis.js';

export class DynamicRateLimitStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:global:';
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.memoryStore = new MemoryStore();
    this.redisStore = null;
    this.initOptions = null;
  }

  init(options) {
    this.initOptions = options;
    this.windowMs = options?.windowMs || this.windowMs;
    if (typeof this.memoryStore.init === 'function') {
      this.memoryStore.init(options);
    }
  }

  getActiveStore() {
    const client = getRedisClient();
    if (isRedisConnected() && client) {
      if (!this.redisStore) {
        try {
          this.redisStore = new RedisStore({
            sendCommand: (...args) => {
              const activeClient = getRedisClient();
              if (!activeClient) throw new Error('Redis client unavailable');
              return activeClient.sendCommand(args);
            },
            prefix: this.prefix
          });
          if (typeof this.redisStore.init === 'function') {
            this.redisStore.init(this.initOptions || { windowMs: this.windowMs });
          }
        } catch (err) {
          console.warn('[RATE LIMITER STORE INIT ERROR]:', err.message);
          this.redisStore = null;
          return this.memoryStore;
        }
      }
      return this.redisStore;
    }

    if (this.redisStore && !isRedisConnected()) {
      this.redisStore = null;
    }
    return this.memoryStore;
  }

  async increment(key) {
    const store = this.getActiveStore();
    try {
      return await store.increment(key);
    } catch (err) {
      console.warn(`[RATE LIMITER STORE DEGRADATION]: ${err.message}. Falling back to memory store.`);
      return this.memoryStore.increment(key);
    }
  }

  async decrement(key) {
    const store = this.getActiveStore();
    if (typeof store.decrement === 'function') {
      try {
        return await store.decrement(key);
      } catch {
        if (typeof this.memoryStore.decrement === 'function') {
          return this.memoryStore.decrement(key);
        }
      }
    }
  }

  async resetKey(key) {
    const store = this.getActiveStore();
    if (typeof store.resetKey === 'function') {
      try {
        return await store.resetKey(key);
      } catch {
        if (typeof this.memoryStore.resetKey === 'function') {
          return this.memoryStore.resetKey(key);
        }
      }
    }
  }

  async resetAll() {
    if (this.redisStore && typeof this.redisStore.resetAll === 'function') {
      try {
        await this.redisStore.resetAll();
      } catch {
        // ignore
      }
    }
    if (typeof this.memoryStore.resetAll === 'function') {
      await this.memoryStore.resetAll();
    }
  }
}

const createRateLimiter = (options) => {
  const store = new DynamicRateLimitStore({
    prefix: `rl:${options.prefix || 'global'}:`,
    windowMs: options.windowMs || 15 * 60 * 1000
  });

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: process.env.NODE_ENV !== 'production' ? (options.max || 100) * 10 : (options.max || 100),
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      message: options.message || 'Too many requests from this IP, please try again later.'
    }
  });
};

// Rate limiter for authentication endpoints (login, register, otp, password reset)
export const authRateLimiter = createRateLimiter({
  prefix: 'auth',
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

// Rate limiter for AI features
export const aiRateLimiter = createRateLimiter({
  prefix: 'ai',
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI request limit reached. Please wait a minute before making more AI requests.'
});

// Rate limiter for file uploads
export const uploadRateLimiter = createRateLimiter({
  prefix: 'upload',
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Upload limit reached. Please wait before uploading more files.'
});

// Rate limiter for global API
export const apiRateLimiter = createRateLimiter({
  prefix: 'api',
  windowMs: 15 * 60 * 1000,
  max: Number.parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 1200
});

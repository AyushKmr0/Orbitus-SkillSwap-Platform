import { createAdapter } from '@socket.io/redis-adapter';

/**
 * Attaches Redis Pub/Sub adapter to a Socket.IO server if clients are available and connected.
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {Object} pubClient - Redis publisher client
 * @param {Object} subClient - Redis subscriber client
 * @returns {boolean} Whether the Redis adapter was successfully attached
 */
export const setupSocketRedisAdapter = (io, pubClient, subClient) => {
  if (pubClient && subClient) {
    try {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('[SOCKET REDIS ADAPTER]: Socket.IO adapter successfully bound to Redis.');
      return true;
    } catch (err) {
      console.warn('[SOCKET REDIS ADAPTER ERROR]: Failed to bind adapter:', err.message);
      return false;
    }
  }
  console.log('[SOCKET ADAPTER]: Operating in standalone in-memory adapter mode.');
  return false;
};

export default setupSocketRedisAdapter;

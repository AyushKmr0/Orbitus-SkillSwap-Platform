import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { validateEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/mongoose.js';
import { initRedis, closeRedis } from './infrastructure/redis/client.js';
import { setupSocketRedisAdapter } from './infrastructure/redis/adapter.js';
import app from './app.js';
import { socketHandler } from './socket/socketHandler.js';
import { logEmailConfigStatus } from './infrastructure/email/mailer.js';

// 1. Validate environment configuration
validateEnv();
logEmailConfigStatus();

const isProduction = process.env.NODE_ENV === 'production';
const allowLocalOrigins = process.env.ALLOW_LOCAL_ORIGINS === 'true' || !isProduction;
const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',')
].map((o) => o?.trim().replace(/\/$/, '')).filter(Boolean);

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const allowedOrigins = isProduction ? configuredOrigins : [...configuredOrigins, ...devOrigins];

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(normalized) ||
        (allowLocalOrigins && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(normalized))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Socket CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 2. Connect to MongoDB
    await connectDatabase();

    // 3. Initialize Redis & attach adapter BEFORE accepting traffic
    const { pubClient, subClient } = await initRedis();
    setupSocketRedisAdapter(io, pubClient, subClient);

    // 4. Load real-time socket handler
    socketHandler(io);

    // 5. Start listener explicitly bound to 0.0.0.0 for localhost & LAN access
    server.listen(PORT, '0.0.0.0', () => {
      const serviceUrl = process.env.BACKEND_URL || `http://0.0.0.0:${PORT}`;
      console.log(`==================================================`);
      console.log(`  ORBITUS BACKEND SERVICES INITIALIZED!`);
      console.log(`  Running in mode:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`  HTTP Listener:    ${serviceUrl}`);
      console.log(`  Socket Service:   ${serviceUrl.replace(/^http/, 'ws')}`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error('[CRITICAL SERVER STARTUP FAILURE]:', err);
    process.exit(1);
  }
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Close the existing backend process or start this server with a different PORT.');
    console.error(`Windows helper: netstat -ano -p tcp | findstr :${PORT}`);
    process.exit(1);
  }

  console.error('Server failed to start:', error);
  process.exit(1);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[SHUTDOWN]: Received ${signal}. Gracefully stopping server...`);

  server.close(async () => {
    console.log('[SHUTDOWN]: HTTP server closed.');

    try {
      await io.close();
      console.log('[SHUTDOWN]: Socket.IO connections drained.');
    } catch (err) {
      console.warn('[SHUTDOWN WARNING]: Error closing Socket.IO:', err.message);
    }

    try {
      await closeRedis();
      console.log('[SHUTDOWN]: Redis connections closed.');
    } catch (err) {
      console.warn('[SHUTDOWN WARNING]: Error closing Redis:', err.message);
    }

    try {
      await disconnectDatabase();
      console.log('[SHUTDOWN]: MongoDB connection closed.');
    } catch (err) {
      console.warn('[SHUTDOWN WARNING]: Error closing MongoDB:', err.message);
    }

    console.log('[SHUTDOWN]: Graceful shutdown complete.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SHUTDOWN ERROR]: Forcefully terminating after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import connectDB from './config/db.js';
import app from './app.js';
import { socketHandler } from './socket/socketHandler.js';
import { logEmailConfigStatus } from './services/emailService.js';

logEmailConfigStatus();

// Connect to MongoDB
connectDB();

// Initialize Node HTTP server wrapping Express
const server = http.createServer(app);

// Setup Socket.io Server instance
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (
        normalized === process.env.FRONTEND_URL?.replace(/\/$/, '') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized) ||
        normalized.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback allow in dev
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Load real-time socket events mapping
socketHandler(io);

// Spin listener port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  const serviceUrl = process.env.BACKEND_URL || `http://0.0.0.0:${PORT}`;
  console.log(`==================================================`);
  console.log(`  ORBITUS BACKEND SERVICES INITIALIZED!`);
  console.log(`  Running in mode:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`  HTTP Listener:    ${serviceUrl}`);
  console.log(`  Socket Service:   ${serviceUrl.replace(/^http/, 'ws')}`);
  console.log(`==================================================`);
});

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

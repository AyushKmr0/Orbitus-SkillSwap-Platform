import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { socketHandler } from './socket/socketHandler.js';

// Setup environment configurations
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Node HTTP server wrapping Express
const server = http.createServer(app);

// Setup Socket.io Server instance
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://orbitus-skill-swap-platform.vercel.app',
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

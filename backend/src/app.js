import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Middlewares & Rate Limiters
import { errorHandler } from './shared/errors/error-handler.js';
import {
  apiRateLimiter,
  authRateLimiter,
  aiRateLimiter,
  uploadRateLimiter
} from './middlewares/rateLimiter.js';

// Import Canonical Domain Routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import skillRoutes from './modules/skills/skill.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import sessionRoutes from './modules/sessions/session.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import postRoutes from './modules/posts/post.routes.js';
import certificateRoutes from './modules/certificates/certificate.routes.js';
import groupRoutes from './modules/groups/group.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';

import mongoose from 'mongoose';
import { isRedisConnected } from './infrastructure/redis/client.js';

const app = express();
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';
const allowLocalOrigins = process.env.ALLOW_LOCAL_ORIGINS === 'true' || !isProduction;
const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',')
].map(origin => origin?.trim().replace(/\/$/, '')).filter(Boolean);

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const allowedOrigins = isProduction ? configuredOrigins : [...configuredOrigins, ...devOrigins];

// ES module path support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Standard Middlewares
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes(normalizedOrigin) ||
      (allowLocalOrigins && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(normalizedOrigin))
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting
app.use('/api', apiRateLimiter);

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health, Liveness & Readiness Probes
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE', uptime: Math.round(process.uptime()) });
});

app.get('/health/ready', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = isRedisConnected();
  const isReady = dbConnected;

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'READY' : 'UNAVAILABLE',
    services: {
      api: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      cache: redisConnected ? 'connected' : 'degraded_in_memory'
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = isRedisConnected();
  const isHealthy = dbConnected;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    message: isHealthy ? 'Orbitus Backend Services are running smoothly.' : 'Core database connectivity is degraded.',
    services: {
      api: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
      cache: redisConnected ? 'connected' : 'degraded_in_memory'
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Specific Rate Limiters on Sensitive API Routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/verify-otp', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);
app.use('/api/auth/admin-login', authRateLimiter);
app.use('/api/ai', aiRateLimiter);
app.use('/api/users/profile/resume', uploadRateLimiter);
app.use('/api/users/upload-image', uploadRateLimiter);

// Hook API Route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Resource not found: ${req.originalUrl}` });
});

// Centralized ApiError & Server Error Handler
app.use(errorHandler);

export default app;

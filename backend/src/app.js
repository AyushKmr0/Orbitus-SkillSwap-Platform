import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import postRoutes from './routes/postRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://orbitus-skill-swap-platform.vercel.app'
].filter(Boolean);

// ES module path support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static note files/uploads if needed
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Orbitus Backend Services are running smoothly.' });
});

// Hook API modules
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/certificates', certificateRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Resource not found: ${req.originalUrl}` });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR HANDLER]:', err.stack || err.message);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

export default app;

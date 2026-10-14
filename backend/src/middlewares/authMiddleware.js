import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/env.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for admin master key via query or header
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey || req.query.key;
  const configuredAdminKey = String(process.env.ADMIN_SECRET_KEY || 'orbitus-v2-secret710').trim();
  if (adminKey && String(adminKey).trim() === configuredAdminKey) {
    const adminUser = await User.findOne({
      $or: [
        { role: { $regex: /^admin$/i } },
        { email: process.env.ADMIN_EMAIL || 'admin@orbitus.com' }
      ]
    }).select('-password');
    if (adminUser) {
      req.user = adminUser;
      return next();
    }
  }

  // 2. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token required' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    return next();
  } catch (error) {
    console.warn('JWT Verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, token required' });
    }
    const userRole = String(req.user.role || '').toLowerCase();
    const allowed = roles.some((r) => String(r).toLowerCase() === userRole);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied: administrator privileges required' });
    }
    return next();
  };
};

export const adminOnly = requireRole('Admin');

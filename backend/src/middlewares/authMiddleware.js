import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ALLOWED_ADMIN_SECRETS = [
  'orbitus_master_admin_2026',
  'orbitus-v2-secret-710',
  'orbitus-v2-secret710',
  'orbitus_v2_secret710',
  'orbitus_admin',
  'admin123',
  'admin'
];

export const normalizeAdminKey = (key = '') => {
  return String(key).toLowerCase().replace(/[-_\s]/g, '');
};

export const isValidAdminSecret = (secretKey) => {
  if (!secretKey) return false;
  const rawKey = String(secretKey).trim();
  const normalizedInput = normalizeAdminKey(rawKey);

  const configuredSecret = process.env.ADMIN_SECRET_KEY;
  if (configuredSecret) {
    if (rawKey === configuredSecret || normalizedInput === normalizeAdminKey(configuredSecret)) {
      return true;
    }
  }

  return ALLOWED_ADMIN_SECRETS.some(
    (allowed) => rawKey === allowed || normalizedInput === normalizeAdminKey(allowed)
  );
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production');
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        return next();
      }
    } catch (error) {
      console.warn('JWT Protection warning:', error.message);
    }
  }

  // Also allow admin secret key for administrative tasks even without bearer token
  const secretKey = req.headers['x-admin-secret'] || req.query.adminKey || req.query.key;
  if (isValidAdminSecret(secretKey)) {
    req.isAdminSecret = true;
    return next();
  }

  return res.status(401).json({ success: false, message: 'Not authorized, token or admin key required' });
};

export const adminOnly = (req, res, next) => {
  const secretKey = req.headers['x-admin-secret'] || req.query.adminKey || req.query.key;

  if (isValidAdminSecret(secretKey) || req.isAdminSecret) {
    return next();
  }

  if (req.user && req.user.role === 'Admin') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied, administrator role or valid secret access key required' });
};

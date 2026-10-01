import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me_in_production');

      // Get user from token and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error('JWT Protection Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // Also allow admin secret key for administrative tasks even without bearer token
  const secretKey = req.headers['x-admin-secret'] || req.query.adminKey;
  const configuredSecret = process.env.ADMIN_SECRET_KEY || (process.env.NODE_ENV !== 'production' ? 'orbitus_master_admin_2026' : null);
  if (configuredSecret && secretKey && secretKey === configuredSecret) {
    req.isAdminSecret = true;
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  const secretKey = req.headers['x-admin-secret'] || req.query.adminKey;
  const configuredSecret = process.env.ADMIN_SECRET_KEY || (process.env.NODE_ENV !== 'production' ? 'orbitus_master_admin_2026' : null);

  if ((configuredSecret && secretKey && secretKey === configuredSecret) || req.isAdminSecret) {
    return next();
  }

  if (req.user && req.user.role === 'Admin') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied, administrator role or valid secret access key required' });
};

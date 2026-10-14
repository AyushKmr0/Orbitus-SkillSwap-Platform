import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];

  if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change_me') || process.env.JWT_SECRET.includes('your_production')) {
      missing.push('JWT_SECRET');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('change_me') || process.env.JWT_REFRESH_SECRET.includes('your_production')) {
      missing.push('JWT_REFRESH_SECRET');
    }
    if (!process.env.MONGODB_URI) {
      missing.push('MONGODB_URI');
    }
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.includes('your_32_byte')) {
      missing.push('ENCRYPTION_KEY');
    }
  }

  if (missing.length > 0) {
    console.error(`[CRITICAL] Missing required environment variables in production: ${missing.join(', ')}`);
    if (isProduction) {
      process.exit(1);
    }
  }
};

export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  return 'orbitus_dev_jwt_access_secret_2026_safe_fallback';
};

export const getJwtRefreshSecret = () => {
  if (process.env.JWT_REFRESH_SECRET) return process.env.JWT_REFRESH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_REFRESH_SECRET must be set in production environment');
  }
  return 'orbitus_dev_jwt_refresh_secret_2026_safe_fallback';
};

export const getEncryptionKey = () => {
  if (process.env.ENCRYPTION_KEY) return process.env.ENCRYPTION_KEY;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }
  return 'orbitus_dev_encryption_key_32bytes_sec!';
};

import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting.js';

let cachedAdminSecretKey = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000;

export async function getEffectiveAdminSecretKey() {
  const now = Date.now();
  if (cachedAdminSecretKey && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedAdminSecretKey;
  }

  // Only query MongoDB if connected (readyState === 1) to avoid buffering in tests
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const setting = await SystemSetting.findOne({ key: 'admin_secret_key' }).lean();
      if (setting && setting.value) {
        cachedAdminSecretKey = String(setting.value).trim();
        lastCacheTime = now;
        return cachedAdminSecretKey;
      }
    } catch {
      // ignore
    }
  }

  cachedAdminSecretKey = String(process.env.ADMIN_SECRET_KEY || 'orbitus-v2-secret710').trim();
  lastCacheTime = now;
  return cachedAdminSecretKey;
}

export function setCachedAdminSecretKey(newKey) {
  cachedAdminSecretKey = String(newKey).trim();
  lastCacheTime = Date.now();
}

import crypto from 'crypto';
import { getEncryptionKey } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

const getMasterKey = () => {
  const secret = getEncryptionKey();
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptText = (text) => {
  if (!text || typeof text !== 'string') return '';
  if (text.startsWith('enc:')) return text;

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptText = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') return '';
  if (!encryptedText.startsWith('enc:')) {
    return encryptedText; // Legacy unencrypted fallback
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) return '';

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.warn('[ENCRYPTION DECRYPT NOTICE]: Could not decrypt secret string:', err.message);
    return '';
  }
};

import { describe, it, expect } from 'vitest';
import { encryptText, decryptText } from '../utils/encryption.js';

describe('Custom AI Key Encryption & Decryption Tests', () => {
  it('should encrypt a plaintext string into enc: format', () => {
    const rawKey = 'sk-proj-test1234567890abcdefghijklm';
    const encrypted = encryptText(rawKey);

    expect(encrypted).not.toBe(rawKey);
    expect(encrypted.startsWith('enc:')).toBe(true);
    const parts = encrypted.split(':');
    expect(parts.length).toBe(4);
  });

  it('should decrypt an encrypted string back to original plaintext', () => {
    const rawKey = 'sk-proj-test1234567890abcdefghijklm';
    const encrypted = encryptText(rawKey);
    const decrypted = decryptText(encrypted);

    expect(decrypted).toBe(rawKey);
  });

  it('should handle legacy unencrypted strings transparently', () => {
    const legacyKey = 'sk-legacy-plaintext-key-12345';
    const decrypted = decryptText(legacyKey);

    expect(decrypted).toBe(legacyKey);
  });

  it('should return empty string for empty inputs', () => {
    expect(encryptText('')).toBe('');
    expect(decryptText('')).toBe('');
    expect(encryptText(null)).toBe('');
    expect(decryptText(null)).toBe('');
  });

  it('should return already encrypted string if passed to encryptText again', () => {
    const rawKey = 'gsk_123456789';
    const encryptedOnce = encryptText(rawKey);
    const encryptedTwice = encryptText(encryptedOnce);

    expect(encryptedTwice).toBe(encryptedOnce);
  });
});

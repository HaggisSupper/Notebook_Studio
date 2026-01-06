import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encryptData, decryptData, storeApiKey, getApiKey, removeApiKey } from './encryption';

describe('encryption utilities', () => {
  let encryptionKey: string | null = null;

  beforeEach(() => {
    // Save the encryption key before clearing
    encryptionKey = localStorage.getItem('__app_encryption_key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test data but restore encryption key if it existed
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key !== '__app_encryption_key') {
        localStorage.removeItem(key);
      }
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'my-secret-api-key-12345';
      const encrypted = encryptData(originalData);
      
      // Encrypted data should be different from original
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.length).toBeGreaterThan(0);
      
      // Decrypted data should match original
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptData('');
      expect(encrypted).toBe('');
      
      const decrypted = decryptData('');
      expect(decrypted).toBe('');
    });

    it('should return empty string for invalid encrypted data', () => {
      const decrypted = decryptData('invalid-encrypted-data');
      expect(decrypted).toBe('');
    });

    it('should use consistent encryption key', () => {
      const data = 'test-key';
      const encrypted1 = encryptData(data);
      const encrypted2 = encryptData(data);
      
      // Decryption should work for both
      expect(decryptData(encrypted1)).toBe(data);
      expect(decryptData(encrypted2)).toBe(data);
    });
  });

  describe('storeApiKey and getApiKey', () => {
    it('should store and retrieve an API key', () => {
      const keyName = 'test_api_key';
      const apiKey = 'sk-test-123456789';
      
      storeApiKey(keyName, apiKey);
      
      // Verify stored data is encrypted
      const stored = localStorage.getItem(keyName);
      expect(stored).not.toBe(apiKey);
      expect(stored).toBeTruthy();
      
      // Verify retrieval decrypts correctly
      const retrieved = getApiKey(keyName);
      expect(retrieved).toBe(apiKey);
    });

    it('should remove API key when storing empty string', () => {
      const keyName = 'test_api_key';
      
      storeApiKey(keyName, 'initial-key');
      expect(localStorage.getItem(keyName)).toBeTruthy();
      
      storeApiKey(keyName, '');
      expect(localStorage.getItem(keyName)).toBeNull();
    });

    it('should return empty string for non-existent key', () => {
      const retrieved = getApiKey('non_existent_key');
      expect(retrieved).toBe('');
    });

    it('should handle multiple API keys', () => {
      const keys = {
        'google_key': 'AIza123456',
        'openai_key': 'sk-123456',
        'tavily_key': 'tvly-123456',
      };
      
      // Store all keys
      Object.entries(keys).forEach(([name, value]) => {
        storeApiKey(name, value);
      });
      
      // Verify all keys can be retrieved
      Object.entries(keys).forEach(([name, value]) => {
        expect(getApiKey(name)).toBe(value);
      });
    });
  });

  describe('removeApiKey', () => {
    it('should remove an API key from localStorage', () => {
      const keyName = 'test_api_key';
      const apiKey = 'test-key-value';
      
      storeApiKey(keyName, apiKey);
      expect(getApiKey(keyName)).toBe(apiKey);
      
      removeApiKey(keyName);
      expect(getApiKey(keyName)).toBe('');
      expect(localStorage.getItem(keyName)).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => removeApiKey('non_existent_key')).not.toThrow();
    });
  });
});

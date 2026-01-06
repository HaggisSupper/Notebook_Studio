import CryptoJS from 'crypto-js';

// Generate a unique encryption key for this browser session
// NOTE: This key is stored in localStorage. If localStorage is cleared,
// encrypted data becomes unrecoverable. For production use, consider:
// - Deriving key from user password
// - Implementing a backup/recovery mechanism
// - Using browser's SubtleCrypto API with non-extractable keys
const getEncryptionKey = (): string => {
  let key = localStorage.getItem('__app_encryption_key');
  if (!key) {
    // Generate a random key unique to this browser
    key = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem('__app_encryption_key', key);
  }
  return key;
};

/**
 * Encrypts sensitive data (like API keys) before storing in localStorage
 */
export const encryptData = (data: string): string => {
  if (!data) return '';
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
};

/**
 * Decrypts sensitive data from localStorage
 */
export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return '';
  }
};

/**
 * Securely stores an API key in localStorage
 */
export const storeApiKey = (keyName: string, apiKey: string): void => {
  if (!apiKey) {
    localStorage.removeItem(keyName);
    return;
  }
  const encrypted = encryptData(apiKey);
  localStorage.setItem(keyName, encrypted);
};

/**
 * Retrieves and decrypts an API key from localStorage
 */
export const getApiKey = (keyName: string): string => {
  const encrypted = localStorage.getItem(keyName);
  if (!encrypted) return '';
  return decryptData(encrypted);
};

/**
 * Removes an API key from localStorage
 */
export const removeApiKey = (keyName: string): void => {
  localStorage.removeItem(keyName);
};

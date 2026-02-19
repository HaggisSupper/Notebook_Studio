import { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

// Simple encryption key - In production, this could be more sophisticated
// or use Web Crypto API. For a client-side only app, this provides basic obfuscation.
// NOTE: This is NOT true security - anyone with browser dev tools can access localStorage.
// The encryption primarily protects against casual observation and accidental exposure.
const ENCRYPTION_KEY = 'notebook-studio-secure-key-2024';

/**
 * Encrypts sensitive data before storing in localStorage
 */
function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts sensitive data retrieved from localStorage
 */
function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted');
  }
}

/**
 * Custom hook for persisting state to localStorage with optional encryption
 * @param key - The localStorage key
 * @param initialValue - Initial value if nothing is stored
 * @param encrypt - Whether to encrypt the data (use for sensitive data like API keys)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  encrypt: boolean = false
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      if (!item) {
        return initialValue;
      }
      
      // Decrypt if needed
      const decryptedItem = encrypt ? decryptData(item) : item;
      
      // Parse stored json or return initialValue if parsing fails
      return decryptedItem ? JSON.parse(decryptedItem) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      const stringValue = JSON.stringify(valueToStore);
      const finalValue = encrypt ? encryptData(stringValue) : stringValue;
      window.localStorage.setItem(key, finalValue);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}

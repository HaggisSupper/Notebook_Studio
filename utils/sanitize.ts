/**
 * Sanitization utilities for user input
 */

/**
 * Sanitize text to prevent XSS attacks
 * Removes potentially dangerous HTML/script content
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove script tags and their content
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
};

/**
 * Sanitize filename to prevent path traversal
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename) return 'untitled';
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\]/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim()
    || 'untitled';
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.href;
  } catch {
    return null;
  }
};

/**
 * Escape HTML entities to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  if (!text) return '';
  
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Limit string length to prevent DoS attacks
 */
export const limitLength = (text: string, maxLength: number = 10000): string => {
  if (!text) return '';
  return text.slice(0, maxLength);
};

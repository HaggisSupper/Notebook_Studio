/**
 * Sanitization utilities for user input
 * 
 * NOTE: These are basic sanitization utilities. For production HTML sanitization,
 * consider using a well-tested library like DOMPurify.
 * These functions are designed to handle common cases but may not catch all XSS vectors.
 */

/**
 * Escape HTML to prevent XSS attacks
 * This is the recommended approach for displaying user content
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
 * Basic text sanitization - removes dangerous patterns
 * WARNING: This is NOT comprehensive. Use escapeHtml for user content display.
 * This function is only for pre-processing text where HTML removal is acceptable.
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  let sanitized = text;
  
  // Remove all script tags and their content
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script[\s\S]*?>/gi, '');
  
  // Remove all event handlers - multi-pass to handle nested attributes
  let prevLength;
  do {
    prevLength = sanitized.length;
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  } while (sanitized.length < prevLength);
  
  // Remove dangerous protocols
  sanitized = sanitized.replace(/(javascript|vbscript|data):/gi, 'removed:');
  
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
 * Returns null if URL is invalid or uses a dangerous protocol
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols (not javascript:, data:, vbscript:, etc.)
    if (!['http:', 'https:'].includes(urlObj.protocol.toLowerCase())) {
      return null;
    }
    
    return urlObj.href;
  } catch {
    return null;
  }
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


export const sanitizeText = (text: string): string => {
  if (!text) return '';
  // Basic sanitization: remove null bytes, control characters (except newlines/tabs)
  // This is a placeholder for more robust sanitization if needed.
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
    }
    return parsed.toString();
  } catch (e) {
    return '';
  }
};

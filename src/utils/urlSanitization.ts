/**
 * URL Sanitization Utilities
 * 
 * Provides safe URL handling for external links to prevent XSS attacks.
 */

/**
 * Sanitizes a URL for safe use in href attributes
 * Only allows http/https protocols and validates URL format
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return null;
  }

  try {
    const urlObj = new URL(trimmedUrl);
    
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }

    // Return the sanitized URL
    return urlObj.toString();
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Checks if a URL is safe to use in an href attribute
 * 
 * @param url - URL to check
 * @returns true if URL is safe
 */
export function isUrlSafe(url: string | null | undefined): boolean {
  return sanitizeUrl(url) !== null;
}


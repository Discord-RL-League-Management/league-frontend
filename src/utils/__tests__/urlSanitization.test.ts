/**
 * Black Box Tests for URL Sanitization Utilities
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable side effects)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { sanitizeUrl, isUrlSafe } from '../urlSanitization.js';

describe('sanitizeUrl', () => {
  describe('returns null for invalid input types', () => {
    test('returns null when URL is null', () => {
      expect(sanitizeUrl(null)).toBe(null);
    });

    test('returns null when URL is undefined', () => {
      expect(sanitizeUrl(undefined)).toBe(null);
    });

    test.each([
      [0, 'number zero'],
      [42, 'number'],
      [false, 'boolean false'],
      [true, 'boolean true'],
      [{}, 'empty object'],
      [[], 'empty array'],
      [{ url: 'https://example.com' }, 'object with url property'],
    ])('returns null when URL is %s', (input, _description) => {
      expect(sanitizeUrl(input as unknown as string)).toBe(null);
    });
  });

  describe('returns null for empty/whitespace inputs', () => {
    test('returns null when URL is empty string', () => {
      expect(sanitizeUrl('')).toBe(null);
    });

    test('returns null when URL is whitespace only', () => {
      expect(sanitizeUrl('   ')).toBe(null);
    });

    test('returns null when URL is tab characters only', () => {
      expect(sanitizeUrl('\t\t\t')).toBe(null);
    });

    test('returns null when URL is newline characters only', () => {
      expect(sanitizeUrl('\n\n\n')).toBe(null);
    });

    test('returns null when URL is mixed whitespace only', () => {
      expect(sanitizeUrl(' \t\n ')).toBe(null);
    });
  });

  describe('returns null for malformed URLs', () => {
    test('returns null for non-URL string', () => {
      expect(sanitizeUrl('not a url')).toBe(null);
    });

    test('returns null for string without protocol', () => {
      expect(sanitizeUrl('example.com')).toBe(null);
    });

    test('returns null for incomplete URL', () => {
      expect(sanitizeUrl('https://')).toBe(null);
    });

    test('returns null for relative URL', () => {
      expect(sanitizeUrl('/path/to/resource')).toBe(null);
    });

    test('returns null for protocol-relative URL', () => {
      expect(sanitizeUrl('//example.com')).toBe(null);
    });

    test('returns null for invalid URL format', () => {
      expect(sanitizeUrl('://example.com')).toBe(null);
    });

    test('returns null for URL with only protocol', () => {
      expect(sanitizeUrl('http://')).toBe(null);
    });
  });

  describe('returns null for unsafe protocols (Security Critical)', () => {
    test('returns null for javascript: protocol (XSS vector)', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe(null);
    });

    test('returns null for javascript: protocol with encoded payload', () => {
      expect(sanitizeUrl('javascript:void(0)')).toBe(null);
    });

    test('returns null for data: protocol (XSS vector)', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe(null);
    });

    test('returns null for data: protocol with base64', () => {
      expect(sanitizeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')).toBe(null);
    });

    test('returns null for file: protocol', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBe(null);
    });

    test('returns null for ftp: protocol', () => {
      expect(sanitizeUrl('ftp://example.com/file.txt')).toBe(null);
    });

    test('returns null for mailto: protocol', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe(null);
    });

    test('returns null for about: protocol', () => {
      expect(sanitizeUrl('about:blank')).toBe(null);
    });

    test('returns null for chrome-extension: protocol', () => {
      expect(sanitizeUrl('chrome-extension://abcdefghijklmnop/script.js')).toBe(null);
    });

    test('returns null for vbscript: protocol', () => {
      expect(sanitizeUrl('vbscript:msgbox("XSS")')).toBe(null);
    });

    test.each([
      ['JAVASCRIPT:alert(1)', 'uppercase javascript'],
      ['JavaScript:alert(1)', 'mixed case javascript'],
      ['DATA:text/html,<script>alert(1)</script>', 'uppercase data'],
      ['Data:text/html,test', 'mixed case data'],
      ['FILE:///etc/passwd', 'uppercase file'],
      ['FTP://example.com', 'uppercase ftp'],
    ])('returns null for %s protocol', (url, _description) => {
      expect(sanitizeUrl(url)).toBe(null);
    });
  });

  describe('returns sanitized URL for valid HTTP/HTTPS URLs', () => {
    test('returns sanitized URL for simple HTTPS URL', () => {
      const result = sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    test('returns sanitized URL for simple HTTP URL', () => {
      const result = sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com/');
    });

    test('returns sanitized URL with path segments', () => {
      const result = sanitizeUrl('https://example.com/path/to/resource');
      expect(result).toBe('https://example.com/path/to/resource');
    });

    test('returns sanitized URL with query parameters', () => {
      const result = sanitizeUrl('https://example.com/path?param1=value1&param2=value2');
      expect(result).toBe('https://example.com/path?param1=value1&param2=value2');
    });

    test('returns sanitized URL with hash fragments', () => {
      const result = sanitizeUrl('https://example.com/path#section');
      expect(result).toBe('https://example.com/path#section');
    });

    test('returns sanitized URL with both query and hash', () => {
      const result = sanitizeUrl('https://example.com/path?query=value#hash');
      expect(result).toBe('https://example.com/path?query=value#hash');
    });

    test('returns sanitized URL with port numbers', () => {
      const result = sanitizeUrl('https://example.com:8080/path');
      expect(result).toBe('https://example.com:8080/path');
    });

    test('removes default HTTPS port (443) in normalized URL', () => {
      const result = sanitizeUrl('https://example.com:443/path');
      expect(result).toBe('https://example.com/path');
    });

    test('removes default HTTP port (80) in normalized URL', () => {
      const result = sanitizeUrl('http://example.com:80/path');
      expect(result).toBe('http://example.com/path');
    });

    test('returns sanitized URL with authentication', () => {
      const result = sanitizeUrl('https://user:pass@example.com/path');
      expect(result).toBe('https://user:pass@example.com/path');
    });

    test('handles URLs with trailing slashes', () => {
      const result = sanitizeUrl('https://example.com/path/');
      expect(result).toBe('https://example.com/path/');
    });

    test('handles URLs with special characters (URL-encoded)', () => {
      const result = sanitizeUrl('https://example.com/path%20with%20spaces?key=value%20here');
      expect(result).toBe('https://example.com/path%20with%20spaces?key=value%20here');
    });

    test('handles URLs with multiple query parameters', () => {
      const result = sanitizeUrl('https://example.com/search?q=test&page=1&sort=desc');
      expect(result).toBe('https://example.com/search?q=test&page=1&sort=desc');
    });

    test('handles URLs with subdomains', () => {
      const result = sanitizeUrl('https://www.example.com/path');
      expect(result).toBe('https://www.example.com/path');
    });

    test('handles URLs with multiple path segments', () => {
      const result = sanitizeUrl('https://example.com/api/v1/users/123');
      expect(result).toBe('https://example.com/api/v1/users/123');
    });
  });

  describe('handles whitespace correctly', () => {
    test('trims whitespace from beginning', () => {
      const result = sanitizeUrl('  https://example.com');
      expect(result).toBe('https://example.com/');
    });

    test('trims whitespace from end', () => {
      const result = sanitizeUrl('https://example.com  ');
      expect(result).toBe('https://example.com/');
    });

    test('trims whitespace from both ends', () => {
      const result = sanitizeUrl('  https://example.com  ');
      expect(result).toBe('https://example.com/');
    });

    test('handles mixed whitespace at boundaries', () => {
      const result = sanitizeUrl('\t\n https://example.com \t\n');
      expect(result).toBe('https://example.com/');
    });
  });

  describe('URL normalization behavior', () => {
    test('normalizes protocol to lowercase', () => {
      const result = sanitizeUrl('HTTP://example.com');
      expect(result).toBe('http://example.com/');
    });

    test('normalizes HTTPS protocol to lowercase', () => {
      const result = sanitizeUrl('HTTPS://example.com');
      expect(result).toBe('https://example.com/');
    });

    test('normalizes mixed case protocol', () => {
      const result = sanitizeUrl('Http://example.com');
      expect(result).toBe('http://example.com/');
    });

    test('normalizes hostname to lowercase', () => {
      const result = sanitizeUrl('https://EXAMPLE.COM');
      expect(result).toBe('https://example.com/');
    });

    test('normalizes mixed case hostname', () => {
      const result = sanitizeUrl('https://Example.Com');
      expect(result).toBe('https://example.com/');
    });

    test('normalizes path resolution (parent directory)', () => {
      const result = sanitizeUrl('https://example.com/path/../other');
      expect(result).toBe('https://example.com/other');
    });

    test('normalizes path resolution (current directory)', () => {
      const result = sanitizeUrl('https://example.com/path/./other');
      expect(result).toBe('https://example.com/path/other');
    });

    test('preserves URL structure while sanitizing', () => {
      const input = 'https://example.com/path?query=value#hash';
      const result = sanitizeUrl(input);
      expect(result).toContain('https://example.com');
      expect(result).toContain('/path');
      expect(result).toContain('query=value');
      expect(result).toContain('#hash');
    });
  });

  describe('edge cases and special scenarios', () => {
    test('handles URLs with IPv4 addresses', () => {
      const result = sanitizeUrl('http://192.168.1.1');
      expect(result).toBe('http://192.168.1.1/');
    });

    test('handles URLs with IPv6 addresses', () => {
      const result = sanitizeUrl('http://[2001:db8::1]');
      expect(result).toBe('http://[2001:db8::1]/');
    });

    test('handles URLs with port and path', () => {
      const result = sanitizeUrl('http://localhost:3000/api');
      expect(result).toBe('http://localhost:3000/api');
    });

    test('handles root path URL', () => {
      const result = sanitizeUrl('https://example.com/');
      expect(result).toBe('https://example.com/');
    });

    test('handles empty path URL', () => {
      const result = sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    test('handles URLs with percent-encoded characters', () => {
      const result = sanitizeUrl('https://example.com/test%2Fpath');
      expect(result).toBe('https://example.com/test%2Fpath');
    });
  });
});

describe('isUrlSafe', () => {
  describe('delegates to sanitizeUrl correctly', () => {
    test('returns true when sanitizeUrl returns a string', () => {
      expect(isUrlSafe('https://example.com')).toBe(true);
    });

    test('returns false when sanitizeUrl returns null', () => {
      expect(isUrlSafe(null)).toBe(false);
    });
  });

  describe('returns true for safe URLs', () => {
    test('returns true for valid HTTP URL', () => {
      expect(isUrlSafe('http://example.com')).toBe(true);
    });

    test('returns true for valid HTTPS URL', () => {
      expect(isUrlSafe('https://example.com')).toBe(true);
    });

    test('returns true for HTTPS URL with path', () => {
      expect(isUrlSafe('https://example.com/path')).toBe(true);
    });

    test('returns true for HTTPS URL with query parameters', () => {
      expect(isUrlSafe('https://example.com?key=value')).toBe(true);
    });

    test('returns true for HTTPS URL with hash', () => {
      expect(isUrlSafe('https://example.com#section')).toBe(true);
    });
  });

  describe('returns false for unsafe/invalid URLs', () => {
    test('returns false for javascript: protocol', () => {
      expect(isUrlSafe('javascript:alert(1)')).toBe(false);
    });

    test('returns false for data: protocol', () => {
      expect(isUrlSafe('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    test('returns false for file: protocol', () => {
      expect(isUrlSafe('file:///etc/passwd')).toBe(false);
    });

    test('returns false for invalid URLs', () => {
      expect(isUrlSafe('not a url')).toBe(false);
    });

    test('returns false for URL without protocol', () => {
      expect(isUrlSafe('example.com')).toBe(false);
    });

    test('returns false for null input', () => {
      expect(isUrlSafe(null)).toBe(false);
    });

    test('returns false for undefined input', () => {
      expect(isUrlSafe(undefined)).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isUrlSafe('')).toBe(false);
    });

    test('returns false for whitespace only', () => {
      expect(isUrlSafe('   ')).toBe(false);
    });

    test('returns false for relative URL', () => {
      expect(isUrlSafe('/path/to/resource')).toBe(false);
    });

    test('returns false for protocol-relative URL', () => {
      expect(isUrlSafe('//example.com')).toBe(false);
    });
  });

  describe('parameter combinations', () => {
    test.each([
      ['https://example.com', true, 'valid HTTPS URL'],
      ['http://example.com', true, 'valid HTTP URL'],
      ['javascript:alert(1)', false, 'javascript protocol'],
      ['data:text/html,test', false, 'data protocol'],
      ['', false, 'empty string'],
      ['   ', false, 'whitespace'],
      [null, false, 'null'],
      [undefined, false, 'undefined'],
      ['not a url', false, 'invalid format'],
    ])('returns %s for %s', (url, expected, _description) => {
      expect(isUrlSafe(url)).toBe(expected);
    });
  });
});


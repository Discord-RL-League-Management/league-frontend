/**
 * Black Box Tests for Tracker URL Validation Utility
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (inputs, outputs, observable side effects)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import { validateTrackerUrl, type ValidationResult } from '../trackerValidation.js';

describe('validateTrackerUrl', () => {
  describe('returns invalid for empty/whitespace inputs', () => {
    test('returns invalid when URL is empty string', () => {
      const result = validateTrackerUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
      expect(result.platform).toBeUndefined();
      expect(result.username).toBeUndefined();
    });

    test('returns invalid when URL is whitespace only', () => {
      const result = validateTrackerUrl('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    test('returns invalid when URL is tab characters only', () => {
      const result = validateTrackerUrl('\t\t\t');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    test('returns invalid when URL is newline characters only', () => {
      const result = validateTrackerUrl('\n\n\n');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    test('returns invalid when URL is mixed whitespace only', () => {
      const result = validateTrackerUrl(' \t\n ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });
  });

  describe('returns invalid for malformed URL formats', () => {
    test('returns invalid for non-URL string', () => {
      const result = validateTrackerUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    test('returns invalid for string without protocol', () => {
      const result = validateTrackerUrl('rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    test('returns invalid for incomplete URL', () => {
      const result = validateTrackerUrl('https://');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('returns invalid for wrong protocol', () => {
    test('returns invalid for HTTP protocol', () => {
      const result = validateTrackerUrl('http://rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('returns invalid for FTP protocol', () => {
      const result = validateTrackerUrl('ftp://rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('returns invalid for file protocol', () => {
      const result = validateTrackerUrl('file://rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });
  });

  describe('returns invalid for wrong hostname', () => {
    test('returns invalid for different domain', () => {
      const result = validateTrackerUrl('https://google.com/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('returns invalid for wrong subdomain', () => {
      const result = validateTrackerUrl('https://www.rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('returns invalid for tracker.network without rocketleague', () => {
      const result = validateTrackerUrl('https://tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('accepts case variation in hostname (normalized by URL constructor)', () => {
      // URL constructor normalizes hostname to lowercase, so this is valid
      const result = validateTrackerUrl('https://RocketLeague.Tracker.Network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });
  });

  describe('returns invalid for incorrect pathname format', () => {
    test('returns invalid when missing /rocket-league/profile/ prefix', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/profile/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid when missing /overview suffix', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for wrong path segment', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/stats/steam/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for extra path segments', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview/extra');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for missing platform segment', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile//user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for missing username segment', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam//overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });
  });

  describe('handles trailing slashes correctly', () => {
    test('returns valid for URL without trailing slash', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });

    test('returns valid for URL with single trailing slash', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview/');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });

    test('returns valid for URL with multiple trailing slashes (normalized)', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview///');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });
  });

  describe('validates platform correctly', () => {
    test.each([
      ['steam', 'steam'],
      ['epic', 'epic'],
      ['xbl', 'xbl'],
      ['psn', 'psn'],
      ['switch', 'switch'],
    ])('returns valid for platform %s', (platform, expectedPlatform) => {
      const result = validateTrackerUrl(`https://rocketleague.tracker.network/rocket-league/profile/${platform}/user/overview`);
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(expectedPlatform);
      expect(result.username).toBe('user');
    });

    test('returns valid for platform with uppercase (case insensitive)', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/STEAM/user/overview');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });

    test('returns valid for platform with mixed case (normalized to lowercase)', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/SteAm/user/overview');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('steam');
      expect(result.username).toBe('user');
    });

    test('returns invalid for unsupported platform', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/pc/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unsupported platform: pc. Supported platforms: steam, epic, xbl, psn, switch');
    });

    test('returns invalid for empty platform segment', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile//user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for platform with special characters', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam@123/user/overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Unsupported platform: steam@123. Supported platforms: steam, epic, xbl, psn, switch');
    });
  });

  describe('validates username correctly', () => {
    test('returns valid for alphanumeric username', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/Player123/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('Player123');
    });

    test('returns valid for numeric username (Steam ID)', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/76561198051701160/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('76561198051701160');
    });

    test('returns valid for username with underscores', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/epic/user_name/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user_name');
    });

    test('returns valid for username with hyphens', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/psn/user-name/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user-name');
    });

    test('returns valid for username with dots', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/xbl/user.name/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user.name');
    });

    test('returns valid for username with URL-encoded characters', () => {
      // Regex extracts the raw match, so URL-encoded characters remain encoded
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user%20name/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('user%20name');
    });

    test('returns valid for username at maximum length (100 characters)', () => {
      const longUsername = 'a'.repeat(100);
      const result = validateTrackerUrl(`https://rocketleague.tracker.network/rocket-league/profile/steam/${longUsername}/overview`);
      expect(result.isValid).toBe(true);
      expect(result.username).toBe(longUsername);
    });

    test('returns invalid for username exceeding maximum length (101 characters)', () => {
      const longUsername = 'a'.repeat(101);
      const result = validateTrackerUrl(`https://rocketleague.tracker.network/rocket-league/profile/steam/${longUsername}/overview`);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid username format in tracker URL');
    });

    test('returns invalid for empty username', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam//overview');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('preserves username case', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/PlayerName/overview');
      expect(result.isValid).toBe(true);
      expect(result.username).toBe('PlayerName');
    });
  });

  describe('returns valid result structure for valid URLs', () => {
    test.each([
      ['steam', 'user123', 'steam'],
      ['epic', 'PlayerName', 'epic'],
      ['xbl', 'GamerTag', 'xbl'],
      ['psn', 'PSN_User', 'psn'],
      ['switch', 'SwitchUser', 'switch'],
    ])('returns correct structure for %s platform with username %s', (platform, username, expectedPlatform) => {
      const result = validateTrackerUrl(`https://rocketleague.tracker.network/rocket-league/profile/${platform}/${username}/overview`);
      
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(expectedPlatform);
      expect(result.username).toBe(username);
      expect(result.error).toBeUndefined();
    });

    test('returns invalid for URL with query parameters (regex is anchored)', () => {
      // Regex is anchored with ^ and $, so query parameters break the match
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview?param=value');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for URL with hash fragment (regex is anchored)', () => {
      // Regex is anchored with ^ and $, so hash fragments break the match
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview#section');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('returns invalid for URL with both query and hash (regex is anchored)', () => {
      // Regex is anchored with ^ and $, so query and hash break the match
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/steam/user/overview?param=value#section');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });
  });

  describe('error messages are consistent and informative', () => {
    test('error message for empty URL is descriptive', () => {
      const result = validateTrackerUrl('');
      expect(result.error).toBe('URL is required');
    });

    test('error message for invalid URL format is descriptive', () => {
      const result = validateTrackerUrl('not a url');
      expect(result.error).toBe('Invalid URL format');
    });

    test('error message for wrong hostname is descriptive', () => {
      const result = validateTrackerUrl('https://google.com/rocket-league/profile/steam/user/overview');
      expect(result.error).toBe('URL must be from rocketleague.tracker.network');
    });

    test('error message for invalid path format includes expected format', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/wrong/path');
      expect(result.error).toBe('Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview');
    });

    test('error message for unsupported platform includes supported platforms', () => {
      const result = validateTrackerUrl('https://rocketleague.tracker.network/rocket-league/profile/invalid/user/overview');
      expect(result.error).toBe('Unsupported platform: invalid. Supported platforms: steam, epic, xbl, psn, switch');
    });

    test('error message for invalid username is descriptive', () => {
      const longUsername = 'a'.repeat(101);
      const result = validateTrackerUrl(`https://rocketleague.tracker.network/rocket-league/profile/steam/${longUsername}/overview`);
      expect(result.error).toBe('Invalid username format in tracker URL');
    });
  });
});


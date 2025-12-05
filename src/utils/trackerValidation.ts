/**
 * Tracker URL Validation Utility
 * Matches backend validation logic for consistency
 */

const TRN_PROFILE_REGEX = /^https:\/\/rocketleague\.tracker\.network\/rocket-league\/profile\/([^/]+)\/([^/]+)\/overview\/?$/i;

const VALID_PLATFORMS = ['steam', 'epic', 'xbl', 'psn', 'switch'];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  platform?: string;
  username?: string;
}

/**
 * Validate tracker URL format
 */
export function validateTrackerUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  // Basic URL format check
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Check protocol and hostname
  if (
    urlObj.protocol !== 'https:' ||
    urlObj.hostname !== 'rocketleague.tracker.network'
  ) {
    return {
      isValid: false,
      error: 'URL must be from rocketleague.tracker.network',
    };
  }

  // Check pathname format (normalize trailing slashes to match regex behavior)
  // Regex allows 0-1 trailing slash, so normalize multiple slashes to at most one
  const normalizedPathname = urlObj.pathname.replace(/\/+$/, (match) => match.length > 1 ? '/' : match);
  if (
    !normalizedPathname.startsWith('/rocket-league/profile/') ||
    (!normalizedPathname.endsWith('/overview') && !normalizedPathname.endsWith('/overview/'))
  ) {
    return {
      isValid: false,
      error:
        'Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview',
    };
  }

  // Normalize URL for regex matching (preserve at most one trailing slash to match regex pattern)
  // Regex allows 0-1 trailing slash, so normalize multiple slashes to exactly one
  const normalizedUrl = url.replace(/\/+$/, (match) => match.length > 1 ? '/' : match);
  // Use regex to extract platform and username from normalized URL
  const match = normalizedUrl.match(TRN_PROFILE_REGEX);
  if (!match || match.length < 3) {
    return {
      isValid: false,
      error:
        'Invalid URL format. Expected: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview',
    };
  }

  const platform = match[1].toLowerCase();
  const username = match[2];

  // Validate platform
  if (!VALID_PLATFORMS.includes(platform)) {
    return {
      isValid: false,
      error: `Unsupported platform: ${platform}. Supported platforms: steam, epic, xbl, psn, switch`,
    };
  }

  // Validate username format
  if (!username || username.length === 0 || username.length > 100) {
    return {
      isValid: false,
      error: 'Invalid username format in tracker URL',
    };
  }

  return {
    isValid: true,
    platform,
    username,
  };
}


/**
 * useAbortableFetch Utility
 * 
 * Re-exports error handling utilities from utils/errorHandling.ts
 * for backward compatibility and convenience.
 * 
 * Note: The actual utilities have been moved to src/utils/errorHandling.ts
 * to follow proper separation of concerns.
 */

export {
  isAbortError,
  shouldIgnoreError,
  createAbortCleanup,
} from '@/utils/errorHandling.js';


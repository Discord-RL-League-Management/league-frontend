/**
 * API Error and Response Type Definitions
 * Standardized error handling types
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}


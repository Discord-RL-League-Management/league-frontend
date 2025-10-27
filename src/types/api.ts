/**
 * API Error and Response Type Definitions
 * Standardized error handling types
 */

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  status?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}


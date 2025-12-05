import axios, { AxiosError, type AxiosResponse, type AxiosRequestConfig } from 'axios';
import { navigate } from '../navigation.ts';

const API_URL = import.meta.env.VITE_API_URL;

const baseApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for HttpOnly JWT storage
});

// Request deduplication: prevent multiple simultaneous requests to the same endpoint
const pendingRequests = new Map<string, Promise<any>>();
const MAX_PENDING_REQUESTS = 100; // Maximum number of pending requests before cleanup
const REQUEST_TIMEOUT = 60000; // 60 seconds - force cleanup of stale requests

function createRequestKey(config: AxiosRequestConfig): string {
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}:${paramsKey}`;
}

function cleanupStaleRequests() {
  if (pendingRequests.size > MAX_PENDING_REQUESTS) {
    // If we exceed max, clear all (last resort)
    console.warn(`Clearing ${pendingRequests.size} pending requests (exceeded max ${MAX_PENDING_REQUESTS})`);
    pendingRequests.clear();
  }
}

setInterval(() => {
  cleanupStaleRequests();
}, 30000);

const createDeduplicatedRequest = (method: 'get' | 'post' | 'patch' | 'delete' | 'put') => {
  return function<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const fullConfig = { ...config, method, url };
    const key = createRequestKey(fullConfig);
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }
    
    const requestPromise = baseApi.request<T>(fullConfig).finally(() => {
      pendingRequests.delete(key);
    });
    
    // Add timeout to force cleanup if request takes too long
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(key)) {
        console.warn(`Request timeout for key: ${key}, removing from pending requests`);
        pendingRequests.delete(key);
      }
    }, REQUEST_TIMEOUT);
    
    requestPromise.finally(() => {
      clearTimeout(timeoutId);
    });
    
    pendingRequests.set(key, requestPromise);
    
    if (pendingRequests.size > MAX_PENDING_REQUESTS) {
      cleanupStaleRequests();
    }
    
    return requestPromise;
  };
};

// Create deduplicated API instance
export const api = {
  get: createDeduplicatedRequest('get'),
  post: createDeduplicatedRequest('post'),
  patch: createDeduplicatedRequest('patch'),
  delete: createDeduplicatedRequest('delete'),
  put: createDeduplicatedRequest('put'),
  request: baseApi.request.bind(baseApi),
  defaults: baseApi.defaults,
  interceptors: baseApi.interceptors,
} as typeof baseApi;

baseApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login using React Router
      navigate('/login', { replace: true });
    }
    
    // Transform error for consistent handling
    const transformedError = {
      message: (error.response?.data as any)?.message || error.message || 'Network error',
      code: (error.response?.data as any)?.code,
      details: (error.response?.data as any)?.details,
      status: error.response?.status,
    };

    return Promise.reject(transformedError);
  }
);

export default api;


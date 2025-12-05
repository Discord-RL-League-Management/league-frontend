import axios, { AxiosError, type AxiosResponse, type AxiosRequestConfig } from 'axios';
import { navigate } from '../navigation.ts';

// Use process.env in test, import.meta.env in Vite
// Access process via globalThis to avoid TypeScript errors
const nodeProcess = (globalThis as unknown as { process?: { env?: { VITE_API_URL?: string } } }).process;
let API_URL: string;
if (nodeProcess?.env?.VITE_API_URL) {
  API_URL = nodeProcess.env.VITE_API_URL;
} else {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - import.meta is a Vite-specific feature, not available in Node/test
  API_URL = import.meta.env.VITE_API_URL;
}

const baseApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for HttpOnly JWT storage
});

// Request deduplication: prevent multiple simultaneous requests to the same endpoint
const pendingRequests = new Map<string, Promise<AxiosResponse<unknown>>>();
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
  return function<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const fullConfig = { ...config, method, url };
    const key = createRequestKey(fullConfig);
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)! as Promise<AxiosResponse<T>>;
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
    const errorData = error.response?.data as { message?: string; code?: string; details?: Record<string, unknown> } | undefined;
    const transformedError = {
      message: errorData?.message || error.message || 'Network error',
      code: errorData?.code,
      details: errorData?.details,
      status: error.response?.status,
    };

    return Promise.reject(transformedError);
  }
);

export default api;


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

// Helper function to create a unique key for a request
function createRequestKey(config: AxiosRequestConfig): string {
  const paramsKey = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase() || 'GET'}:${config.url}:${paramsKey}`;
}

// Wrap axios methods to add deduplication
const createDeduplicatedRequest = (method: 'get' | 'post' | 'patch' | 'delete' | 'put') => {
  return function<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const fullConfig = { ...config, method, url };
    const key = createRequestKey(fullConfig);
    
    // If a request with this key is already in flight, return the existing promise
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!;
    }
    
    // Create the request promise and store it
    const requestPromise = baseApi.request<T>(fullConfig).finally(() => {
      // Remove from pending requests when done (success or error)
      pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, requestPromise);
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

// Response interceptor for error handling
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


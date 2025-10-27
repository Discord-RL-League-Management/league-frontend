import axios, { AxiosError, type AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for HttpOnly JWT storage
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
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


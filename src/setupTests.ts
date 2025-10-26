import { configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3000';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { frontendFixtures } from '../fixtures/member.fixtures.js';

/**
 * Frontend Test Setup Utilities
 * Helper functions for rendering components with providers and mocking API clients
 */

/**
 * Custom render function that includes necessary providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * Create a mock API client for testing
 */
export const createMockApiClient = () => {
  const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  };

  // Set default successful responses
  mockClient.get.mockResolvedValue(frontendFixtures.createMockApiResponse({}));
  mockClient.post.mockResolvedValue(frontendFixtures.createMockApiResponse({}));
  mockClient.patch.mockResolvedValue(frontendFixtures.createMockApiResponse({}));
  mockClient.delete.mockResolvedValue(frontendFixtures.createMockApiResponse({}));
  mockClient.put.mockResolvedValue(frontendFixtures.createMockApiResponse({}));

  return mockClient;
};

/**
 * Create a mock guild API client
 */
export const createMockGuildApi = () => {
  const mockGuildApi = {
    getMyGuilds: jest.fn(),
    getGuild: jest.fn(),
    getGuildSettings: jest.fn(),
    updateGuildSettings: jest.fn(),
    resetGuildSettings: jest.fn(),
    getSettingsHistory: jest.fn(),
    getGuildChannels: jest.fn(),
    getGuildRoles: jest.fn(),
    getGuildMembers: jest.fn(),
    getGuildMember: jest.fn(),
    searchGuildMembers: jest.fn(),
  };

  // Set default successful responses
  mockGuildApi.getMyGuilds.mockResolvedValue([frontendFixtures.createMockGuild()]);
  mockGuildApi.getGuild.mockResolvedValue(frontendFixtures.createMockGuild());
  mockGuildApi.getGuildSettings.mockResolvedValue({
    guildId: '987654321098765432',
    prefix: '!',
    welcomeChannel: null,
    logChannel: null,
  });
  mockGuildApi.updateGuildSettings.mockResolvedValue({
    guildId: '987654321098765432',
    prefix: '!',
    welcomeChannel: null,
    logChannel: null,
  });
  mockGuildApi.resetGuildSettings.mockResolvedValue({ success: true });
  mockGuildApi.getSettingsHistory.mockResolvedValue([]);
  mockGuildApi.getGuildChannels.mockResolvedValue([]);
  mockGuildApi.getGuildRoles.mockResolvedValue([]);
  mockGuildApi.getGuildMembers.mockResolvedValue(frontendFixtures.createMemberListResponse());
  mockGuildApi.getGuildMember.mockResolvedValue(frontendFixtures.createMockApiMember());
  mockGuildApi.searchGuildMembers.mockResolvedValue(frontendFixtures.createSearchResults('test'));

  return mockGuildApi;
};

/**
 * Mock the guild API module
 */
export const mockGuildApi = (overrides: any = {}) => {
  const mockApi = createMockGuildApi();
  Object.assign(mockApi, overrides);
  
  jest.doMock('@/lib/api/guilds', () => ({
    guildApi: mockApi,
  }));
  
  return mockApi;
};

/**
 * Create a mock router for testing navigation
 */
export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

/**
 * Create a mock navigation hook
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  canGoForward: jest.fn().mockReturnValue(false),
});

/**
 * Create a mock window object for testing
 */
export const createMockWindow = () => ({
  location: {
    href: 'http://localhost:3000',
    pathname: '/dashboard',
    search: '',
    hash: '',
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  sessionStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

/**
 * Create a mock IntersectionObserver for lazy loading tests
 */
export const createMockIntersectionObserver = () => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

/**
 * Create a mock ResizeObserver for responsive tests
 */
export const createMockResizeObserver = () => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

/**
 * Create a mock fetch function
 */
export const createMockFetch = (responseData: any, ok: boolean = true, status: number = 200) => {
  return jest.fn().mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(responseData),
    text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
    blob: jest.fn().mockResolvedValue(new Blob()),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  });
};

/**
 * Create a mock timers for async tests
 */
export const createMockTimers = () => ({
  setTimeout: jest.fn(),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
  setImmediate: jest.fn(),
  clearImmediate: jest.fn(),
});

/**
 * Create a mock console for testing console methods
 */
export const createMockConsole = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
});

/**
 * Create a mock event for testing event handlers
 */
export const createMockEvent = (type: string = 'click', overrides: any = {}) => ({
  type,
  target: {
    value: '',
    checked: false,
  },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  ...overrides,
});

/**
 * Create a mock form event
 */
export const createMockFormEvent = () => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: {
    elements: {
      namedItem: jest.fn(),
    },
  },
});

/**
 * Create a mock change event
 */
export const createMockChangeEvent = (value: string = '') => ({
  target: {
    value,
    checked: false,
  },
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
});

/**
 * Create a mock click event
 */
export const createMockClickEvent = () => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  currentTarget: {
    value: '',
  },
});

/**
 * Test helper to wait for async operations
 */
export const waitFor = (callback: () => void, timeout: number = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout after ${timeout}ms`));
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

/**
 * Test helper to create a promise that resolves after a delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Test helper to create a promise that rejects after a delay
 */
export const delayReject = (ms: number, error: Error = new Error('Timeout')): Promise<never> => {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
};

/**
 * Test helper to create a mock function that resolves after a delay
 */
export const createDelayedMock = <T extends unknown>(value: T, delayMs: number = 100): jest.MockedFunction<() => Promise<T>> => {
  return jest.fn().mockImplementation(() => delay(delayMs).then(() => value));
};

/**
 * Test helper to create a mock function that rejects after a delay
 */
export const createDelayedRejectMock = (error: Error, delayMs: number = 100): jest.MockedFunction<() => Promise<never>> => {
  return jest.fn().mockImplementation(() => delayReject(delayMs, error));
};

/**
 * Test helper to create a mock function that resolves/rejects randomly
 */
export const createRandomMock = <T extends unknown>(
  successValue: T,
  errorValue: Error,
  successRate: number = 0.8
): jest.MockedFunction<() => Promise<T>> => {
  return jest.fn().mockImplementation(() => {
    if (Math.random() < successRate) {
      return Promise.resolve(successValue);
    } else {
      return Promise.reject(errorValue);
    }
  });
};

/**
 * Test helper to create a mock function that fails on first call, succeeds on retry
 */
export const createRetryMock = <T extends unknown>(value: T): jest.MockedFunction<() => Promise<T>> => {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.reject(new Error('First call fails'));
    } else {
      return Promise.resolve(value);
    }
  });
};

/**
 * Test helper to create a mock that returns different values based on input
 */
export const createConditionalMock = <T extends unknown>(
  condition: (input: any) => boolean,
  trueValue: T,
  falseValue: T
): jest.MockedFunction<(input: any) => Promise<T>> => {
  return jest.fn().mockImplementation((input: any) => {
    return Promise.resolve(condition(input) ? trueValue : falseValue);
  });
};

/**
 * Test helper to create a mock that throws different errors based on input
 */
export const createConditionalErrorMock = (
  condition: (input: any) => boolean,
  trueError: Error,
  falseError: Error
): jest.MockedFunction<(input: any) => Promise<never>> => {
  return jest.fn().mockImplementation((input: any) => {
    return Promise.reject(condition(input) ? trueError : falseError);
  });
};

/**
 * Test helper to create a mock that counts calls
 */
export const createCountingMock = <T extends unknown>(value: T): jest.MockedFunction<() => Promise<T>> & { callCount: number } => {
  let callCount = 0;
  const mockFn = jest.fn().mockImplementation(() => {
    callCount++;
    return Promise.resolve(value);
  });
  
  Object.defineProperty(mockFn, 'callCount', {
    get: () => callCount,
  });
  
  return mockFn as any;
};

/**
 * Test helper to create a mock that tracks all calls
 */
export const createTrackingMock = <T extends unknown>(value: T): jest.MockedFunction<(...args: any[]) => Promise<T>> & { calls: any[][] } => {
  const calls: any[][] = [];
  const mockFn = jest.fn().mockImplementation((...args: any[]) => {
    calls.push(args);
    return Promise.resolve(value);
  });
  
  Object.defineProperty(mockFn, 'calls', {
    get: () => calls,
  });
  
  return mockFn as any;
};

/**
 * Test helper to mock window properties
 */
export const mockWindowProperty = (property: string, value: any) => {
  const originalProperty = (window as any)[property];
  (window as any)[property] = value;
  
  return () => {
    (window as any)[property] = originalProperty;
  };
};

/**
 * Test helper to mock localStorage
 */
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  
  return mockStorage;
};

/**
 * Test helper to mock sessionStorage
 */
export const mockSessionStorage = () => {
  const store: { [key: string]: string } = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });
  
  return mockStorage;
};

/**
 * Test helper to mock IntersectionObserver
 */
export const mockIntersectionObserver = () => {
  const mockObserver = createMockIntersectionObserver();
  
  Object.defineProperty(window, 'IntersectionObserver', {
    value: jest.fn().mockImplementation(() => mockObserver),
    writable: true,
  });
  
  return mockObserver;
};

/**
 * Test helper to mock ResizeObserver
 */
export const mockResizeObserver = () => {
  const mockObserver = createMockResizeObserver();
  
  Object.defineProperty(window, 'ResizeObserver', {
    value: jest.fn().mockImplementation(() => mockObserver),
    writable: true,
  });
  
  return mockObserver;
};

/**
 * Test helper to mock fetch
 */
export const mockFetch = (responseData: any, ok: boolean = true, status: number = 200) => {
  const mockFetchFn = createMockFetch(responseData, ok, status);
  
  Object.defineProperty(window, 'fetch', {
    value: mockFetchFn,
    writable: true,
  });
  
  return mockFetchFn;
};

/**
 * Test helper to mock console methods
 */
export const mockConsole = () => {
  const mockConsoleObj = createMockConsole();
  
  Object.defineProperty(console, 'log', { value: mockConsoleObj.log });
  Object.defineProperty(console, 'error', { value: mockConsoleObj.error });
  Object.defineProperty(console, 'warn', { value: mockConsoleObj.warn });
  Object.defineProperty(console, 'info', { value: mockConsoleObj.info });
  Object.defineProperty(console, 'debug', { value: mockConsoleObj.debug });
  
  return mockConsoleObj;
};

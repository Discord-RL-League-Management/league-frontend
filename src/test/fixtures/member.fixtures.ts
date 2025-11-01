/**
 * Frontend Test Fixtures
 * Factory functions for creating mock API responses and component data
 * Used across all frontend tests for consistent test data
 */

export const frontendFixtures = {
  /**
   * Create a mock API member response
   */
  createMockApiMember: (overrides: any = {}): any => ({
    id: 'member_123',
    userId: '123456789012345678',
    username: 'testuser',
    roles: ['111111111111111111', '222222222222222222'],
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: '123456789012345678',
      username: 'testuser',
      globalName: 'Test User',
      avatar: 'avatar_hash',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  }),

  /**
   * Create a member without avatar (fallback to letter)
   */
  createMemberWithoutAvatar: (): any => ({
    id: 'member_123',
    userId: '123456789012345678',
    username: 'testuser',
    roles: ['111111111111111111'],
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: '123456789012345678',
      username: 'testuser',
      globalName: 'Test User',
      avatar: null,
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
  }),

  /**
   * Create a member with no globalName (fallback to username)
   */
  createMemberWithoutGlobalName: (): any => ({
    id: 'member_123',
    userId: '123456789012345678',
    username: 'testuser',
    roles: ['111111111111111111'],
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: '123456789012345678',
      username: 'testuser',
      globalName: null,
      avatar: 'avatar_hash',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
  }),

  /**
   * Create a member with special characters in username
   */
  createMemberWithSpecialChars: (): any => ({
    id: 'member_123',
    userId: '123456789012345678',
    username: 'user@#$%^&*()',
    roles: ['111111111111111111'],
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: '123456789012345678',
      username: 'user@#$%^&*()',
      globalName: 'User Special',
      avatar: 'avatar_hash',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
  }),

  /**
   * Create a member with very long username
   */
  createMemberWithLongUsername: (): any => ({
    id: 'member_123',
    userId: '123456789012345678',
    username: 'verylongusernamethatexceedsnormallimitsandshouldbestillhandledproperly',
    roles: ['111111111111111111'],
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: '123456789012345678',
      username: 'verylongusernamethatexceedsnormallimitsandshouldbestillhandledproperly',
      globalName: 'Very Long Username',
      avatar: 'avatar_hash',
      lastLoginAt: '2024-01-01T00:00:00Z',
    },
  }),

  /**
   * Create an array of members for pagination testing
   */
  createMemberList: (count: number = 5): any[] => {
    const members: any[] = [];
    for (let i = 0; i < count; i++) {
      members.push(frontendFixtures.createMockApiMember({
        id: `member_${i + 1}`,
        userId: `${123456789012345678 + i}`,
        username: `user${i + 1}`,
        user: {
          id: `${123456789012345678 + i}`,
          username: `user${i + 1}`,
          globalName: `User ${i + 1}`,
          avatar: `avatar_${i + 1}`,
          lastLoginAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        },
      }));
    }
    return members;
  },

  /**
   * Create pagination metadata
   */
  createPaginationMetadata: (page: number = 1, limit: number = 20, total: number = 100): any => ({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  }),

  /**
   * Create a complete paginated member list response
   */
  createMemberListResponse: (page: number = 1, limit: number = 20, total: number = 100): any => ({
    members: frontendFixtures.createMemberList(Math.min(limit, total - (page - 1) * limit)),
    pagination: frontendFixtures.createPaginationMetadata(page, limit, total),
  }),

  /**
   * Create empty member list response
   */
  createEmptyMemberListResponse: (): any => ({
    members: [],
    pagination: frontendFixtures.createPaginationMetadata(1, 20, 0),
  }),

  /**
   * Create search results with query
   */
  createSearchResults: (query: string, count: number = 3): any => ({
    members: frontendFixtures.createMemberList(count).map((member, index) => ({
      ...member,
      username: `${query}_user${index + 1}`,
      user: {
        ...member.user,
        username: `${query}_user${index + 1}`,
        globalName: `${query} User ${index + 1}`,
      },
    })),
    pagination: frontendFixtures.createPaginationMetadata(1, 20, count),
  }),

  /**
   * Create empty search results
   */
  createEmptySearchResults: (): any => ({
    members: [],
    pagination: frontendFixtures.createPaginationMetadata(1, 20, 0),
  }),

  /**
   * Create API error response
   */
  createApiError: (statusCode: number = 500, message: string = 'Internal Server Error'): any => ({
    response: {
      status: statusCode,
      data: {
        message,
        error: 'Internal Server Error',
      },
    },
  }),

  /**
   * Create network error (no response)
   */
  createNetworkError: (): any => ({
    message: 'Network Error',
    code: 'NETWORK_ERROR',
  }),

  /**
   * Create validation error response
   */
  createValidationError: (): any => ({
    response: {
      status: 400,
      data: {
        message: 'Validation failed',
        error: 'Bad Request',
        details: [
          {
            field: 'guildId',
            message: 'guildId should not be empty',
          },
        ],
      },
    },
  }),

  /**
   * Create not found error response
   */
  createNotFoundError: (): any => ({
    response: {
      status: 404,
      data: {
        message: 'Guild not found',
        error: 'Not Found',
      },
    },
  }),

  /**
   * Create unauthorized error response
   */
  createUnauthorizedError: (): any => ({
    response: {
      status: 401,
      data: {
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  }),

  /**
   * Create forbidden error response
   */
  createForbiddenError: (): any => ({
    response: {
      status: 403,
      data: {
        message: 'Forbidden',
        error: 'Forbidden',
      },
    },
  }),

  /**
   * Create mock guild data for component props
   */
  createMockGuild: (overrides: any = {}): any => ({
    id: '987654321098765432',
    name: 'Test Guild',
    icon: 'guild_icon_hash',
    roles: ['admin'],
    ...overrides,
  }),

  /**
   * Create mock guild without admin role
   */
  createMockGuildMember: (): any => ({
    id: '987654321098765432',
    name: 'Test Guild',
    icon: 'guild_icon_hash',
    roles: ['member'],
  }),

  /**
   * Create mock guild without icon
   */
  createMockGuildWithoutIcon: (): any => ({
    id: '987654321098765432',
    name: 'Test Guild',
    icon: null,
    roles: ['admin'],
  }),

  /**
   * Create mock axios instance for API client tests
   */
  createMockAxiosInstance: (): any => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  }),

  /**
   * Create mock API response
   */
  createMockApiResponse: (data: any, status: number = 200): any => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }),

  /**
   * Create mock guild API client
   */
  createMockGuildApi: (): any => ({
    getGuildMembers: jest.fn(),
    getGuildMember: jest.fn(),
    searchGuildMembers: jest.fn(),
    getMyGuilds: jest.fn(),
    getGuild: jest.fn(),
    getGuildSettings: jest.fn(),
    updateGuildSettings: jest.fn(),
    resetGuildSettings: jest.fn(),
    getSettingsHistory: jest.fn(),
    getGuildChannels: jest.fn(),
    getGuildRoles: jest.fn(),
  }),

  /**
   * Create mock router for component tests
   */
  createMockRouter: (): any => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),

  /**
   * Create mock navigation for component tests
   */
  createMockNavigation: (): any => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    canGoForward: jest.fn().mockReturnValue(false),
  }),

  /**
   * Create mock window object for tests
   */
  createMockWindow: (): any => ({
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
  }),

  /**
   * Create mock IntersectionObserver for lazy loading tests
   */
  createMockIntersectionObserver: (): any => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }),

  /**
   * Create mock ResizeObserver for responsive tests
   */
  createMockResizeObserver: (): any => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }),

  /**
   * Create mock fetch for API tests
   */
  createMockFetch: (responseData: any, ok: boolean = true, status: number = 200): jest.MockedFunction<any> => {
    return jest.fn().mockResolvedValue({
      ok,
      status,
      json: jest.fn().mockResolvedValue(responseData),
      text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
      blob: jest.fn().mockResolvedValue(new Blob()),
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    });
  },

  /**
   * Create mock timers for async tests
   */
  createMockTimers: (): any => ({
    setTimeout: jest.fn(),
    clearTimeout: jest.fn(),
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
    setImmediate: jest.fn(),
    clearImmediate: jest.fn(),
  }),

  /**
   * Create mock console for testing console methods
   */
  createMockConsole: (): any => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }),

  /**
   * Create mock event for testing event handlers
   */
  createMockEvent: (type: string = 'click', overrides: any = {}): any => ({
    type,
    target: {
      value: '',
      checked: false,
    },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides,
  }),

  /**
   * Create mock form event
   */
  createMockFormEvent: (): any => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {
      elements: {
        namedItem: jest.fn(),
      },
    },
  }),

  /**
   * Create mock change event
   */
  createMockChangeEvent: (value: string = ''): any => ({
    target: {
      value,
      checked: false,
    },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }),

  /**
   * Create mock click event
   */
  createMockClickEvent: (): any => ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    currentTarget: {
      value: '',
    },
  }),
};

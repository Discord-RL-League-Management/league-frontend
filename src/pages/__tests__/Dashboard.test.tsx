import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { guildApi } from '../../lib/api';

// Mock the API
jest.mock('../../lib/api', () => ({
  guildApi: {
    getMyGuilds: jest.fn(),
  },
}));

const mockGuildApi = guildApi as jest.Mocked<typeof guildApi>;

// Mock user context
const mockUser = {
  id: '123456789',
  username: 'testuser',
  globalName: 'Test User',
  avatar: 'avatar_hash',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  lastLoginAt: '2023-01-01T00:00:00Z',
};

const mockAuthContext = {
  user: mockUser,
  logout: jest.fn(),
  login: jest.fn(),
};

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Dashboard Integration', () => {
  const mockGuilds = [
    {
      id: '111111111',
      name: 'Guild 1',
      icon: 'icon1',
      roles: ['admin'],
    },
    {
      id: '222222222',
      name: 'Guild 2',
      icon: undefined,
      roles: ['member'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display guild selector initially', async () => {
    // Arrange
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Select Server')).toBeInTheDocument();
      expect(screen.getByText('Guild 1')).toBeInTheDocument();
      expect(screen.getByText('Guild 2')).toBeInTheDocument();
    });
  });

  it('should navigate to guild dashboard when guild is selected', async () => {
    // Arrange
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);

    // Act
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Guild 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Guild 1'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Back to servers')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
    });
  });

  it('should return to guild selector when back button is clicked', async () => {
    // Arrange
    mockGuildApi.getMyGuilds.mockResolvedValue(mockGuilds);

    // Act
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Guild 1')).toBeInTheDocument();
    });

    // Select guild
    fireEvent.click(screen.getByText('Guild 1'));

    await waitFor(() => {
      expect(screen.getByText('Back to servers')).toBeInTheDocument();
    });

    // Go back
    fireEvent.click(screen.getByText('Back to servers'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Select Server')).toBeInTheDocument();
      expect(screen.getByText('Guild 1')).toBeInTheDocument();
    });
  });

  it('should display user information in navigation', () => {
    // Arrange
    mockGuildApi.getMyGuilds.mockResolvedValue([]);

    // Act
    render(<Dashboard />);

    // Assert
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    mockGuildApi.getMyGuilds.mockRejectedValue(new Error('API Error'));

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to load guilds')).toBeInTheDocument();
    });
  });
});

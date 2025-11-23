import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberList from '../MemberList.js';
import { renderWithProviders, mockGuildApi, frontendFixtures } from '../../test/utils/test-helpers.js';

// Mock the guild API
jest.mock('@/lib/api/guilds', () => ({
  guildApi: {
    getGuildMembers: jest.fn(),
    searchGuildMembers: jest.fn(),
  },
}));

describe('MemberList', () => {
  const mockGuildId = '123456789';
  let mockGuildApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGuildApi = mockGuildApi();
  });

  describe('Initial load', () => {
    it('should show loading spinner on initial load', async () => {
      // Arrange
      mockGuildApi.getGuildMembers.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(frontendFixtures.createMemberListResponse()), 100))
      );

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render member list when data loads successfully', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 3);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 2')).toBeInTheDocument();
        expect(screen.getByText('User 3')).toBeInTheDocument();
      });
    });

    it('should show error message when API call fails', async () => {
      // Arrange
      const error = frontendFixtures.createApiError(500, 'Server Error');
      mockGuildApi.getGuildMembers.mockRejectedValue(error);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error loading members')).toBeInTheDocument();
      });
    });
  });

  describe('Member display', () => {
    beforeEach(() => {
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 3);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);
    });

    it('should display member avatars when available', async () => {
      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        const avatars = screen.getAllByAltText(/avatar/i);
        expect(avatars).toHaveLength(3);
      });
    });

    it('should show fallback letter when avatar missing', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 1);
      mockResponse.members[0] = frontendFixtures.createMemberWithoutAvatar();
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('T')).toBeInTheDocument(); // First letter of username
      });
    });

    it('should display globalName when available, fallback to username', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 1);
      mockResponse.members[0] = frontendFixtures.createMemberWithoutGlobalName();
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument(); // Should fallback to username
      });
    });

    it('should show role count for each member', async () => {
      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        const roleCounts = screen.getAllByText(/1 role/i);
        expect(roleCounts).toHaveLength(3);
      });
    });
  });

  describe('Search functionality', () => {
    beforeEach(() => {
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 3);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);
    });

    it('should render search input and button', async () => {
      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument();
        expect(screen.getByText('Search')).toBeInTheDocument();
      });
    });

    it('should call search API when form submitted', async () => {
      // Arrange
      const searchResponse = frontendFixtures.createSearchResults('test', 2);
      mockGuildApi.searchGuildMembers.mockResolvedValue(searchResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        const searchButton = screen.getByText('Search');
        
        fireEvent.change(searchInput, { target: { value: 'testuser' } });
        fireEvent.click(searchButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockGuildApi.searchGuildMembers).toHaveBeenCalledWith(mockGuildId, 'testuser', 1, 20);
      });
    });

    it('should reset to page 1 when searching', async () => {
      // Arrange
      const searchResponse = frontendFixtures.createSearchResults('test', 2);
      mockGuildApi.searchGuildMembers.mockResolvedValue(searchResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        const searchButton = screen.getByText('Search');
        
        fireEvent.change(searchInput, { target: { value: 'testuser' } });
        fireEvent.click(searchButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockGuildApi.searchGuildMembers).toHaveBeenCalledWith(mockGuildId, 'testuser', 1, 20);
      });
    });

    it('should handle search with no results', async () => {
      // Arrange
      const emptySearchResponse = frontendFixtures.createEmptySearchResults();
      mockGuildApi.searchGuildMembers.mockResolvedValue(emptySearchResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        const searchButton = screen.getByText('Search');
        
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        fireEvent.click(searchButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument();
      });
    });

    it('should handle search errors', async () => {
      // Arrange
      const error = frontendFixtures.createApiError(500, 'Search failed');
      mockGuildApi.searchGuildMembers.mockRejectedValue(error);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        const searchButton = screen.getByText('Search');
        
        fireEvent.change(searchInput, { target: { value: 'test' } });
        fireEvent.click(searchButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error searching members')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 100);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);
    });

    it('should show pagination controls when multiple pages', async () => {
      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', async () => {
      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable Next button on last page', async () => {
      // Arrange
      const lastPageResponse = frontendFixtures.createMemberListResponse(5, 20, 100);
      mockGuildApi.getGuildMembers.mockResolvedValue(lastPageResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        expect(nextButton).toBeDisabled();
      });
    });

    it('should call API with correct page when pagination clicked', async () => {
      // Arrange
      const page2Response = frontendFixtures.createMemberListResponse(2, 20, 100);
      mockGuildApi.getGuildMembers.mockResolvedValueOnce(frontendFixtures.createMemberListResponse(1, 20, 100));
      mockGuildApi.getGuildMembers.mockResolvedValueOnce(page2Response);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockGuildApi.getGuildMembers).toHaveBeenCalledWith(mockGuildId, 2, 20);
      });
    });

    it('should handle pagination errors', async () => {
      // Arrange
      mockGuildApi.getGuildMembers.mockResolvedValueOnce(frontendFixtures.createMemberListResponse(1, 20, 100));
      mockGuildApi.getGuildMembers.mockRejectedValueOnce(frontendFixtures.createApiError(500, 'Pagination failed'));

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error loading members')).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('should show empty state when no members found', async () => {
      // Arrange
      const emptyResponse = frontendFixtures.createEmptyMemberListResponse();
      mockGuildApi.getGuildMembers.mockResolvedValue(emptyResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument();
      });
    });

    it('should show empty state for search with no results', async () => {
      // Arrange
      const emptySearchResponse = frontendFixtures.createEmptySearchResults();
      mockGuildApi.getGuildMembers.mockResolvedValue(frontendFixtures.createMemberListResponse(1, 20, 3));
      mockGuildApi.searchGuildMembers.mockResolvedValue(emptySearchResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search members...');
        const searchButton = screen.getByText('Search');
        
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        fireEvent.click(searchButton);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No members found')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle members with special characters in username', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 1);
      mockResponse.members[0] = frontendFixtures.createMemberWithSpecialChars();
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('user@#$%^&*()')).toBeInTheDocument();
      });
    });

    it('should handle members with very long usernames', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 1);
      mockResponse.members[0] = frontendFixtures.createMemberWithLongUsername();
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('verylongusernamethatexceedsnormallimitsandshouldbestillhandledproperly')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = frontendFixtures.createNetworkError();
      mockGuildApi.getGuildMembers.mockRejectedValue(networkError);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error loading members')).toBeInTheDocument();
      });
    });

    it('should handle unauthorized errors', async () => {
      // Arrange
      const unauthorizedError = frontendFixtures.createUnauthorizedError();
      mockGuildApi.getGuildMembers.mockRejectedValue(unauthorizedError);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error loading members')).toBeInTheDocument();
      });
    });

    it('should handle forbidden errors', async () => {
      // Arrange
      const forbiddenError = frontendFixtures.createForbiddenError();
      mockGuildApi.getGuildMembers.mockRejectedValue(forbiddenError);

      // Act
      renderWithProviders(<MemberList guildId={mockGuildId} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error loading members')).toBeInTheDocument();
      });
    });
  });

  describe('Component lifecycle', () => {
    it('should load members when guildId changes', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 3);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      const { rerender } = renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        expect(mockGuildApi.getGuildMembers).toHaveBeenCalledWith(mockGuildId, 1, 20);
      });

      // Change guildId
      const newGuildId = '987654321';
      rerender(<MemberList guildId={newGuildId} />);

      // Assert
      await waitFor(() => {
        expect(mockGuildApi.getGuildMembers).toHaveBeenCalledWith(newGuildId, 1, 20);
      });
    });

    it('should cleanup on unmount', async () => {
      // Arrange
      const mockResponse = frontendFixtures.createMemberListResponse(1, 20, 3);
      mockGuildApi.getGuildMembers.mockResolvedValue(mockResponse);

      // Act
      const { unmount } = renderWithProviders(<MemberList guildId={mockGuildId} />);
      
      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
      });

      unmount();

      // Assert - component should unmount without errors
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });
  });
});

import axios from 'axios';
import { guildApi } from '../guilds';
import { frontendFixtures } from '../../../test/fixtures/member.fixtures';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Guild API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGuildMembers', () => {
    it('should make GET request to /api/guilds/:id/members', async () => {
      // Arrange
      const guildId = '123456789';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass page and limit params', async () => {
      // Arrange
      const guildId = '123456789';
      const page = 2;
      const limit = 10;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse(page, limit));
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page, limit },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should use default page and limit when not provided', async () => {
      // Arrange
      const guildId = '123456789';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should return response.data', async () => {
      // Arrange
      const guildId = '123456789';
      const mockData = frontendFixtures.createMemberListResponse();
      const mockResponse = frontendFixtures.createMockApiResponse(mockData);
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId);

      // Assert
      expect(result).toEqual(mockData);
    });

    it('should handle API errors correctly', async () => {
      // Arrange
      const guildId = '123456789';
      const error = frontendFixtures.createApiError(500, 'Server Error');
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Arrange
      const guildId = '123456789';
      const networkError = frontendFixtures.createNetworkError();
      mockedAxios.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow();
    });

    it('should handle unauthorized errors', async () => {
      // Arrange
      const guildId = '123456789';
      const unauthorizedError = frontendFixtures.createUnauthorizedError();
      mockedAxios.get.mockRejectedValue(unauthorizedError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow();
    });

    it('should handle forbidden errors', async () => {
      // Arrange
      const guildId = '123456789';
      const forbiddenError = frontendFixtures.createForbiddenError();
      mockedAxios.get.mockRejectedValue(forbiddenError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow();
    });
  });

  describe('getGuildMember', () => {
    it('should make GET request to /api/guilds/:id/members/:userId', async () => {
      // Arrange
      const guildId = '123456789';
      const userId = '987654321';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMockApiMember());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMember(guildId, userId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should return response.data', async () => {
      // Arrange
      const guildId = '123456789';
      const userId = '987654321';
      const mockData = frontendFixtures.createMockApiMember();
      const mockResponse = frontendFixtures.createMockApiResponse(mockData);
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMember(guildId, userId);

      // Assert
      expect(result).toEqual(mockData);
    });

    it('should handle member not found', async () => {
      // Arrange
      const guildId = '123456789';
      const userId = 'nonexistent';
      const notFoundError = frontendFixtures.createNotFoundError();
      mockedAxios.get.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(guildApi.getGuildMember(guildId, userId)).rejects.toThrow();
    });

    it('should handle API errors correctly', async () => {
      // Arrange
      const guildId = '123456789';
      const userId = '987654321';
      const error = frontendFixtures.createApiError(500, 'Server Error');
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(guildApi.getGuildMember(guildId, userId)).rejects.toThrow();
    });
  });

  describe('searchGuildMembers', () => {
    it('should make GET request with q param', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createSearchResults(query));
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/search`, {
        params: { q: query, page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should pass page and limit params', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const page = 2;
      const limit = 10;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createSearchResults(query, 10));
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/search`, {
        params: { q: query, page, limit },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should use default page and limit when not provided', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createSearchResults(query));
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/search`, {
        params: { q: query, page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should return response.data', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const mockData = frontendFixtures.createSearchResults(query);
      const mockResponse = frontendFixtures.createMockApiResponse(mockData);
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(result).toEqual(mockData);
    });

    it('should handle empty search results', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'nonexistent';
      const mockData = frontendFixtures.createEmptySearchResults();
      const mockResponse = frontendFixtures.createMockApiResponse(mockData);
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(result).toEqual(mockData);
      expect(result.members).toHaveLength(0);
    });

    it('should handle special characters in search query', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'user@#$%^&*()';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createSearchResults(query));
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/search`, {
        params: { q: query, page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors correctly', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const error = frontendFixtures.createApiError(500, 'Search failed');
      mockedAxios.get.mockRejectedValue(error);

      // Act & Assert
      await expect(guildApi.searchGuildMembers(guildId, query)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Arrange
      const guildId = '123456789';
      const query = 'testuser';
      const networkError = frontendFixtures.createNetworkError();
      mockedAxios.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(guildApi.searchGuildMembers(guildId, query)).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should propagate axios errors', async () => {
      // Arrange
      const guildId = '123456789';
      const axiosError = new Error('Axios error');
      mockedAxios.get.mockRejectedValue(axiosError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow('Axios error');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const guildId = '123456789';
      const timeoutError = new Error('timeout of 5000ms exceeded');
      mockedAxios.get.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow('timeout of 5000ms exceeded');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const guildId = '123456789';
      const validationError = frontendFixtures.createValidationError();
      mockedAxios.get.mockRejectedValue(validationError);

      // Act & Assert
      await expect(guildApi.getGuildMembers(guildId)).rejects.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long guild IDs', async () => {
      // Arrange
      const guildId = '1234567890123456789012345678901234567890';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle very long user IDs', async () => {
      // Arrange
      const guildId = '123456789';
      const userId = '1234567890123456789012345678901234567890';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMockApiMember());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMember(guildId, userId);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle empty search queries', async () => {
      // Arrange
      const guildId = '123456789';
      const query = '';
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createEmptySearchResults());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.searchGuildMembers(guildId, query);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members/search`, {
        params: { q: '', page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle zero page numbers', async () => {
      // Arrange
      const guildId = '123456789';
      const page = 0;
      const limit = 20;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page: 0, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle zero limit', async () => {
      // Arrange
      const guildId = '123456789';
      const page = 1;
      const limit = 0;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page: 1, limit: 0 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle negative page numbers', async () => {
      // Arrange
      const guildId = '123456789';
      const page = -1;
      const limit = 20;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page: -1, limit: 20 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle negative limit', async () => {
      // Arrange
      const guildId = '123456789';
      const page = 1;
      const limit = -5;
      const mockResponse = frontendFixtures.createMockApiResponse(frontendFixtures.createMemberListResponse());
      mockedAxios.get.mockResolvedValue(mockResponse);

      // Act
      const result = await guildApi.getGuildMembers(guildId, page, limit);

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/guilds/${guildId}/members`, {
        params: { page: 1, limit: -5 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });
});

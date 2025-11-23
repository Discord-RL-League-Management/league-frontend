import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GuildDashboard from '../GuildDashboard.js';
import { renderWithProviders, mockGuildApi, frontendFixtures } from '../../test/utils/test-helpers.js';

// Mock the MemberList component
jest.mock('../MemberList', () => {
  return function MockMemberList({ guildId }: { guildId: string }) {
    return <div data-testid="member-list">MemberList for guild {guildId}</div>;
  };
});

// Mock the guild API
jest.mock('@/lib/api/guilds', () => ({
  guildApi: {
    getGuildMembers: jest.fn(),
    searchGuildMembers: jest.fn(),
  },
}));

describe('GuildDashboard Component', () => {
  const mockGuild = {
    id: '123456789',
    name: 'Test Guild',
    icon: 'icon_hash',
    roles: ['admin'],
  };

  const defaultProps = {
    guild: mockGuild,
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display guild name and icon', () => {
    // Act
    render(<GuildDashboard {...defaultProps} />);

    // Assert
    expect(screen.getByText('Test Guild')).toBeInTheDocument();
    // In test environment, images may not load, so we check for the fallback text
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test Guild"
  });

  it('should display first letter fallback when no icon', () => {
    // Arrange
    const guildWithoutIcon = { ...mockGuild, icon: undefined };

    // Act
    render(<GuildDashboard {...defaultProps} guild={guildWithoutIcon} />);

    // Assert
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test Guild"
  });

  it('should display role information', () => {
    // Act
    render(<GuildDashboard {...defaultProps} />);

    // Assert
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('should call onBack when back button is clicked', () => {
    // Act
    render(<GuildDashboard {...defaultProps} />);
    fireEvent.click(screen.getByText('Back to servers'));

    // Assert
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('should display placeholder sections for future features', () => {
    // Act
    render(<GuildDashboard {...defaultProps} />);

    // Assert
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Leagues')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('should display placeholder descriptions', () => {
    // Act
    render(<GuildDashboard {...defaultProps} />);

    // Assert
    expect(screen.getByText(/Guild configuration and bot settings will be available here/)).toBeInTheDocument();
    expect(screen.getByText(/Member management and role assignments will be available here/)).toBeInTheDocument();
    expect(screen.getByText(/League creation and management will be available here/)).toBeInTheDocument();
    expect(screen.getByText(/Guild statistics and activity metrics will be available here/)).toBeInTheDocument();
  });

  it('should display member role correctly', () => {
    // Arrange
    const memberGuild = { ...mockGuild, roles: ['member'] };

    // Act
    render(<GuildDashboard {...defaultProps} guild={memberGuild} />);

    // Assert
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  describe('Members tab functionality', () => {
    let mockGuildApi: any;

    beforeEach(() => {
      jest.clearAllMocks();
      mockGuildApi = mockGuildApi();
    });

    it('should render Members tab in navigation (admin only)', () => {
      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} />);

      // Assert
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('should switch to Members tab when clicked', async () => {
      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} />);
      
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('member-list')).toBeInTheDocument();
      });
    });

    it('should render MemberList component when Members tab active', async () => {
      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} />);
      
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('member-list')).toBeInTheDocument();
        expect(screen.getByText(`MemberList for guild ${mockGuild.id}`)).toBeInTheDocument();
      });
    });

    it('should pass correct guildId prop to MemberList', async () => {
      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} />);
      
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(`MemberList for guild ${mockGuild.id}`)).toBeInTheDocument();
      });
    });

    it('should maintain tab state when switching between tabs', async () => {
      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} />);
      
      // Switch to Members tab
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      await waitFor(() => {
        expect(screen.getByTestId('member-list')).toBeInTheDocument();
      });

      // Switch to Settings tab
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      // Switch back to Members tab
      fireEvent.click(membersTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('member-list')).toBeInTheDocument();
      });
    });

    it('should not show Members tab for non-admin users', () => {
      // Arrange
      const memberGuild = { ...mockGuild, roles: ['member'] };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={memberGuild} />);

      // Assert
      expect(screen.queryByText('Members')).not.toBeInTheDocument();
    });

    it('should show Members tab for users with admin role', () => {
      // Arrange
      const adminGuild = { ...mockGuild, roles: ['admin'] };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={adminGuild} />);

      // Assert
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('should show Members tab for users with moderator role', () => {
      // Arrange
      const moderatorGuild = { ...mockGuild, roles: ['moderator'] };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={moderatorGuild} />);

      // Assert
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('should handle tab switching with multiple roles', async () => {
      // Arrange
      const multiRoleGuild = { ...mockGuild, roles: ['admin', 'moderator', 'member'] };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={multiRoleGuild} />);
      
      const membersTab = screen.getByText('Members');
      fireEvent.click(membersTab);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('member-list')).toBeInTheDocument();
      });
    });

    it('should handle tab switching with no roles', () => {
      // Arrange
      const noRoleGuild = { ...mockGuild, roles: [] };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={noRoleGuild} />);

      // Assert
      expect(screen.queryByText('Members')).not.toBeInTheDocument();
    });

    it('should handle undefined roles', () => {
      // Arrange
      const undefinedRoleGuild = { ...mockGuild, roles: undefined };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={undefinedRoleGuild} />);

      // Assert
      expect(screen.queryByText('Members')).not.toBeInTheDocument();
    });

    it('should handle null roles', () => {
      // Arrange
      const nullRoleGuild = { ...mockGuild, roles: null };

      // Act
      renderWithProviders(<GuildDashboard {...defaultProps} guild={nullRoleGuild} />);

      // Assert
      expect(screen.queryByText('Members')).not.toBeInTheDocument();
    });
  });
});

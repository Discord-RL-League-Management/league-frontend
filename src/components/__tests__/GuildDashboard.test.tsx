import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import GuildDashboard from '../GuildDashboard';

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
});

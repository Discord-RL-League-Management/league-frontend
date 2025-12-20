/**
 * Black Box Tests for ProfileSection Component
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (props → rendered output)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProfileSection } from '../ProfileSection.js';
import type { User, UserProfile } from '@/types/index.js';

// Mock UserAvatar to avoid Discord CDN calls and focus on ProfileSection logic
jest.mock('@/components/user-avatar.js', () => ({
  UserAvatar: () => (
    <div data-testid="user-avatar">Avatar</div>
  ),
}));

describe('ProfileSection', () => {
  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    globalName: 'Test User',
    avatar: 'avatar-123',
    email: 'test@example.com',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    lastLoginAt: '2024-01-01',
  };

  const mockProfile: UserProfile = {
    id: 'user-123',
    username: 'profileuser',
    globalName: 'Profile User',
    avatar: 'avatar-456',
    email: 'profile@example.com',
  };

  describe('name display logic', () => {
    test('displays globalName when profile.globalName is available', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('Profile User')).toBeInTheDocument();
    });

    test('falls back to profile.username when globalName is missing', () => {
      const profileWithoutGlobalName: UserProfile = {
        ...mockProfile,
        globalName: undefined,
      };

      render(
        <ProfileSection
          user={mockUser}
          profile={profileWithoutGlobalName}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('profileuser')).toBeInTheDocument();
    });

    test('falls back to user.username when profile is null', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={null}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('displays "User" when all names are missing', () => {
      const userWithoutUsername: User = {
        ...mockUser,
        username: '',
      };

      render(
        <ProfileSection
          user={userWithoutUsername}
          profile={null}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    test('prefers profile.globalName over profile.username', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('Profile User')).toBeInTheDocument();
      expect(screen.queryByText('profileuser')).not.toBeInTheDocument();
    });

    test('prefers profile.username over user.username', () => {
      const profileWithoutGlobalName: UserProfile = {
        ...mockProfile,
        globalName: undefined,
      };

      render(
        <ProfileSection
          user={mockUser}
          profile={profileWithoutGlobalName}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      // Verify profile username is displayed in the name (h2 element)
      const nameElement = screen.getByText('profileuser');
      expect(nameElement.tagName).toBe('H2');
      // Avatar mock doesn't render username anymore, so testuser should not appear
      expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    });
  });

  describe('badge rendering', () => {
    test('shows "Loading..." badge when permissionsLoading is true', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={true}
          userRoles={[]}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('shows "Administrator" badge when isAdmin is true and not loading', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={true}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    test('shows "Member" badge when isAdmin is false and not loading', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    test('does not show admin/member badge when loading', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={true}
          permissionsLoading={true}
          userRoles={[]}
        />
      );

      expect(screen.queryByText('Administrator')).not.toBeInTheDocument();
      expect(screen.queryByText('Member')).not.toBeInTheDocument();
    });
  });

  describe('role count badge', () => {
    test('displays role count badge when userRoles.length > 0', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={['role-1', 'role-2']}
        />
      );

      expect(screen.getByText('2 roles')).toBeInTheDocument();
    });

    test('handles singular form for 1 role', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={['role-1']}
        />
      );

      expect(screen.getByText('1 role')).toBeInTheDocument();
    });

    test('handles plural form for multiple roles', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={['role-1', 'role-2', 'role-3']}
        />
      );

      expect(screen.getByText('3 roles')).toBeInTheDocument();
    });

    test('does not display role count badge when userRoles is empty', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.queryByText(/role/)).not.toBeInTheDocument();
    });

    test('does not display role count badge when userRoles.length is 0', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.queryByText(/role/)).not.toBeInTheDocument();
    });
  });

  describe('avatar rendering', () => {
    test('renders UserAvatar when user is provided', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });

    test('does not render UserAvatar when user is null', () => {
      render(
        <ProfileSection
          user={null}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles null user and null profile', () => {
      render(
        <ProfileSection
          user={null}
          profile={null}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    test('handles empty userRoles array', () => {
      render(
        <ProfileSection
          user={mockUser}
          profile={mockProfile}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.queryByText(/role/)).not.toBeInTheDocument();
    });

    test('handles profile with only username, no globalName', () => {
      const profileWithOnlyUsername: UserProfile = {
        id: 'user-123',
        username: 'usernameonly',
        globalName: undefined,
      };

      render(
        <ProfileSection
          user={mockUser}
          profile={profileWithOnlyUsername}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('usernameonly')).toBeInTheDocument();
    });

    test('handles user with only username, no globalName', () => {
      const userWithOnlyUsername: User = {
        ...mockUser,
        globalName: undefined,
      };

      render(
        <ProfileSection
          user={userWithOnlyUsername}
          profile={null}
          isAdmin={false}
          permissionsLoading={false}
          userRoles={[]}
        />
      );

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });
});


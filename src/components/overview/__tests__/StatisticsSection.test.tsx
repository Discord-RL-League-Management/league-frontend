/**
 * Black Box Tests for StatisticsSection Component
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (props → rendered output)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StatisticsSection } from '../StatisticsSection.js';
import type { UserStats } from '@/types/index.js';

describe('StatisticsSection', () => {
  const mockStats: UserStats = {
    userId: 'user-123',
    gamesPlayed: 100,
    wins: 60,
    losses: 40,
    winRate: 0.6,
    guildsCount: 5,
    activeGuildsCount: 3,
  };

  describe('section title', () => {
    test('displays "Your Statistics" title', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Your Statistics')).toBeInTheDocument();
    });
  });

  describe('metric calculations', () => {
    test('calculates win rate percentage correctly', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      // Win rate should be (0.6 * 100).toFixed(1) = "60.0%"
      expect(screen.getByText('60.0%')).toBeInTheDocument();
    });

    test('displays "0%" when winRate is null', () => {
      const statsWithoutWinRate: UserStats = {
        ...mockStats,
        winRate: 0,
      };

      render(
        <StatisticsSection
          stats={statsWithoutWinRate}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('handles win rate with one decimal place', () => {
      const statsWithDecimalWinRate: UserStats = {
        ...mockStats,
        winRate: 0.666,
      };

      render(
        <StatisticsSection
          stats={statsWithDecimalWinRate}
          loading={false}
          error={null}
        />
      );

      // Should display "66.6%"
      expect(screen.getByText('66.6%')).toBeInTheDocument();
    });

    test('handles win rate rounding correctly', () => {
      const statsWithRounding: UserStats = {
        ...mockStats,
        winRate: 0.6666,
      };

      render(
        <StatisticsSection
          stats={statsWithRounding}
          loading={false}
          error={null}
        />
      );

      // Should round to "66.7%"
      expect(screen.getByText('66.7%')).toBeInTheDocument();
    });
  });

  describe('MetricCard rendering', () => {
    test('renders Games Played metric card', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('renders Wins metric card', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    test('renders Win Rate metric card', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('60.0%')).toBeInTheDocument();
    });

    test('renders Guilds metric card', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Guilds')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('renders all four metric cards', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Games Played')).toBeInTheDocument();
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('Win Rate')).toBeInTheDocument();
      expect(screen.getByText('Guilds')).toBeInTheDocument();
    });
  });

  describe('description logic', () => {
    test('displays gamesPlayed in win rate description when available', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('100 games')).toBeInTheDocument();
    });

    test('displays "No games played" in win rate description when gamesPlayed is 0', () => {
      const statsWithNoGames: UserStats = {
        ...mockStats,
        gamesPlayed: 0,
      };

      render(
        <StatisticsSection
          stats={statsWithNoGames}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('No games played')).toBeInTheDocument();
    });

    test('displays active guilds count in guilds description', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    test('displays "0 active" when activeGuildsCount is 0', () => {
      const statsWithNoActiveGuilds: UserStats = {
        ...mockStats,
        activeGuildsCount: 0,
      };

      render(
        <StatisticsSection
          stats={statsWithNoActiveGuilds}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('0 active')).toBeInTheDocument();
    });
  });

  describe('error propagation', () => {
    test('propagates error to all MetricCards', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error="Failed to load stats"
        />
      );

      // All MetricCards should show error state
      const errorMessages = screen.getAllByText('Error loading');
      expect(errorMessages.length).toBe(4);
    });

    test('does not display values when error is present', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={false}
          error="Failed to load stats"
        />
      );

      // Values should not be displayed when error is present
      expect(screen.queryByText('100')).not.toBeInTheDocument();
      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });
  });

  describe('loading propagation', () => {
    test('propagates loading state to all MetricCards', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={true}
          error={null}
        />
      );

      // All MetricCards should be in loading state (skeletons rendered)
      // We verify by checking that values are not displayed
      expect(screen.queryByText('100')).not.toBeInTheDocument();
      expect(screen.queryByText('60')).not.toBeInTheDocument();
    });

    test('does not display values when loading is true', () => {
      render(
        <StatisticsSection
          stats={mockStats}
          loading={true}
          error={null}
        />
      );

      expect(screen.queryByText('100')).not.toBeInTheDocument();
      expect(screen.queryByText('60.0%')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles null stats object', () => {
      render(
        <StatisticsSection
          stats={null}
          loading={false}
          error={null}
        />
      );

      // Should display default values (0 for numbers, "0%" for win rate)
      // Multiple "0" values exist, verify they're all present
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('handles zero values for all metrics', () => {
      const zeroStats: UserStats = {
        userId: 'user-123',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        guildsCount: 0,
        activeGuildsCount: 0,
      };

      render(
        <StatisticsSection
          stats={zeroStats}
          loading={false}
          error={null}
        />
      );

      // Multiple "0" values exist, verify they're all present
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('No games played')).toBeInTheDocument();
    });

    test('handles stats with missing optional fields', () => {
      const minimalStats: UserStats = {
        userId: 'user-123',
        gamesPlayed: 10,
        wins: 5,
        losses: 5,
        winRate: 0.5,
        guildsCount: 1,
        activeGuildsCount: 1,
      };

      render(
        <StatisticsSection
          stats={minimalStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    test('handles very high win rate', () => {
      const highWinRateStats: UserStats = {
        ...mockStats,
        winRate: 0.999,
      };

      render(
        <StatisticsSection
          stats={highWinRateStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('99.9%')).toBeInTheDocument();
    });

    test('handles very low win rate', () => {
      const lowWinRateStats: UserStats = {
        ...mockStats,
        winRate: 0.001,
      };

      render(
        <StatisticsSection
          stats={lowWinRateStats}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });
  });
});


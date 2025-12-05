import { MetricCard } from './MetricCard.js';
import { Gamepad2, Trophy, Users, TrendingUp } from 'lucide-react';
import type { UserStats } from '@/types/index.js';

interface StatisticsSectionProps {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
}

/**
 * StatisticsSection Component
 * 
 * Displays user statistics in a grid of metric cards.
 */
export function StatisticsSection({ stats, loading, error }: StatisticsSectionProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Games Played"
          value={stats?.gamesPlayed ?? 0}
          description="Total games played"
          icon={Gamepad2}
          isLoading={loading}
          error={error}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />

        <MetricCard
          title="Wins"
          value={stats?.wins ?? 0}
          description="Total victories"
          icon={Trophy}
          isLoading={loading}
          error={error}
          iconColor="text-yellow-600 dark:text-yellow-400"
          iconBg="bg-yellow-100 dark:bg-yellow-900/30"
        />

        <MetricCard
          title="Win Rate"
          value={stats?.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : '0%'}
          description={stats?.gamesPlayed ? `${stats.gamesPlayed} games` : 'No games played'}
          icon={TrendingUp}
          isLoading={loading}
          error={error}
          iconColor="text-green-600 dark:text-green-400"
          iconBg="bg-green-100 dark:bg-green-900/30"
        />

        <MetricCard
          title="Guilds"
          value={stats?.guildsCount ?? 0}
          description={`${stats?.activeGuildsCount ?? 0} active`}
          icon={Users}
          isLoading={loading}
          error={error}
          iconColor="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>
    </div>
  );
}


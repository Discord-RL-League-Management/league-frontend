import { useAuthStore } from '../stores/index.ts';
import { GuildSelectorContainer } from '../components/guild-selector-container.tsx';
import { NavigationBar } from '../components/navigation-bar.tsx';
import { PageContainer } from '../components/page-container.tsx';

/**
 * Dashboard - Single responsibility: Display guild list only
 * No business logic, pure presentation with data fetching
 */
export default function Dashboard() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={user} onLogout={logout} />

      <PageContainer>
        <div className="max-w-2xl mx-auto">
          <GuildSelectorContainer />
        </div>
      </PageContainer>
    </div>
  );
}

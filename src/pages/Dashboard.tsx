import { useAuthStore, useGuildStore } from '../stores';
import { GuildSelectorContainer } from '../components/guild-selector-container';
import GuildDashboard from '../components/GuildDashboard';
import { NavigationBar } from '../components/navigation-bar';
import { PageContainer } from '../components/page-container';

/**
 * Dashboard - Single responsibility: Display user data only
 * No business logic, pure presentation with data fetching
 */
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { selectedGuild, setSelectedGuild } = useGuildStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={user} onLogout={logout} />

      <PageContainer>
        {!selectedGuild ? (
          <div className="max-w-2xl mx-auto">
            <GuildSelectorContainer 
              onGuildSelect={setSelectedGuild} 
            />
          </div>
        ) : selectedGuild && (
          <GuildDashboard 
            guild={selectedGuild} 
            onBack={() => setSelectedGuild(null)} 
          />
        )}
      </PageContainer>
    </div>
  );
}

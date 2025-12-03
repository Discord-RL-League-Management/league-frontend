import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { NavigationBar } from '@/components/navigation-bar.tsx';
import { PageContainer } from '@/components/page-container.tsx';
import { MmrCalculator } from '@/components/mmr-calculator/MmrCalculator.tsx';
import { Button } from '@/components/ui/button.js';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/index.ts';

/**
 * MMRCalculatorPage - Standalone calculator page
 * Single responsibility: Display MMR calculator for a specific guild
 */
export default function MMRCalculatorPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!guildId) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBack = () => {
    navigate(`/dashboard/guild/${guildId}/overview`);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar user={user} onLogout={() => {}} />
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <MmrCalculator guildId={guildId} />
        </div>
      </PageContainer>
    </div>
  );
}


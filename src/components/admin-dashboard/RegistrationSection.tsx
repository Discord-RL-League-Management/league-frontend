import { useEffect, useCallback } from 'react';
import { useRegistrationsStore } from '@/stores/registrationsStore';
import { RegistrationQueueStats } from './RegistrationQueueStats';
import { RegistrationProcessForm } from './RegistrationProcessForm';
import { ErrorDisplay } from '@/components/error-display';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface RegistrationSectionProps {
  guildId: string;
}

/**
 * RegistrationSection - Single responsibility: Orchestrate registration processing
 * Container component that manages state and data fetching
 * Uses Accordion component with stats in header
 */
export function RegistrationSection({ guildId }: RegistrationSectionProps) {
  const {
    currentRegistration,
    queueStats,
    loading,
    error,
    fetchNextRegistration,
    fetchQueueStats,
    processRegistration,
    rejectRegistration,
    retry,
  } = useRegistrationsStore();

  // Fetch queue stats on mount
  useEffect(() => {
    fetchQueueStats(guildId);
  }, [guildId, fetchQueueStats]);

  // Handle get next registration
  const handleGetNext = useCallback(async () => {
    await fetchNextRegistration(guildId);
  }, [guildId, fetchNextRegistration]);

  // Handle process registration
  const handleProcess = useCallback(async (
    registrationId: string,
    displayName?: string
  ) => {
    try {
      await processRegistration(registrationId, displayName);
      // Store already refetches stats after processing
    } catch (err) {
      // Error is already handled in store
      console.error('Error processing registration:', err);
    }
  }, [processRegistration]);

  // Handle reject registration
  const handleReject = useCallback(async (registrationId: string, reason: string) => {
    try {
      await rejectRegistration(registrationId, reason);
      // Store already refetches stats after rejecting
    } catch (err) {
      // Error is already handled in store
      console.error('Error rejecting registration:', err);
    }
  }, [rejectRegistration]);

  // Handle retry
  const handleRetry = useCallback(() => {
    retry(guildId);
  }, [guildId, retry]);

  // Show loading state on initial load
  if (loading && !queueStats && !currentRegistration) {
    return <LoadingState message="Loading registration queue..." />;
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <ErrorDisplay error={error} onRetry={handleRetry} />
      )}

      {/* Accordion with Registration Queue */}
      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="registrations" className="border rounded-lg px-6 bg-card">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">
            <div className="flex items-center justify-between w-full pr-4">
              <span>Registration Queue</span>
              <RegistrationQueueStats queueStats={queueStats} loading={loading && !queueStats} />
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6">
            <div className="space-y-4">
              {/* Get Next Registration Button */}
              <div className="flex justify-between items-center">
                <div>
                  {currentRegistration ? (
                    <p className="text-sm text-muted-foreground">
                      Processing registration for {currentRegistration.user.globalName || currentRegistration.user.username}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {queueStats?.pending === 0
                        ? 'No pending registrations'
                        : `Click to fetch next pending registration (${queueStats?.pending || 0} pending)`}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleGetNext}
                  disabled={loading || !!currentRegistration || (queueStats?.pending === 0)}
                  aria-label="Get next registration"
                >
                  {loading ? 'Loading...' : 'Get Next Registration'}
                </Button>
              </div>

              {/* Registration Processing Form */}
              <RegistrationProcessForm
                registration={currentRegistration}
                onProcess={handleProcess}
                onReject={handleReject}
                loading={loading}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}


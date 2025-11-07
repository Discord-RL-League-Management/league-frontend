import { useState } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { TrackerRegistration, GamePlatform } from '@/types/trackers.ts';

interface RegistrationProcessFormProps {
  registration: TrackerRegistration | null;
  onProcess: (registrationId: string, displayName?: string) => Promise<void>;
  onReject: (registrationId: string, reason: string) => Promise<void>;
  loading?: boolean;
}

/**
 * RegistrationProcessForm - Single responsibility: Handle registration processing/rejection
 * Uses shadcn/ui Form components for proper form structure
 * Implements form validation and error handling
 */
export function RegistrationProcessForm({
  registration,
  onProcess,
  onReject,
  loading = false,
}: RegistrationProcessFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionError, setRejectionError] = useState('');

  const { error, handleAsync, clearError } = useErrorHandler();

  if (!registration) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No registration selected. Click "Get Next Registration" to fetch a pending registration.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handleProcess = async () => {
    clearError();

    if (displayName && displayName.length > 100) {
      return;
    }

    await handleAsync(async () => {
      await onProcess(registration.id, displayName || undefined);
      // Reset form after successful processing
      setDisplayName('');
      setShowRejectForm(false);
    });
  };

  const formatPlatformName = (platform?: GamePlatform): string => {
    if (!platform) return 'Unknown';
    const platformNames: Record<GamePlatform, string> = {
      STEAM: 'Steam',
      EPIC: 'Epic Games',
      XBL: 'Xbox Live',
      PSN: 'PlayStation Network',
      SWITCH: 'Nintendo Switch',
    };
    return platformNames[platform] || platform;
  };

  const handleReject = async () => {
    clearError();
    setRejectionError('');

    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters');
      return;
    }

    await handleAsync(async () => {
      await onReject(registration.id, rejectionReason.trim());
      // Reset form after successful rejection
      setRejectionReason('');
      setShowRejectForm(false);
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'PROCESSING':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Details */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Registration Details</Label>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={registration.user} size="md" />
              <div className="flex-1">
                <div className="font-medium">
                  {registration.user.globalName || registration.user.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{registration.user.username}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(registration.status)}>
                {registration.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Tracker URL</Label>
                <div className="mt-1">
                  <a
                    href={registration.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {registration.url}
                  </a>
                </div>
              </div>

              {registration.platform && (
                <div>
                  <Label className="text-xs text-muted-foreground">Platform</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{formatPlatformName(registration.platform)}</Badge>
                  </div>
                </div>
              )}

              {registration.username && (
                <div>
                  <Label className="text-xs text-muted-foreground">Username</Label>
                  <div className="text-sm mt-1">{registration.username}</div>
                </div>
              )}

              {registration.game && (
                <div>
                  <Label className="text-xs text-muted-foreground">Game</Label>
                  <div className="text-sm mt-1">{registration.game}</div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Registered</Label>
                <div className="text-sm mt-1">{formatDate(registration.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Process Form */}
      {!showRejectForm && (
        <div className="space-y-4">
          <FormItem>
            <FormLabel>Display Name (Optional)</FormLabel>
            <FormControl>
              <Input
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  clearError();
                }}
                placeholder="Enter display name"
                maxLength={100}
                disabled={loading}
                aria-label="Display name"
              />
            </FormControl>
            <FormDescription>
              Optional display name for the tracker (max 100 characters)
            </FormDescription>
          </FormItem>

          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={loading}
              aria-label="Process registration"
            >
              {loading ? 'Processing...' : 'Process Registration'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowRejectForm(true);
                setDisplayName('');
                clearError();
              }}
              disabled={loading}
              aria-label="Reject registration"
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <div className="space-y-4">
          <FormItem>
            <FormLabel>Rejection Reason *</FormLabel>
            <FormControl>
              <Textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError('');
                  clearError();
                }}
                placeholder="Enter reason for rejection (minimum 10 characters)"
                rows={4}
                disabled={loading}
                minLength={10}
                aria-label="Rejection reason"
              />
            </FormControl>
            {rejectionError && <FormMessage>{rejectionError}</FormMessage>}
            <FormDescription>
              Provide a clear reason for rejecting this registration (minimum 10 characters)
            </FormDescription>
          </FormItem>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim() || rejectionReason.trim().length < 10}
              aria-label="Confirm rejection"
            >
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason('');
                setRejectionError('');
                clearError();
              }}
              disabled={loading}
              aria-label="Cancel rejection"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}






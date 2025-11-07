import { useEffect, useState } from 'react';
import { useTrackersStore } from '@/stores/trackersStore';
import { TrackerList } from './TrackerList';
import { TrackerEditModal } from './TrackerEditModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tracker } from '@/types/trackers.ts';

interface TrackerListContainerProps {
  guildId?: string;
}

/**
 * TrackerListContainer - Container component with data fetching and state management
 */
export function TrackerListContainer({ guildId }: TrackerListContainerProps) {
  const {
    trackers,
    loading,
    error,
    fetchTrackers,
    updateTracker,
    deleteTracker,
    clearError,
  } = useTrackersStore();

  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [deletingTracker, setDeletingTracker] = useState<Tracker | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrackers(guildId);
  }, [guildId, fetchTrackers]);

  const handleEdit = (tracker: Tracker) => {
    setEditingTracker(tracker);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (tracker: Tracker) => {
    setDeletingTracker(tracker);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTracker) return;

    try {
      await deleteTracker(deletingTracker.id);
      setIsDeleteDialogOpen(false);
      setDeletingTracker(null);
    } catch (err) {
      // Error is handled in store
      console.error('Error deleting tracker:', err);
    }
  };

  const handleSave = async (id: string, data: { displayName?: string; isActive?: boolean }) => {
    try {
      await updateTracker(id, data);
    } catch (err) {
      // Error is handled in store
      console.error('Error updating tracker:', err);
      throw err;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Trackers</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackerList
            trackers={trackers}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onRetry={() => fetchTrackers(guildId)}
          />
        </CardContent>
      </Card>

      <TrackerEditModal
        tracker={editingTracker}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSave}
        loading={loading}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tracker? This action cannot be undone.
              {deletingTracker && (
                <>
                  <br />
                  <br />
                  <strong>Tracker:</strong> {deletingTracker.displayName || deletingTracker.username}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



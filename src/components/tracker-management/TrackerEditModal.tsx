import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import { Switch } from '@/components/ui/switch.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import type { Tracker } from '@/types/trackers.js';

interface TrackerEditModalProps {
  tracker: Tracker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { displayName?: string; isActive?: boolean }) => Promise<void>;
  loading?: boolean;
}

/**
 * TrackerEditModal - Edit tracker metadata
 */
export function TrackerEditModal({
  tracker,
  open,
  onOpenChange,
  onSave,
  loading = false,
}: TrackerEditModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (tracker) {
      setDisplayName(tracker.displayName || '');
      setIsActive(tracker.isActive);
    }
  }, [tracker]);

  const handleSave = async () => {
    if (!tracker) return;

    await onSave(tracker.id, {
      displayName: displayName.trim() || undefined,
      isActive,
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    if (tracker) {
      setDisplayName(tracker.displayName || '');
      setIsActive(tracker.isActive);
    }
    onOpenChange(false);
  };

  if (!tracker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tracker</DialogTitle>
          <DialogDescription>
            Update tracker metadata. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name (optional)"
              maxLength={100}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Optional display name for this tracker (max 100 characters)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">
                When inactive, the tracker will not be used in tracking operations
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



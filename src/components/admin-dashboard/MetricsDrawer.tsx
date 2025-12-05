import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet.js';
import { MetricsDisplay } from './MetricsDisplay.js';

interface MetricsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalMembers: number | null;
  activeMembers: number | null;
  newThisWeek: number | null;
  totalChannels: number | null;
  channelDescription: string;
  isLoadingMembers: boolean;
  isLoadingChannels: boolean;
  hasMembersError: boolean;
  hasChannelsError: boolean;
}

/**
 * MetricsDrawer - Single responsibility: Manage Sheet/drawer UI structure
 * Composition: Wraps MetricsDisplay component in Sheet component
 * Separation of Concerns: UI structure only, no data logic
 */
export function MetricsDrawer({
  open,
  onOpenChange,
  ...metricsProps
}: MetricsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Guild Metrics</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <MetricsDisplay {...metricsProps} />
        </div>
      </SheetContent>
    </Sheet>
  );
}







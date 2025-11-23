import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button.js';
import { BarChart3 } from 'lucide-react';

interface DrawerTriggerProps {
  onClick: () => void;
  label?: string;
  icon?: ReactNode;
}

/**
 * DrawerTrigger - Single responsibility: Render trigger button for drawer
 * Pure UI component - handles only click events
 * Composition: Uses Button component with icon
 */
export function DrawerTrigger({
  onClick,
  label = 'View Metrics',
  icon,
}: DrawerTriggerProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {icon || <BarChart3 className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}







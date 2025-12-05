import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui/skeleton.js';

interface MetricCardProps {
  title: string;
  value: string | number | null;
  description?: string;
  icon: React.ElementType;
  isLoading: boolean;
  error?: string | null;
  iconColor?: string;
  iconBg?: string;
}

/**
 * MetricCard Component
 * 
 * Displays a single metric with icon, value, and optional description.
 * Handles loading and error states.
 */
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  error,
  iconColor = "text-muted-foreground",
  iconBg = "bg-muted"
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`${iconBg} p-2 rounded-lg`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-24 mb-2" />
        ) : error ? (
          <p className="text-sm text-destructive">Error loading</p>
        ) : (
          <>
            <div className="text-4xl font-bold mb-1">{value?.toLocaleString() ?? '—'}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


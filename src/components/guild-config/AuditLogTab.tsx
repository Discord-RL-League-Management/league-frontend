import { useState, useEffect, useCallback, memo } from 'react';
import { auditApi } from '../../lib/api/audit.ts';
import type { AuditLog, AuditLogFilters } from '../../types/permissions.ts';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorDisplay } from '@/components/error-display';
import { Badge } from '@/components/ui/badge';

interface AuditLogTabProps {
  guildId: string;
}

/**
 * AuditLogTab Component - Single Responsibility: Display audit logs
 * 
 * Component only handles UI for displaying audit logs.
 */
const AuditLogTabComponent = ({ guildId }: AuditLogTabProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await auditApi.getGuildAuditLogs(guildId, filters);
      setLogs(result.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [guildId, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2 text-muted-foreground">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Audit Logs</h3>
        <span className="text-sm text-muted-foreground">{logs.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">
          No audit logs found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-foreground font-semibold">Timestamp</th>
                <th className="p-2 text-foreground font-semibold">User</th>
                <th className="p-2 text-foreground font-semibold">Event Type</th>
                <th className="p-2 text-foreground font-semibold">Action</th>
                <th className="p-2 text-foreground font-semibold">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-muted">
                  <td className="p-2 text-muted-foreground text-sm">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-2 text-foreground">
                    {log.user?.username || log.userId || 'Unknown'}
                  </td>
                  <td className="p-2 text-foreground">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {log.eventType}
                    </code>
                  </td>
                  <td className="p-2 text-foreground">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </td>
                  <td className="p-2 text-foreground truncate max-w-xs">
                    {log.entityType} ({log.entityId})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const AuditLogTab = memo(AuditLogTabComponent);
AuditLogTab.displayName = 'AuditLogTab';


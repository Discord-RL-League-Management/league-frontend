import { useState, useEffect } from 'react';
import { auditApi } from '../../lib/api/audit';
import type { AuditLog, AuditLogFilters } from '../../types/permissions';

interface AuditLogTabProps {
  guildId: string;
}

/**
 * AuditLogTab Component - Single Responsibility: Display audit logs
 * 
 * Component only handles UI for displaying audit logs.
 */
export function AuditLogTab({ guildId }: AuditLogTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [guildId, filters]);

  const fetchLogs = async () => {
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
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Loading audit logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4">
        <div className="text-red-200">
          <h4 className="font-semibold">Error</h4>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Audit Logs</h3>
        <span className="text-sm text-gray-400">{logs.length} entries</span>
      </div>

      {logs.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No audit logs found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="p-2 text-gray-300 font-semibold">Timestamp</th>
                <th className="p-2 text-gray-300 font-semibold">User</th>
                <th className="p-2 text-gray-300 font-semibold">Action</th>
                <th className="p-2 text-gray-300 font-semibold">Resource</th>
                <th className="p-2 text-gray-300 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="p-2 text-gray-400 text-sm">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="p-2 text-gray-300">
                    {log.user?.username || log.userId || 'Unknown'}
                  </td>
                  <td className="p-2 text-gray-300">
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </td>
                  <td className="p-2 text-gray-300 truncate max-w-xs">
                    {log.resource}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.result === 'allowed'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


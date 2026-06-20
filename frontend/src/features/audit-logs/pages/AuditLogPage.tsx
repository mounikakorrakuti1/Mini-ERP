import { useState, useEffect } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data.data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.module || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.recordId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={24} color="var(--accent-main)" />
            System Audit Logs
          </h1>
          <p className="text-sm text-muted">System-wide audit trail of all record mutations, status changes, and access events.</p>
        </div>
        <div className="page-header__actions">
          <div className="page-header__search">
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">Date & Time</th>
              <th className="table__th">Module</th>
              <th className="table__th">Action</th>
              <th className="table__th">Record Type</th>
              <th className="table__th">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="table__td" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>Loading logs...</td>
              </tr>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr className="table__tr" key={log.id}>
                  <td className="table__td">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="table__td">
                    <span className="status-badge" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
                      {log.module}
                    </span>
                  </td>
                  <td className="table__td" style={{ fontWeight: 500 }}>{log.action}</td>
                  <td className="table__td">{log.recordType}</td>
                  <td className="table__td text-sm text-muted">
                    {log.fieldName && `Field [${log.fieldName}] `}
                    {log.oldValue && `from '${log.oldValue}' `}
                    {log.newValue && `to '${log.newValue}'`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="table__td" style={{ textAlign: 'center', padding: 'var(--space-md)' }}>No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

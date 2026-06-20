import { useState, useEffect } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const uniqueModules = Array.from(new Set(logs.map(l => l.module).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
  const uniqueUsers = Array.from(new Set(logs.map(l => l.performedBy || l.userId).filter(Boolean)));

  const filteredLogs = logs.filter(l => {
    const matchSearch =
      (l.module || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.recordId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.recordType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.performedBy || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchModule = moduleFilter === 'ALL' || l.module === moduleFilter;
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchUser = userFilter === 'ALL' || (l.performedBy || l.userId) === userFilter;
    const date = new Date(l.createdAt);
    const matchFrom = !dateFrom || date >= new Date(dateFrom);
    const matchTo = !dateTo || date <= new Date(dateTo + 'T23:59:59');
    return matchSearch && matchModule && matchAction && matchUser && matchFrom && matchTo;
  });

  const getActionColor = (action: string) => {
    switch ((action || '').toUpperCase()) {
      case 'CREATE': return { bg: 'rgba(56,161,105,0.1)', color: 'var(--status-success)' };
      case 'UPDATE': return { bg: 'rgba(3,105,161,0.1)', color: 'var(--accent-main)' };
      case 'DELETE': return { bg: 'rgba(229,62,62,0.1)', color: 'var(--status-danger)' };
      case 'CONFIRM': return { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' };
      case 'RECEIVE':
      case 'DELIVER': return { bg: 'rgba(56,161,105,0.1)', color: 'var(--status-success)' };
      case 'CANCEL': return { bg: 'rgba(229,62,62,0.1)', color: 'var(--status-danger)' };
      default: return { bg: 'var(--bg-app)', color: 'var(--text-muted)' };
    }
  };

  const clearFilters = () => {
    setSearchQuery(''); setModuleFilter('ALL'); setActionFilter('ALL');
    setUserFilter('ALL'); setDateFrom(''); setDateTo('');
  };
  const hasFilters = searchQuery || moduleFilter !== 'ALL' || actionFilter !== 'ALL' || userFilter !== 'ALL' || dateFrom || dateTo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <History size={28} color="var(--accent-main)" /> System Audit Logs
        </h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          System-wide audit trail of all record mutations, status changes, and user actions.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', alignItems: 'center' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: '220px', padding: '0.4rem var(--space-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search logs by module, action, record, user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
        </div>
        <select className="input-field" value={userFilter} onChange={e => setUserFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '120px' }}>
          <option value="ALL">All Users</option>
          {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="input-field" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '140px' }}>
          <option value="ALL">All Modules</option>
          {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input-field" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '120px' }}>
          <option value="ALL">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input className="input-field" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '0.4rem var(--space-sm)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>–</span>
          <input className="input-field" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '0.4rem var(--space-sm)' }} />
        </div>
        {hasFilters && (
          <button className="btn btn--outline" onClick={clearFilters} style={{ padding: '0.4rem var(--space-sm)', fontSize: 'var(--text-xs)' }}>Clear</button>
        )}
        <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filteredLogs.length} / {logs.length} entries</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              {['Date & Time', 'User', 'Module', 'Record Type', 'Record ID', 'Action', 'Field Changed', 'Old Value', 'New Value'].map(h => (
                <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>No audit log entries found.</td></tr>
            ) : (
              filteredLogs.map(log => {
                const actionStyle = getActionColor(log.action);
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-main)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                      {log.performedBy || log.user?.name || log.userId?.slice(0, 8) || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', backgroundColor: 'var(--bg-app)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {log.module || '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{log.recordType || '—'}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--accent-main)' }}>{(log.recordId || '').slice(0, 8)}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 700, backgroundColor: actionStyle.bg, color: actionStyle.color, whiteSpace: 'nowrap' }}>
                        {log.action || '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.fieldName || log.fieldChanged || '—'}</td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--status-danger)', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.oldValue ? String(log.oldValue) : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--status-success)', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.newValue ? String(log.newValue) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

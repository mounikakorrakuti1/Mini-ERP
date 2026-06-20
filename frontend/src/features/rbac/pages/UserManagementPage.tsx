import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCog, Mail, Briefcase, CheckCircle2, XCircle, Search, Edit2, Key, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({ position: '', active: true, roleId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/roles')
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
                      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                      (u.loginId || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.active : !u.active);
    return matchSearch && matchStatus;
  });

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      position: user.position || '',
      active: user.active,
      roleId: user.roles?.[0]?.roleId || ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.patch(`/admin/users/${editingUser.id}`, {
        position: formData.position,
        active: formData.active,
        roleId: formData.roleId || null
      });
      await fetchData();
      setEditingUser(null);
    } catch (error) {
      alert('Failed to update user.');
    }
  };

  const activateUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { active: true });
      await fetchData();
    } catch (error) {
      alert('Failed to activate user.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <ShieldCheck size={28} color="var(--accent-main)" /> User Management
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Role-based access control and account status monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Key size={14} /> Password Policy
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, minWidth: '220px', padding: '0.4rem var(--space-sm)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search users by name, email, login..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', width: '100%', outline: 'none', background: 'transparent' }} />
        </div>
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ appearance: 'auto', padding: '0.4rem var(--space-sm)', minWidth: '130px' }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Users</option>
          <option value="INACTIVE">Inactive Users</option>
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredUsers.length} users active
        </span>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border-main)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-main)', backgroundColor: 'var(--bg-app)' }}>
              {['User', 'System Access', 'Position', 'Role', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: 'var(--space-xs) var(--space-sm)', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border-main)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-app)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ID: {user.loginId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                     <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {user.email}</div>
                   </div>
                </td>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {user.position || '—'}
                </td>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                   <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: 'var(--status-success-soft)', color: 'var(--status-success)', border: '1px solid var(--status-success-soft)' }}>
                     {user.roles?.length > 0 ? user.roles[0].role.name : 'No Role'}
                   </span>
                </td>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 600, color: user.active ? 'var(--status-success)' : 'var(--status-danger)' }}>
                    {user.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                </td>
                <td style={{ padding: 'var(--space-xs) var(--space-sm)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {!user.active && (
                      <button className="btn btn--secondary" onClick={() => activateUser(user.id)} style={{ whiteSpace: 'nowrap' }}>
                        Accept
                      </button>
                    )}
                    <button className="btn btn--icon" onClick={() => openEditModal(user)}>
                      <Edit2 size={15} color="var(--accent-main)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal / Right Drawer Mockup */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--overlay-bg)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div style={{ width: '400px', height: '100%', background: 'var(--bg-surface)', boxShadow: '-8px 0 32px var(--shadow-main)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCog size={20} color="var(--accent-main)" />
                <h3 className="h3">Configure Access</h3>
              </div>
              <button className="btn btn--icon" onClick={() => setEditingUser(null)}><XCircle size={24} color="var(--text-muted)" /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', flex: 1 }}>
              <div style={{ textAlign: 'center', padding: 'var(--space-sm) 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--text-2xl)', margin: '0 auto 12px' }}>
                   {editingUser.name.charAt(0)}
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{editingUser.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{editingUser.email}</div>
              </div>

              <div className="input-group">
                <label className="input-label">Job Position</label>
                <input className="input-field" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="e.g. Production Manager" />
              </div>

              <div className="input-group">
                <label className="input-label">Security Role</label>
                <select className="input-field" value={formData.roleId} onChange={e => setFormData({...formData, roleId: e.target.value})} style={{ appearance: 'auto' }}>
                   <option value="">-- No Permissions --</option>
                   {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Roles determine module-level view/admin privileges.</p>
              </div>

              <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-main)', marginTop: 'var(--space-sm)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Account Status</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Enable or disable system login</div>
                    </div>
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                 </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="button" className="btn btn--outline" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary" style={{ flex: 1 }}>Update Permissions</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

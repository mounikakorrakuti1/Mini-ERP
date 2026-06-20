import { useState, useEffect } from 'react';
import { ShieldCheck, Edit, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      position: user.position || '',
      active: user.active,
      roleId: user.roles?.[0]?.roleId || ''
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
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
      closeEditModal();
    } catch (error) {
      console.error('Failed to update user', error);
      alert('Failed to update user. See console for details.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={24} color="var(--primary)" />
            User Management
          </h1>
          <p className="text-sm text-muted">Manage system users, assign roles, and control access.</p>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="table__th">Name</th>
              <th className="table__th">Login ID</th>
              <th className="table__th">Email</th>
              <th className="table__th">Position</th>
              <th className="table__th">Role</th>
              <th className="table__th">Status</th>
              <th className="table__th" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="table__td" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-md)' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="table__tr">
                  <td className="table__td" style={{ fontWeight: 500 }}>{user.name}</td>
                  <td className="table__td">{user.loginId}</td>
                  <td className="table__td">{user.email}</td>
                  <td className="table__td">{user.position || '-'}</td>
                  <td className="table__td">
                    {user.roles?.length > 0 ? user.roles[0].role.name : <span style={{ color: 'var(--status-warning)' }}>Unassigned</span>}
                  </td>
                  <td className="table__td">
                    {user.active ? (
                      <span className="badge badge--success">Active</span>
                    ) : (
                      <span className="badge badge--danger">Inactive</span>
                    )}
                  </td>
                  <td className="table__td" style={{ textAlign: 'right' }}>
                    <button className="btn btn--icon" onClick={() => openEditModal(user)}>
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface)', padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 className="h4">Edit User: {editingUser.name}</h3>
              <button className="btn btn--icon" onClick={closeEditModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="input-group">
                <label className="input-label">Position / Job Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.position} 
                  onChange={e => setFormData({...formData, position: e.target.value})} 
                  placeholder="e.g. Sales Rep"
                />
              </div>

              <div className="input-group">
                <label className="input-label">System Role</label>
                <select 
                  className="input-field" 
                  value={formData.roleId} 
                  onChange={e => setFormData({...formData, roleId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'var(--space-md)' }}>
                <input 
                  type="checkbox" 
                  id="activeCheckbox"
                  checked={formData.active} 
                  onChange={e => setFormData({...formData, active: e.target.checked})} 
                />
                <label htmlFor="activeCheckbox" style={{ cursor: 'pointer', margin: 0 }}>Account Active</label>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--outline" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="btn btn--primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

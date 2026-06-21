import { useState, useEffect, useRef } from 'react';
import { User, Mail, MapPin, Phone, Briefcase, Calendar, Shield, BadgeCheck, Edit2, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;

    const fetchData = async () => {
      try {
        const id = authUser.id;
        const [userRes, soRes, poRes, moRes, prodRes, invRes] = await Promise.all([
          api.get(`/admin/users/${id}`),
          api.get(`/sales-orders?salesPersonId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/purchase-orders?responsiblePersonId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/manufacturing-orders?operatorId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/products?limit=5`).catch(() => ({ data: { data: [] } })),
          api.get(`/inventory/movements?limit=5`).catch(() => ({ data: { data: [] } }))
        ]);
        
        setUserDetails(userRes.data.data);
        setSalesOrders(soRes.data.data?.items || soRes.data.data || []);
        setPurchaseOrders(poRes.data.data?.items || poRes.data.data || []);
        setManufacturingOrders(moRes.data.data?.items || moRes.data.data || []);
        setProducts(prodRes.data.data?.items || prodRes.data.data || []);
        setInventoryMovements(invRes.data.data?.items || invRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch profile details', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authUser?.id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large. Please select an image under 2MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await api.patch('/profile', { avatar: base64 });
        updateUser({ avatar: base64 });
        setUserDetails((prev: any) => ({ ...prev, avatar: base64 }));
      } catch (err) {
        console.error('Failed to upload avatar', err);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-muted)' }}>
        <div className="placeholder-page__pulse">
          <div className="placeholder-page__pulse-dot" />
          <div className="placeholder-page__pulse-ring" />
        </div>
        <span style={{ marginLeft: 'var(--space-md)' }}>Loading your profile...</span>
      </div>
    );
  }

  const profile = userDetails || authUser;
  const userRole = profile.roles?.length > 0 ? profile.roles[0].role.name : (profile.role || 'No Role Assigned');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Header Area */}
      <div className="profile-header">
        <h1 className="h1" style={{ marginBottom: '4px' }}>My Profile</h1>
        <p className="text-sm text-muted">Manage your personal information and view your active assignments.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="card" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 320px', 
        gap: 'var(--space-xl)',
        padding: 'var(--space-xl)',
        background: 'linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-app) 100%)',
        border: '1px solid var(--border-main)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Information Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-main)' }}>
              <BadgeCheck size={24} />
            </div>
            <h3 className="h3" style={{ margin: 0 }}>Account Details</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 'var(--space-md) var(--space-xl)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Full Name</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{profile.name}</div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Email Address</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--accent-main)" /> {profile.email}
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Phone Content</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="var(--accent-main)" /> {profile.mobile || '—'}
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Address</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--accent-main)" /> {profile.address || '—'}
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Current Position</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="var(--accent-main)" /> {profile.position || '—'}
            </div>

            <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Member Since</div>
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>

          {/* Status Box */}
          <div style={{ 
            marginTop: 'var(--space-md)', 
            padding: 'var(--space-md)', 
            borderRadius: '12px', 
            background: 'rgba(var(--accent-rgb), 0.05)',
            border: '1px solid var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)'
          }}>
            <Shield size={24} color="var(--accent-main)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Role</div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-main)' }}>{userRole}</div>
            </div>
            <span className="status-badge status-badge--success">Online</span>
          </div>
        </div>

        {/* Profile Identity */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 'var(--space-lg)',
          paddingLeft: 'var(--space-xl)',
          borderLeft: '1px solid var(--border-main)'
        }}>
          <div 
            onClick={handleAvatarClick}
            style={{ 
              width: '160px', 
              height: '160px', 
              borderRadius: '40px', 
              backgroundColor: 'var(--accent-soft)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '4.5rem',
              fontWeight: 800,
              color: 'var(--accent-main)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
              border: isUploading ? '2px solid var(--accent-main)' : 'none'
            }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile.name?.charAt(0).toUpperCase()
            )}
            
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="placeholder-page__pulse-dot" style={{ width: '12px', height: '12px' }} />
              </div>
            )}

            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              right: '10px', 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--status-success)',
              border: '3px solid var(--bg-surface)',
              zIndex: 2
            }} />

            {/* Hover Overlay */}
            <div className="avatar-overlay" style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: 'rgba(0,0,0,0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
              color: '#fff'
            }}>
              <Upload size={32} />
            </div>
            <style>{`
              [onClick]:hover .avatar-overlay { opacity: 1; }
            `}</style>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 className="h2" style={{ marginBottom: '4px' }}>{profile.name}</h2>
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>@{profile.loginId || profile.email?.split('@')[0]}</p>
          </div>

          <button className="btn btn--primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => alert('Editing details coming soon. Try uploading a photo by clicking the avatar!')}>
            <Edit2 size={16} /> Edit Details
          </button>
        </div>
      </div>

      {/* Role-Based Assignments Area */}
      <div style={{ borderTop: '2px dashed var(--border-main)', paddingTop: 'var(--space-lg)' }}>
        <h4 className="h4" style={{ marginBottom: 'var(--space-md)' }}>Your Operations Overview</h4>
        
        {userRole.toLowerCase().includes('inventory') ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead className="table__thead">
                <tr>
                  <th className="table__th">Product</th>
                  <th className="table__th">Direction</th>
                  <th className="table__th">Source</th>
                  <th className="table__th">Signed Qty</th>
                  <th className="table__th">Date</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMovements.length > 0 ? inventoryMovements.map((mov: any) => (
                  <tr key={mov.id} className="table__tr">
                    <td className="table__td">{mov.productId}</td>
                    <td className="table__td"><span className={`status-badge ${mov.direction === 'IN' ? 'status-badge--success' : 'status-badge--warning'}`}>{mov.direction}</span></td>
                    <td className="table__td">{mov.source}</td>
                    <td className="table__td" style={{ fontWeight: 600 }}>{mov.signedQty}</td>
                    <td className="table__td">{new Date(mov.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="table__td text-center text-muted">No recent stock movements recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : userRole.toLowerCase().includes('manufactur') ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
             <table className="table">
              <thead className="table__thead">
                <tr>
                  <th className="table__th">Finished Product</th>
                  <th className="table__th">Quantity</th>
                  <th className="table__th">BoM Ref</th>
                  <th className="table__th">Status</th>
                </tr>
              </thead>
              <tbody>
                {manufacturingOrders.length > 0 ? manufacturingOrders.map((mo: any) => (
                  <tr key={mo.id} className="table__tr">
                    <td className="table__td">{mo.finishedProduct?.name || mo.finishedProductId}</td>
                    <td className="table__td">{mo.quantity}</td>
                    <td className="table__td">{mo.bom?.reference || '—'}</td>
                    <td className="table__td"><span className="status-badge status-badge--info">{mo.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="table__td text-center text-muted">No manufacturing assignments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
            <p className="text-muted">No specialized assignments found for your current role ({userRole}).</p>
          </div>
        )}
      </div>
    </div>
  );
}


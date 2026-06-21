import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Mail, MapPin, Phone, Briefcase, Calendar, Shield, BadgeCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [manufacturingOrders, setManufacturingOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudData, setCloudData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, soRes, poRes, moRes, prodRes, invRes] = await Promise.all([
          api.get(`/admin/users/${id}`),
          api.get(`/sales-orders?salesPersonId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/purchase-orders?responsiblePersonId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/manufacturing-orders?operatorId=${id}`).catch(() => ({ data: { data: [] } })),
          api.get(`/products?limit=5`).catch(() => ({ data: { data: [] } })),
          api.get(`/inventory/movements?limit=5`).catch(() => ({ data: { data: [] } }))
        ]);
        setUser(userRes.data.data);
        setSalesOrders(soRes.data.data || []);
        setPurchaseOrders(poRes.data.data || []);
        setManufacturingOrders(moRes.data.data || []);
        setProducts(prodRes.data.data || []);
        setInventoryMovements(invRes.data.data || []);

        try {
          const cloudRes = await fetch(`https://randomuser.me/api/?seed=${id}`);
          const cloudJson = await cloudRes.json();
          setCloudData(cloudJson.results[0]);
        } catch (e) {
          console.warn('Failed to drag data from cloud', e);
        }
      } catch (error) {
        console.error('Failed to fetch user details', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-muted)' }}>
        <div className="placeholder-page__pulse">
          <div className="placeholder-page__pulse-dot" />
          <div className="placeholder-page__pulse-ring" />
        </div>
        <span style={{ marginLeft: 'var(--space-md)' }}>Loading user profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <XCircle size={48} color="var(--status-danger)" style={{ marginBottom: 'var(--space-md)' }} />
        <h2 className="h2">User Not Found</h2>
        <p className="text-muted">The user you are looking for does not exist or has been removed.</p>
        <button className="btn btn--primary" style={{ marginTop: 'var(--space-md)' }} onClick={() => navigate(ROUTES.USER_MANAGEMENT)}>
          Back to User Management
        </button>
      </div>
    );
  }

  const userRole = user.roles?.length > 0 ? user.roles[0].role.name : 'No Role Assigned';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <button 
          className="btn btn--icon" 
          onClick={() => navigate(ROUTES.USER_MANAGEMENT)}
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
        >
          <ArrowLeft size={20} color="var(--text-main)" />
        </button>
        <div>
          <div className="breadcrumbs" style={{ marginBottom: 0 }}>
            <span>Admin</span>
            <span>/</span>
            <span>User Management</span>
            <span>/</span>
            <span className="breadcrumbs__crumb--active">{user.name}</span>
          </div>
          <h1 className="h2" style={{ marginTop: '4px' }}>User Profile</h1>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="card" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 300px', 
        gap: 'var(--space-lg)',
        padding: 'var(--space-lg)',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-app) 100%)',
        border: '1px solid var(--border-main)',
        boxShadow: 'var(--shadow-main)'
      }}>
        {/* Left Side: Personal Details (Columns as Rows) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
            <BadgeCheck size={20} color="var(--accent-main)" />
            <h3 className="h3" style={{ fontSize: 'var(--text-lg)' }}>Personal Details</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-sm) var(--space-lg)' }}>
            {/* Name */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Name :</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{user.name}</div>

            {/* Address */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Address :</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <MapPin size={16} color="var(--accent-main)" /> {user.address || (cloudData ? `${cloudData.location.street.number} ${cloudData.location.street.name}, ${cloudData.location.city}` : 'Not provided')}
            </div>

            {/* Mobile Number */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Mobile Number :</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Phone size={16} color="var(--accent-main)" /> {user.mobile || (cloudData ? cloudData.cell : 'Not provided')}
            </div>

            {/* Email ID */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Email ID :</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Mail size={16} color="var(--accent-main)" /> {user.email}
            </div>

            {/* Position */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Position :</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Briefcase size={16} color="var(--accent-main)" /> {user.position || 'Not provided'}
            </div>

            {/* Creation Date (READ ONLY) */}
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Creation Date :</div>
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Calendar size={16} /> {new Date(user.createdAt).toLocaleDateString()} (Read-only)
            </div>
          </div>

          {/* Role & Status (Extra Info) */}
          <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 'var(--space-sm)', borderLeft: '4px solid var(--accent-main)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Shield size={20} color="var(--accent-main)" />
                <div>
                   <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Role</div>
                   <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{userRole}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                   <span className={`status-badge ${user.active ? 'status-badge--success' : 'status-badge--danger'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Profile Image & Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', borderLeft: '1px solid var(--border-main)', paddingLeft: 'var(--space-lg)' }}>
           <div style={{ position: 'relative' }}>
             <div style={{ 
               width: '140px', 
               height: '140px', 
               borderRadius: '24px', 
               backgroundColor: 'var(--accent-soft)', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               border: '4px solid #fff',
               boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
               overflow: 'hidden'
             }}>
               {cloudData?.picture?.large ? (
                 <img src={cloudData.picture.large} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <span style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--accent-main)' }}>
                   {user.name.charAt(0).toUpperCase()}
                 </span>
               )}
             </div>
             <button 
               className="btn btn--icon" 
               style={{ 
                 position: 'absolute', 
                 bottom: '-12px', 
                 right: '-12px', 
                 backgroundColor: '#fff', 
                 boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                 border: '1px solid var(--border-main)',
                 zIndex: 10
               }}
               title="Edit Avatar"
             >
               <Edit2 size={16} color="var(--accent-main)" />
             </button>
           </div>
           
           <div style={{ textAlign: 'center' }}>
             <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>{user.name}</h4>
             <p className="text-xs" style={{ color: 'var(--text-muted)' }}>User ID: {user.loginId}</p>
           </div>

           <button 
             className="btn btn--outline" 
             style={{ width: '100%', marginTop: 'auto' }}
             onClick={() => alert('Edit profile feature coming soon!')}
           >
             <Edit2 size={16} /> Edit Profile
           </button>
        </div>
      </div>

      {/* Operations Table */}
      {userRole.toLowerCase().includes('inventory') ? (
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--text-md)' }}>Inventory Access Overview</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
            Recent stock movements tracked by this inventory manager.
          </p>
          <div className="table-container" style={{ border: '1px solid var(--border-main)', borderRadius: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Product ID</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Direction</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Source</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Reference</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Quantity</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMovements.length > 0 ? inventoryMovements.slice(0, 5).map((mov: any) => (
                  <tr key={mov.id} className="table__tr">
                    <td className="table__td" style={{ fontWeight: 500 }}>{mov.productId}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${mov.direction === 'IN' ? 'status-badge--success' : 'status-badge--warning'}`}>
                        {mov.direction}
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{mov.source}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{mov.referenceType} ({mov.referenceId.slice(0, 8)})</td>
                    <td className="table__td" style={{ textAlign: 'center', fontWeight: 600 }}>{mov.signedQty}</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(mov.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr className="table__tr" style={{ opacity: 0.5 }}>
                    <td className="table__td" style={{ fontWeight: 500 }}>PROD-SYS-101</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span className="status-badge status-badge--success">IN</span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'center' }}>VENDOR</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>PO (demo-xyz)</td>
                    <td className="table__td" style={{ textAlign: 'center', fontWeight: 600 }}>+100</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {inventoryMovements.length === 0 && (
              <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No actual stock movements recorded yet. Showing demo entry.
              </div>
            )}
          </div>
        </div>
      ) : userRole.toLowerCase().includes('owner') ? (
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--text-md)' }}>Products Portfolio Overview</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
            System-wide products accessible to the business owner.
          </p>
          <div className="table-container" style={{ border: '1px solid var(--border-main)', borderRadius: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Product Ref</th>
                  <th className="table__th">Product Name</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Category</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Cost Price</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Sales Price</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>On Hand</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? products.slice(0, 5).map((prod: any) => (
                  <tr key={prod.id} className="table__tr">
                    <td className="table__td" style={{ fontWeight: 500 }}>{prod.reference}</td>
                    <td className="table__td">{prod.name}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span className="status-badge status-badge--info">
                        {prod.category}
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right' }}>${Number(prod.costPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>${Number(prod.salesPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{Number(prod.onHandQty)}</td>
                  </tr>
                )) : (
                  <tr className="table__tr" style={{ opacity: 0.5 }}>
                    <td className="table__td" style={{ fontWeight: 500 }}>PRD-DEMO-01</td>
                    <td className="table__td">Premium Wooden Chair</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span className="status-badge status-badge--info">FINISHED_GOOD</span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right' }}>$45.00</td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>$120.00</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>150</td>
                  </tr>
                )}
              </tbody>
            </table>
            {products.length === 0 && (
              <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No actual products found in catalog. Showing demo entry.
              </div>
            )}
          </div>
        </div>
      ) : userRole.toLowerCase().includes('manufactur') ? (
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--text-md)' }}>Manufacturing Assignments Overview</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
            Detailed view of manufacturing orders assigned to this operator.
          </p>
          <div className="table-container" style={{ border: '1px solid var(--border-main)', borderRadius: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Product to Manufacture</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Product Quantity</th>
                  <th className="table__th">BoM</th>
                  <th className="table__th">Responsible Person</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Finished Quantity</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Creation Date</th>
                </tr>
              </thead>
              <tbody>
                {manufacturingOrders.length > 0 ? manufacturingOrders.map((mo: any) => (
                  <tr key={mo.id} className="table__tr">
                    <td className="table__td" style={{ fontWeight: 500 }}>{mo.finishedProduct?.name || '—'}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{mo.quantity}</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{mo.bom?.reference || '—'}</td>
                    <td className="table__td">{user.name}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{mo.status === 'DONE' ? mo.quantity : 0}</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(mo.createdAt).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr className="table__tr" style={{ opacity: 0.5 }}>
                    <td className="table__td" style={{ fontWeight: 500 }}>Wooden Chair</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>50</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>BOM-123456</td>
                    <td className="table__td">{user.name}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>0</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {manufacturingOrders.length === 0 && (
              <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No actual manufacturing operations assigned yet. Showing demo entry.
              </div>
            )}
          </div>
        </div>
      ) : userRole.toLowerCase().includes('purchase') ? (
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--text-md)' }}>Purchase Assignments Overview</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
            Detailed view of vendors and purchase orders assigned to this user.
          </p>
          <div className="table-container" style={{ border: '1px solid var(--border-main)', borderRadius: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Vendor</th>
                  <th className="table__th">Vendor Address</th>
                  <th className="table__th">Product</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Ordered Qty</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Received Qty</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Cost Price</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Status</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Total</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Creation Date</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length > 0 ? purchaseOrders.flatMap(po => po.items.map((item: any, i: number) => (
                  <tr key={`${po.id}-${i}`} className="table__tr">
                    <td className="table__td" style={{ fontWeight: 500 }}>{po.vendor?.name}</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{po.vendorAddress || po.vendor?.address || '—'}</td>
                    <td className="table__td">{item.product?.name || item.productId}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{item.orderedQty}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{item.receivedQty}</td>
                    <td className="table__td" style={{ textAlign: 'right' }}>${Number(item.costPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--status-success-soft)', color: 'var(--status-success)' }}>
                        {po.status}
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>${(item.orderedQty * item.costPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(po.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))) : (
                  <tr className="table__tr" style={{ opacity: 0.5 }}>
                    <td className="table__td" style={{ fontWeight: 500 }}>Demo Vendor Ltd</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>123 Industrial Park, NY</td>
                    <td className="table__td">Steel Connectors</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>5000</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>0</td>
                    <td className="table__td" style={{ textAlign: 'right' }}>$1.20</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--status-warning-soft)', color: 'var(--status-warning)' }}>
                        DRAFT
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>$6,000.00</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {purchaseOrders.length === 0 && (
              <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No actual purchase orders assigned yet. Showing demo entry.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 'var(--space-sm)' }}>
          <h3 className="h3" style={{ marginBottom: 'var(--space-sm)', fontSize: 'var(--text-md)' }}>Sales Assignments Overview</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-md)' }}>
            Detailed view of customers and orders assigned to this user.
          </p>
          <div className="table-container" style={{ border: '1px solid var(--border-main)', borderRadius: '8px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="table__th">Customer</th>
                  <th className="table__th">Customer Address</th>
                  <th className="table__th">Product</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Ordered Qty</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Delivered Qty</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Sales Price</th>
                  <th className="table__th" style={{ textAlign: 'center' }}>Status</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Total</th>
                  <th className="table__th" style={{ textAlign: 'right' }}>Creation Date</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.length > 0 ? salesOrders.flatMap(so => so.items.map((item: any, i: number) => (
                  <tr key={`${so.id}-${i}`} className="table__tr">
                    <td className="table__td" style={{ fontWeight: 500 }}>{so.customer?.name}</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{so.customerAddress || so.customer?.address || '—'}</td>
                    <td className="table__td">{item.product?.name || item.productId}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{item.orderedQty}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>{item.deliveredQty}</td>
                    <td className="table__td" style={{ textAlign: 'right' }}>${Number(item.salesPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--status-success-soft)', color: 'var(--status-success)' }}>
                        {so.status}
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>${(item.orderedQty * item.salesPrice).toLocaleString()}</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date(so.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))) : (
                  <tr className="table__tr" style={{ opacity: 0.5 }}>
                    <td className="table__td" style={{ fontWeight: 500 }}>Demo Customer Inc</td>
                    <td className="table__td" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>456 Tech Lane, CA</td>
                    <td className="table__td">Pro Widget v2</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>100</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>0</td>
                    <td className="table__td" style={{ textAlign: 'right' }}>$49.99</td>
                    <td className="table__td" style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--status-warning-soft)', color: 'var(--status-warning)' }}>
                        DRAFT
                      </span>
                    </td>
                    <td className="table__td" style={{ textAlign: 'right', fontWeight: 600 }}>$4,999.00</td>
                    <td className="table__td" style={{ textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {salesOrders.length === 0 && (
              <div style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No actual sales orders assigned yet. Showing demo entry.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

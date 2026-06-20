import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { ROUTES } from '@/routes/routeMap';
import { Sparkles, AlertTriangle, CheckCircle, Clock, ShoppingCart, RefreshCw, Factory } from 'lucide-react';

export default function ProcurementRecommendationPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const [alertsRes, recsRes] = await Promise.all([
        api.get('/procurement/alerts'),
        api.get('/procurement/recommendations'),
      ]);
      setAlerts(alertsRes.data.data || []);
      setRecommendations(recsRes.data.data || []);
    } catch (e) {
      console.error('Failed to fetch procurement inbox', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await api.post('/procurement/generate', {});
      await fetchInbox();
    } catch (e) {
      alert('Failed to generate recommendations');
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, isManufacturing: boolean) => {
    setApprovingId(id);
    try {
      await api.patch(`/procurement/recommendations/${id}/approve`, {});
      await fetchInbox();
      alert(`Recommendation approved! ${isManufacturing ? 'MO' : 'PO'} created successfully.`);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to approve recommendation.');
    } finally {
      setApprovingId(null);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK': return <AlertTriangle size={18} color="var(--status-danger)" />;
      case 'PREDICTED_STOCKOUT': return <Clock size={18} color="var(--status-warning)" />;
      case 'HIGH_DEMAND': return <Sparkles size={18} color="var(--accent-main)" />;
      default: return <AlertTriangle size={18} color="var(--status-warning)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        <div>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <Sparkles size={28} color="var(--accent-main)" /> AI Procurement Inbox
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Smart recommendations based on demand forecasting, safety stock, and vendor lead times.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn--outline" onClick={fetchInbox} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn--primary" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} /> Analyze & Generate
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
          <RefreshCw className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 'var(--space-xs)' }}>Analyzing inventory levels and predicting demand...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div>
              <h3 className="h3" style={{ marginBottom: 'var(--space-sm)' }}>Active Alerts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {alerts.map(alert => (
                  <div key={alert.id} className="card" style={{ borderLeft: '4px solid var(--status-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      {getAlertIcon(alert.type)}
                      <strong style={{ fontSize: 'var(--text-sm)' }}>{alert.product?.name || 'Unknown Product'}</strong>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-app)', padding: 'var(--space-xs)', borderRadius: '4px' }}>
                      {alert.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div>
            <h3 className="h3" style={{ marginBottom: 'var(--space-sm)' }}>Recommended Actions</h3>
            {recommendations.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--status-success)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <CheckCircle size={48} />
                <div>
                  <h4 className="text-md">All Clear!</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Inventory is healthy and no predicted stockouts within vendor lead times.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {recommendations.map(rec => {
                  const isManufacturing = rec.explanation?.includes('Action: Manufacture');
                  return (
                    <div key={rec.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', position: 'relative', overflow: 'hidden' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <strong className="h3">{rec.product?.name || 'Unknown Product'}</strong>
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 600, backgroundColor: rec.priority === 'HIGH' ? 'rgba(229,62,62,0.1)' : 'rgba(221,107,32,0.1)', color: rec.priority === 'HIGH' ? 'var(--status-danger)' : 'var(--status-warning)' }}>
                              {rec.priority} PRIORITY
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                            <strong>AI Reason:</strong> {rec.explanation}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>AI Confidence</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${rec.confidenceScore}%`, height: '100%', backgroundColor: Number(rec.confidenceScore) > 80 ? 'var(--status-success)' : 'var(--status-warning)' }} />
                            </div>
                            <span className="text-sm font-semibold">{Number(rec.confidenceScore).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: 'var(--bg-app)', padding: 'var(--space-sm)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Recommended Action</div>
                          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--accent-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isManufacturing ? <Factory size={16} /> : <ShoppingCart size={16} />}
                            {isManufacturing ? 'Manufacture' : 'Purchase'} {Number(rec.recommendedQty)} units
                          </div>
                        </div>
                        
                        <button 
                          className="btn btn--primary" 
                          onClick={() => handleApprove(rec.id, isManufacturing)}
                          disabled={approvingId === rec.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <CheckCircle size={16} /> Approve & Create {isManufacturing ? 'MO' : 'PO'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, ArrowLeft } from 'lucide-react';
import { DndContext, useDroppable, useDraggable, DragEndEvent } from '@dnd-kit/core';
import { ROUTES } from '@/routes/routeMap';
import { api } from '@/lib/api';

// --- Kanban Components ---

function KanbanCard({ order }: { order: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
    data: { order }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className="card"
      style={{ 
        cursor: 'grab', 
        marginBottom: 'var(--space-sm)', 
        padding: 'var(--space-md)', 
        backgroundColor: 'var(--bg-main)',
        boxShadow: transform ? '0 10px 20px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        ...style 
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{order.reference || order.id.slice(0,8)}</div>
      <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>Product: {order.finishedProduct?.name || 'Unknown'}</div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Qty: {Number(order.quantity).toFixed(2)}</div>
    </div>
  );
}

function KanbanColumn({ id, label, borderColor, orders }: { id: string, label: string, borderColor: string, orders: any[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="kanban__col" ref={setNodeRef} style={{ backgroundColor: isOver ? 'var(--bg-secondary)' : 'transparent', transition: 'background-color 0.2s', display: 'flex', flexDirection: 'column' }}>
      <div className="kanban__col-header" style={{ borderBottomColor: borderColor }}>
        <h3 className="kanban__col-title">{label}</h3>
        <span className="kanban__badge">{orders.length}</span>
      </div>
      <div style={{ padding: 'var(--space-sm)', flex: 1 }}>
        {orders.length === 0 ? (
          <div className="kanban__empty">
            <Factory size={32} style={{ opacity: 0.3, marginBottom: 'var(--space-sm)' }} />
            <div>No work orders</div>
          </div>
        ) : (
          orders.map(order => <KanbanCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function KanbanBoardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columns = [
    { id: 'DRAFT', label: 'Draft', borderColor: 'var(--status-draft)' },
    { id: 'CONFIRMED', label: 'Confirmed', borderColor: 'var(--status-warning)' },
    { id: 'IN_PROGRESS', label: 'In Progress', borderColor: 'var(--status-confirmed)' },
    { id: 'COMPLETED', label: 'Completed', borderColor: 'var(--status-success)' },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/manufacturing-orders');
        setOrders(res.data.data);
      } catch (err) {
        console.error('Failed to fetch manufacturing orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const order = orders.find(o => o.id === orderId);
    const newStatus = over.id as string;

    if (!order || order.status === newStatus) return;

    // Validate sequential workflow
    const validTransitions: Record<string, string> = {
      'DRAFT': 'CONFIRMED',
      'CONFIRMED': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED'
    };

    if (validTransitions[order.status] !== newStatus) {
      alert(`Invalid transition. You can only move orders from ${order.status.replace('_', ' ')} to ${validTransitions[order.status]?.replace('_', ' ') || 'none'}.`);
      return;
    }

    // Optimistic UI update
    const previousOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      let endpoint = '';
      if (newStatus === 'CONFIRMED') endpoint = `/manufacturing-orders/${orderId}/confirm`;
      else if (newStatus === 'IN_PROGRESS') endpoint = `/manufacturing-orders/${orderId}/start`;
      else if (newStatus === 'COMPLETED') endpoint = `/manufacturing-orders/${orderId}/complete`;
      
      if (endpoint) {
        await api.patch(endpoint);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
      setOrders(previousOrders); // Rollback
    }
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>Loading Kanban Board...</div>;
  }

  return (
    <div className="kanban">
      <div className="kanban__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn--icon" onClick={() => navigate(ROUTES.MANUFACTURING_ORDERS)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2">Manufacturing Kanban</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Drag work orders to the next stage to update their status
            </p>
          </div>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="kanban__board" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', alignItems: 'start' }}>
          {columns.map((col) => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              label={col.label} 
              borderColor={col.borderColor} 
              orders={orders.filter(o => o.status === col.id)} 
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

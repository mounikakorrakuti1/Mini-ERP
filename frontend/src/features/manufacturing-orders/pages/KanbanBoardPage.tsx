import { Factory } from 'lucide-react';

export default function KanbanBoardPage() {
  const columns = [
    { id: 'pending', label: 'Pending', borderColor: 'var(--status-draft)' },
    { id: 'in-progress', label: 'In Progress', borderColor: 'var(--status-warning)' },
    { id: 'quality-check', label: 'Quality Check', borderColor: 'var(--accent-main)' },
    { id: 'completed', label: 'Completed', borderColor: 'var(--status-success)' },
  ];

  return (
    <div className="kanban">
      <div className="kanban__header">
        <div>
          <h1 className="h2">Manufacturing Kanban</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Drag work orders between stages to update status
          </p>
        </div>
        <div className="placeholder-page__badge">
          <span className="placeholder-page__pulse">
            <span className="placeholder-page__pulse-ring" />
            <span className="placeholder-page__pulse-dot" />
          </span>
          Coming Soon
        </div>
      </div>

      <div className="kanban__board">
        {columns.map((col) => (
          <div key={col.id} className="kanban__col">
            <div className="kanban__col-header" style={{ borderBottomColor: col.borderColor }}>
              <h3 className="kanban__col-title">{col.label}</h3>
              <span className="kanban__badge">0</span>
            </div>
            <div className="kanban__empty">
              <Factory size={32} style={{ opacity: 0.3, marginBottom: 'var(--space-sm)' }} />
              <div>No work orders</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

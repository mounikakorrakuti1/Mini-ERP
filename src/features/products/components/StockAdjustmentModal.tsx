import { useState } from 'react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onSave: (direction: 'IN' | 'OUT', quantity: number, reason: string) => void;
}

export function StockAdjustmentModal({ isOpen, onClose, productName, onSave }: StockAdjustmentModalProps) {
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number greater than 0');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the stock adjustment');
      return;
    }

    onSave(direction, qty, reason);
    onClose();
    // reset form
    setDirection('IN');
    setQuantity('1');
    setReason('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-md)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
          <h3 className="h3">Direct Stock Adjustment</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Manually adjust stock for <strong>{productName}</strong>. This bypasses the typical purchase or sales orders flows and will be logged in the ledger.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(229, 62, 62, 0.1)',
                border: '1px solid var(--status-danger)',
                color: 'var(--status-danger)',
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {error}
            </div>
          )}

          {/* Direction */}
          <div className="input-group">
            <label className="input-label">Adjustment Type (Direction)</label>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-micro)' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'IN'}
                  onChange={() => setDirection('IN')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--status-success)' }}
                />
                <span className="text-sm" style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>IN (Increase Stock)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="direction"
                  checked={direction === 'OUT'}
                  onChange={() => setDirection('OUT')}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--status-danger)' }}
                />
                <span className="text-sm" style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>OUT (Decrease Stock)</span>
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div className="input-group">
            <label className="input-label">Quantity to Adjust</label>
            <input
              type="number"
              className="input-field"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              min="1"
              required
            />
          </div>

          {/* Reason */}
          <div className="input-group">
            <label className="input-label">Reason for Adjustment</label>
            <textarea
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a audit log justification (e.g., Damaged item write-off, Cycle count correction)"
              rows={3}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
            <button type="button" className="btn btn--outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Post Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

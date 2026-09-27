import React, { useState } from 'react';
import type { CreateShipmentInput, ShipmentStatus } from '../types';
import { X, AlertCircle } from 'lucide-react';
import { STATUS_LABELS } from './StatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateShipmentInput) => Promise<void>;
}

export const CreateShipmentModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const getDefaultDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<CreateShipmentInput>({
    referenceNumber: '',
    origin: '',
    destination: '',
    expectedDeliveryDate: getDefaultDeliveryDate(),
    initialStatus: 'BOOKED',
    note: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const ref = formData.referenceNumber.trim();
    if (!ref) {
      setError('Please provide a reference number');
      return;
    }
    if (!/^\d{6}$/.test(ref)) {
      setError('Reference number must be exactly 6 digits (e.g. 104926)');
      return;
    }
    if (!formData.origin.trim() || !formData.destination.trim()) {
      setError('Origin and destination are required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ ...formData, referenceNumber: ref });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Consignment</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Reference Number (6 Digits) *</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="form-input"
              placeholder="e.g. 104926"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Origin Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kathmandu Cargo Hub"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Destination Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Frankfurt Cargo Airport"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expected Delivery Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-select"
                value={formData.initialStatus}
                onChange={(e) => setFormData({ ...formData, initialStatus: e.target.value as ShipmentStatus })}
              >
                {(Object.keys(STATUS_LABELS) as ShipmentStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Current Checkpoint / Location (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tribhuvan Int. Airport"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Manifest Notes (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Consignment booked and airway manifest sealed"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Register Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

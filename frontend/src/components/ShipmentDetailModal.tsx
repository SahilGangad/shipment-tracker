import React, { useState, useEffect } from 'react';
import type { Shipment, ShipmentStatus, UpdateStatusInput } from '../types';
import { fetchShipmentById, updateShipmentStatus } from '../api';
import { StatusBadge, STATUS_LABELS } from './StatusBadge';
import {
  X,
  MapPin,
  Calendar,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';

interface Props {
  shipmentId: string | null;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const ShipmentDetailModal: React.FC<Props> = ({
  shipmentId,
  onClose,
  onStatusUpdated,
}) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status update form state
  const [nextStatus, setNextStatus] = useState<ShipmentStatus>('IN_TRANSIT');
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!shipmentId) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    fetchShipmentById(shipmentId)
      .then((data) => {
        if (mounted) {
          setShipment(data);
          // Set sensible next status default
          if (data.currentStatus === 'BOOKED') setNextStatus('IN_TRANSIT');
          else if (data.currentStatus === 'IN_TRANSIT') setNextStatus('OUT_FOR_DELIVERY');
          else if (data.currentStatus === 'OUT_FOR_DELIVERY') setNextStatus('DELIVERED');
          else setNextStatus(data.currentStatus);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load details');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [shipmentId]);

  if (!shipmentId) return null;

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;

    setError(null);
    setSuccessMsg(null);
    setUpdating(true);

    try {
      const payload: UpdateStatusInput = {
        status: nextStatus,
        location: updateLocation.trim() || undefined,
        note: updateNote.trim() || undefined,
      };

      const updated = await updateShipmentStatus(shipment.id, payload);
      setShipment(updated);
      setUpdateLocation('');
      setUpdateNote('');
      setSuccessMsg(`Status updated to ${STATUS_LABELS[nextStatus]} successfully`);
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <span>Shipment Timeline</span>
            {shipment && (
              <span style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                {shipment.referenceNumber}
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading tracking history...
            </div>
          ) : error ? (
            <div className="alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : shipment ? (
            <>
              {/* Route Summary Card */}
              <div className="route-row">
                <div className="route-endpoint">
                  <span className="endpoint-label">Origin</span>
                  <span className="endpoint-name">{shipment.origin}</span>
                </div>
                <div className="route-connector">
                  <div className="connector-line" />
                  <ArrowRight size={14} color="#2563eb" />
                </div>
                <div className="route-endpoint" style={{ textAlign: 'right' }}>
                  <span className="endpoint-label">Destination</span>
                  <span className="endpoint-name">{shipment.destination}</span>
                </div>
              </div>

              {/* Status and Expected Date Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: 'var(--bg-surface-elevated)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Current Lifecycle State
                  </div>
                  <StatusBadge status={shipment.currentStatus} />
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px', textAlign: 'right' }}>
                    Target Delivery Date
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
                    <Calendar size={14} color="#94a3b8" />
                    {formatDate(shipment.expectedDeliveryDate)}
                  </div>
                </div>
              </div>

              {/* Status Update Action Box */}
              <form onSubmit={handleUpdateStatus} className="status-update-box">
                <div className="status-update-title">
                  <Activity size={16} />
                  <span>Advance Shipment Status (Append-Only Event)</span>
                </div>

                {successMsg && (
                  <div className="alert-banner success">
                    <CheckCircle size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Status *</label>
                    <select
                      className="form-select"
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as ShipmentStatus)}
                      required
                    >
                      {(Object.keys(STATUS_LABELS) as ShipmentStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Checkpoint / Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kathmandu Valley Hub"
                      value={updateLocation}
                      onChange={(e) => setUpdateLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Update Log Note</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Customs papers verified, container released for final delivery"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" disabled={updating}>
                    <Send size={14} />
                    {updating ? 'Recording Event...' : 'Record Status Transition'}
                  </button>
                </div>
              </form>

              {/* Status History Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="timeline-section-title">
                  <span>Audit Trail & Historical Events</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'none', fontWeight: 500 }}>
                    {shipment.history?.length || 0} recorded stage{(shipment.history?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                {shipment.history && shipment.history.length > 0 ? (
                  <div className="timeline-list">
                    {shipment.history.map((item, index) => (
                      <div
                        key={item.id}
                        className={`timeline-entry ${index === 0 ? 'latest' : ''}`}
                      >
                        <div className="timeline-dot" />

                        <div className="timeline-header">
                          <StatusBadge status={item.status} />
                          <div className="timeline-time">
                            {formatDateTime(item.changedAt)}
                          </div>
                        </div>

                        {item.location && (
                          <div className="timeline-location">
                            <MapPin size={13} color="#94a3b8" />
                            <span>{item.location}</span>
                          </div>
                        )}

                        {item.note && (
                          <div className="timeline-note">
                            {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '13px' }}>
                    No historical logs recorded yet.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

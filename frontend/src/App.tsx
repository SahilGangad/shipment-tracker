import { useState, useEffect, useMemo } from 'react';
import type { Shipment, CreateShipmentInput } from './types';
import { fetchShipments, createShipment } from './api';
import { StatusBadge } from './components/StatusBadge';
import { CreateShipmentModal } from './components/CreateShipmentModal';
import { ShipmentDetailModal } from './components/ShipmentDetailModal';
import {
  Package,
  Truck,
  CheckCircle2,
  Search,
  X,
  Plus,
  ArrowRight,
  Calendar,
  RefreshCw,
  Layers,
} from 'lucide-react';

export function App() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  // API Health state
  const [apiOnline, setApiOnline] = useState(true);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchShipments(searchQuery, selectedStatus);
      setShipments(data);
      setApiOnline(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend server');
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadShipments();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus]);

  // Overall metric counts calculated across all loaded or refetched items
  const stats = useMemo(() => {
    const total = shipments.length;
    const booked = shipments.filter((s) => s.currentStatus === 'BOOKED').length;
    const inTransit = shipments.filter((s) => s.currentStatus === 'IN_TRANSIT').length;
    const delivered = shipments.filter((s) => s.currentStatus === 'DELIVERED').length;
    return { total, booked, inTransit, delivered };
  }, [shipments]);

  const handleCreateShipment = async (input: CreateShipmentInput) => {
    await createShipment(input);
    await loadShipments();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const statusTabList: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Shipments' },
    { key: 'BOOKED', label: 'Booked' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'CUSTOMS_HOLD', label: 'Customs Hold' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-badge">
            NF
          </div>
          <div>
            <h1 className="brand-title">
              Nagarkot Forwarders <span>Tracker</span>
            </h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="health-badge">
            <span
              className="health-dot"
              style={{ background: apiOnline ? '#10b981' : '#ef4444' }}
            />
            {apiOnline ? 'Live API Connected' : 'API Disconnected'}
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsCreateOpen(true)}
            id="create-shipment-btn"
          >
            <Plus size={16} />
            <span>New Consignment</span>
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Records</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-icon" style={{ background: '#f1f5f9' }}>
            <Layers size={20} color="#0f172a" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Booked</span>
            <span className="stat-value" style={{ color: '#1d4ed8' }}>
              {stats.booked}
            </span>
          </div>
          <div className="stat-icon" style={{ background: '#eff6ff' }}>
            <Package size={20} color="#1d4ed8" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">In Transit</span>
            <span className="stat-value" style={{ color: '#b45309' }}>
              {stats.inTransit}
            </span>
          </div>
          <div className="stat-icon" style={{ background: '#fffbeb' }}>
            <Truck size={20} color="#b45309" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Delivered</span>
            <span className="stat-value" style={{ color: '#047857' }}>
              {stats.delivered}
            </span>
          </div>
          <div className="stat-icon" style={{ background: '#ecfdf5' }}>
            <CheckCircle2 size={20} color="#047857" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="filter-bar">
        <div className="filter-top-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reference #, origin city, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-shipments-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={loadShipments}
            title="Refresh List"
            aria-label="Refresh shipments list"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="status-tabs">
          {statusTabList.map((tab) => (
            <button
              key={tab.key}
              className={`status-tab ${selectedStatus === tab.key ? 'active' : ''}`}
              onClick={() => setSelectedStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading && shipments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ marginBottom: '12px' }} />
          <p>Querying Nagarkot logistics registry...</p>
        </div>
      ) : error ? (
        <div className="alert-banner error" style={{ margin: '20px 0' }}>
          <span>{error}</span>
          <button className="btn-secondary" onClick={loadShipments} style={{ marginLeft: 'auto' }}>
            Retry
          </button>
        </div>
      ) : shipments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Package size={28} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>No shipments found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '380px' }}>
            {searchQuery || selectedStatus !== 'ALL'
              ? 'No consignments match your current search filters. Try clearing filters or searching another keyword.'
              : 'No shipments registered in the database yet. Click "New Consignment" above to add one.'}
          </p>
          {(searchQuery || selectedStatus !== 'ALL') && (
            <button
              className="btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('ALL');
              }}
              style={{ marginTop: '8px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="shipments-grid">
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="shipment-card"
              onClick={() => setSelectedShipmentId(shipment.id)}
            >
              <div className="shipment-card-header">
                <div className="ref-block">
                  <span className="reference-number">{shipment.referenceNumber}</span>
                  {shipment._count && (
                    <span className="history-pill">
                      {shipment._count.history} stage{shipment._count.history === 1 ? '' : 's'} logged
                    </span>
                  )}
                </div>

                <StatusBadge status={shipment.currentStatus} />
              </div>

              {/* Route representation */}
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

              <div className="shipment-card-footer">
                <div className="delivery-date">
                  <Calendar size={13} color="#94a3b8" />
                  <span>Est. Delivery: {formatDate(shipment.expectedDeliveryDate)}</span>
                </div>

                <button className="view-details-btn">
                  <span>View Timeline & Update</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateShipmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateShipment}
      />

      <ShipmentDetailModal
        shipmentId={selectedShipmentId}
        onClose={() => setSelectedShipmentId(null)}
        onStatusUpdated={loadShipments}
      />
    </div>
  );
}

export default App;

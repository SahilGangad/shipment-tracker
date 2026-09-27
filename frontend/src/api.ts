import type { Shipment, StatusHistoryItem, CreateShipmentInput, UpdateStatusInput } from './types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function fetchShipments(query?: string, status?: string): Promise<Shipment[]> {
  const params = new URLSearchParams();
  if (query && query.trim()) params.append('q', query.trim());
  if (status && status !== 'ALL') params.append('status', status);

  const url = `${API_BASE}/api/shipments${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch shipments');
  }
  return data.data;
}

export async function fetchShipmentById(id: string): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/api/shipments/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch shipment details');
  }
  return data.data;
}

export async function fetchShipmentHistory(id: string): Promise<StatusHistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/shipments/${id}/history`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch shipment history');
  }
  return data.data;
}

export async function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/api/shipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create shipment');
  }
  return data.data;
}

export async function updateShipmentStatus(id: string, input: UpdateStatusInput): Promise<Shipment> {
  const res = await fetch(`${API_BASE}/api/shipments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update status');
  }
  return data.data;
}

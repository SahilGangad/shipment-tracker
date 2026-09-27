export type ShipmentStatus =
  | 'BOOKED'
  | 'IN_TRANSIT'
  | 'CUSTOMS_HOLD'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface StatusHistoryItem {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  changedAt: string;
  note?: string | null;
  location?: string | null;
}

export interface Shipment {
  id: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  expectedDeliveryDate: string;
  currentStatus: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    history: number;
  };
  history?: StatusHistoryItem[];
}

export interface CreateShipmentInput {
  referenceNumber: string;
  origin: string;
  destination: string;
  expectedDeliveryDate: string;
  initialStatus?: ShipmentStatus;
  note?: string;
  location?: string;
}

export interface UpdateStatusInput {
  status: ShipmentStatus;
  note?: string;
  location?: string;
}

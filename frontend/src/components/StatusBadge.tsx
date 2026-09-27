import type { ShipmentStatus } from '../types';
import {
  Package,
  Truck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Props {
  status: ShipmentStatus;
  showIcon?: boolean;
}

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  BOOKED: 'Booked',
  IN_TRANSIT: 'In Transit',
  CUSTOMS_HOLD: 'Customs Hold',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const StatusBadge: React.FC<Props> = ({ status, showIcon = true }) => {
  const getIcon = () => {
    switch (status) {
      case 'BOOKED':
        return <Package size={13} />;
      case 'IN_TRANSIT':
        return <Truck size={13} />;
      case 'CUSTOMS_HOLD':
        return <ShieldAlert size={13} />;
      case 'OUT_FOR_DELIVERY':
        return <Clock size={13} />;
      case 'DELIVERED':
        return <CheckCircle2 size={13} />;
      case 'CANCELLED':
        return <XCircle size={13} />;
      default:
        return <Package size={13} />;
    }
  };

  return (
    <span className={`status-badge ${status}`}>
      {showIcon && getIcon()}
      {STATUS_LABELS[status] || status}
    </span>
  );
};

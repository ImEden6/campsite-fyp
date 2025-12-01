import Badge from '@/components/ui/Badge';
import { PaymentStatus } from '../types/payment.types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  [PaymentStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [PaymentStatus.PROCESSING]: { label: 'Processing', variant: 'info' },
  [PaymentStatus.SUCCEEDED]: { label: 'Paid', variant: 'success' },
  [PaymentStatus.FAILED]: { label: 'Failed', variant: 'error' },
  [PaymentStatus.REFUNDED]: { label: 'Refunded', variant: 'default' },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    label: 'Partially Refunded',
    variant: 'warning',
  },
  [PaymentStatus.CANCELLED]: { label: 'Cancelled', variant: 'default' },
};

export const PaymentStatusBadge = ({
  status,
  className,
}: PaymentStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

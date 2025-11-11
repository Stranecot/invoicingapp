import { Badge } from '@/components/ui/badge';
import { OrgStatus } from '@invoice-app/database';

interface OrganizationStatusBadgeProps {
  status: OrgStatus;
}

export function OrganizationStatusBadge({ status }: OrganizationStatusBadgeProps) {
  const statusConfig = {
    ACTIVE: { variant: 'success' as const, label: 'Active' },
    TRIAL: { variant: 'info' as const, label: 'Trial' },
    SUSPENDED: { variant: 'warning' as const, label: 'Suspended' },
    CANCELLED: { variant: 'danger' as const, label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

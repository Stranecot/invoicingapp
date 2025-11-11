import { Badge } from '@/components/ui/badge';
import { BillingPlan } from '@invoice-app/database';

interface OrganizationPlanBadgeProps {
  plan: BillingPlan;
}

export function OrganizationPlanBadge({ plan }: OrganizationPlanBadgeProps) {
  const planConfig = {
    FREE: { variant: 'default' as const, label: 'Free' },
    PRO: { variant: 'info' as const, label: 'Pro' },
    ENTERPRISE: { variant: 'default' as const, label: 'Enterprise', className: 'bg-purple-100 text-purple-800' },
  };

  const config = planConfig[plan];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

import { Badge } from '@/components/ui/badge';
import type { Role } from '@invoice-app/database';

interface UserRoleBadgeProps {
  role: Role;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const getRoleConfig = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return {
          variant: 'danger' as const,
          label: 'Admin',
          className: 'bg-purple-100 text-purple-800',
        };
      case 'USER':
        return {
          variant: 'info' as const,
          label: 'User',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'ACCOUNTANT':
        return {
          variant: 'success' as const,
          label: 'Accountant',
          className: 'bg-green-100 text-green-800',
        };
      default:
        return {
          variant: 'default' as const,
          label: role,
          className: '',
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

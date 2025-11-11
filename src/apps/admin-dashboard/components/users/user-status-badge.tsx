import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  return (
    <Badge variant={isActive ? 'success' : 'default'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

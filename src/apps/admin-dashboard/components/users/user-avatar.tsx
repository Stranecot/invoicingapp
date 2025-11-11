import { Avatar } from '@/components/ui/avatar';

interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ name, imageUrl, size = 'md', className }: UserAvatarProps) {
  const fallback = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <Avatar
      src={imageUrl}
      alt={name || 'User'}
      fallback={fallback}
      size={size}
      className={className}
    />
  );
}

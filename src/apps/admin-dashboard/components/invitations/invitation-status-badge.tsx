'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  expiresAt?: Date | string;
}

export function InvitationStatusBadge({ status, expiresAt }: InvitationStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          variant: 'warning' as const,
          icon: Clock,
          label: 'Pending',
        };
      case 'ACCEPTED':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          label: 'Accepted',
        };
      case 'EXPIRED':
        return {
          variant: 'danger' as const,
          icon: XCircle,
          label: 'Expired',
        };
      case 'REVOKED':
        return {
          variant: 'default' as const,
          icon: Ban,
          label: 'Revoked',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Calculate time remaining for PENDING status
  let timeRemaining = '';
  if (status === 'PENDING' && expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        timeRemaining = `${days}d`;
      } else if (hours > 0) {
        timeRemaining = `${hours}h`;
      } else {
        timeRemaining = '<1h';
      }
    }
  }

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
      {timeRemaining && (
        <span className="ml-1 text-xs">({timeRemaining})</span>
      )}
    </Badge>
  );
}

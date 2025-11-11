'use client';

import React from 'react';
import { Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

interface InvitationStatusBadgeProps {
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  className?: string;
}

export function InvitationStatusBadge({ status, className = '' }: InvitationStatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-amber-100 text-amber-800 border border-amber-200',
      tooltip: 'Invitation sent and awaiting acceptance',
    },
    ACCEPTED: {
      label: 'Accepted',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border border-green-200',
      tooltip: 'Invitation has been accepted',
    },
    EXPIRED: {
      label: 'Expired',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border border-red-200',
      tooltip: 'Invitation has expired and can no longer be used',
    },
    REVOKED: {
      label: 'Revoked',
      icon: Ban,
      className: 'bg-gray-100 text-gray-800 border border-gray-200',
      tooltip: 'Invitation has been revoked by an administrator',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}
      title={config.tooltip}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}

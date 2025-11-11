'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyInvitationLinkButtonProps {
  token: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function CopyInvitationLinkButton({
  token,
  size = 'sm',
  variant = 'ghost',
  className = '',
}: CopyInvitationLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/accept-invitation?token=${token}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      title={copied ? 'Invitation link copied!' : 'Copy invitation link'}
      className={className}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1.5 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
        </>
      )}
    </Button>
  );
}

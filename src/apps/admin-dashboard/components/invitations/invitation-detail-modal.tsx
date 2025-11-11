'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvitationStatusBadge } from './invitation-status-badge';
import { Copy, Send, Ban, CheckCircle, Mail, Building2, User, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

interface InvitationDetail {
  id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
  accepter?: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvitationDetailModalProps {
  invitationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
}

export function InvitationDetailModal({
  invitationId,
  open,
  onOpenChange,
  onResend,
  onRevoke,
}: InvitationDetailModalProps) {
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && invitationId) {
      fetchInvitation();
    }
  }, [open, invitationId]);

  const fetchInvitation = async () => {
    if (!invitationId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invitation details');
      }
      const data = await response.json();
      setInvitation(data);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    if (!invitation) return;

    const acceptUrl = `${window.location.origin}/invitations/accept/${invitation.token}`;
    navigator.clipboard.writeText(acceptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = () => {
    if (!invitation) return;
    onResend(invitation.id);
    onOpenChange(false);
  };

  const handleRevoke = () => {
    if (!invitation) return;
    onRevoke(invitation.id);
    onOpenChange(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !invitation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader onClose={() => onOpenChange(false)}>
            <DialogTitle>Invitation Details</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="text-center py-8">
              <p className="text-red-600">{error || 'Invitation not found'}</p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const acceptUrl = `${window.location.origin}/invitations/accept/${invitation.token}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Invitation Details</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Status Section */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{invitation.email}</h3>
                <p className="text-sm text-gray-500 mt-1">Invitation ID: {invitation.id}</p>
              </div>
              <InvitationStatusBadge
                status={invitation.status}
                expiresAt={invitation.expiresAt}
              />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Organization */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Organization</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {invitation.organization.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{invitation.organization.slug}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                  <Badge variant="info" className="mt-1">
                    {invitation.role}
                  </Badge>
                </div>
              </div>

              {/* Invited By */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Invited By</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {invitation.inviter.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{invitation.inviter.email}</p>
                </div>
              </div>

              {/* Invited At */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Invited At</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(invitation.invitedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Expires At */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Expires At</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Accepted At (if accepted) */}
              {invitation.acceptedAt && invitation.accepter && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Accepted At</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {new Date(invitation.acceptedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      By {invitation.accepter.name || invitation.accepter.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Invitation Link */}
            {invitation.status === 'PENDING' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invitation Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={acceptUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyInvitationLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {(invitation.status === 'PENDING' || invitation.status === 'EXPIRED') && (
            <Button onClick={handleResend}>
              <Send className="w-4 h-4 mr-2" />
              Resend
            </Button>
          )}
          {invitation.status === 'PENDING' && (
            <Button variant="danger" onClick={handleRevoke}>
              <Ban className="w-4 h-4 mr-2" />
              Revoke
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Ban, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onResendAll: () => void;
  onRevokeAll: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onResendAll,
  onRevokeAll,
  onClearSelection,
  loading = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-semibold">
            {selectedCount}
          </div>
          <span className="font-medium">
            {selectedCount} invitation{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onResendAll}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            Resend All
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={onRevokeAll}
            disabled={loading}
          >
            <Ban className="w-4 h-4 mr-2" />
            Revoke All
          </Button>

          <button
            onClick={onClearSelection}
            disabled={loading}
            className="ml-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

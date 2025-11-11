'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function SyncUserButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ User synced successfully! Please refresh the page.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to sync'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleSync}
        disabled={loading}
        variant="secondary"
        size="sm"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing...' : 'Sync User to Database'}
      </Button>
      {message && (
        <p className={`text-sm ${message.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

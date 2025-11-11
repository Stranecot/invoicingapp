'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/sync-user', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'User synced successfully!');

        // Redirect to home after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to sync user');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Account Setup Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto" />
            <p className="text-gray-700">
              Your account needs to be synced to the database before you can use the app.
            </p>
            <p className="text-sm text-gray-600">
              Click the button below to complete the setup.
            </p>
          </div>

          <Button
            onClick={handleSync}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync My Account'}
          </Button>

          {status === 'success' && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{message}</p>
                <p className="text-xs text-green-700 mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-700 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-xs text-red-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-600 text-center space-y-1">
            <p>This is a one-time setup process.</p>
            <p>Your user account will be created in the local database.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

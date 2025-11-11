'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

type InvitationData = {
  email: string;
  organizationName: string;
  role: string;
  expiresAt: string;
};

type VerifyResponse =
  | { valid: true; invitation: InvitationData }
  | { valid: false; reason: 'expired' | 'not_found' | 'already_used' | 'revoked' };

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }

    // Verify the invitation token
    const verifyInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/accept/verify?token=${encodeURIComponent(token)}`);
        const data: VerifyResponse = await response.json();

        if (response.status === 429) {
          setError('Too many requests. Please try again in a minute.');
          setLoading(false);
          return;
        }

        if (data.valid) {
          setInvitationData(data.invitation);
        } else {
          // Handle different error reasons
          switch (data.reason) {
            case 'expired':
              setError('This invitation has expired. Please contact your administrator for a new invitation.');
              break;
            case 'already_used':
              setError('This invitation has already been used. If you have an account, please sign in.');
              break;
            case 'revoked':
              setError('This invitation has been revoked. Please contact your administrator.');
              break;
            case 'not_found':
            default:
              setError('This invitation is not valid. Please check your invitation link.');
              break;
          }
        }
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('An error occurred while verifying your invitation. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to Clerk sign-up with pre-filled email
        window.location.href = data.redirectUrl;
      } else {
        // Handle error
        switch (data.reason) {
          case 'expired':
            setError('This invitation has expired. Please contact your administrator for a new invitation.');
            break;
          case 'already_used':
            setError('This invitation has already been used. If you have an account, please sign in.');
            break;
          case 'revoked':
            setError('This invitation has been revoked. Please contact your administrator.');
            break;
          case 'not_found':
          default:
            setError('This invitation is not valid. Please check your invitation link.');
            break;
        }
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An error occurred while accepting your invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'ACCOUNTANT':
        return 'Accountant';
      case 'USER':
        return 'User';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Verifying your invitation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Invalid Invitation</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/sign-in')}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">You&apos;re Invited!</h2>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ve been invited to join an organization
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Organization</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">{invitationData.organizationName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{invitationData.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getRoleName(invitationData.role)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Expires</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDistanceToNow(new Date(invitationData.expiresAt), { addSuffix: true })}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs text-blue-800">
                By accepting this invitation, you&apos;ll be redirected to create your account. Your email address will be pre-filled.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                'Accept Invitation'
              )}
            </button>
            <button
              onClick={() => router.push('/sign-in')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              I Already Have an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

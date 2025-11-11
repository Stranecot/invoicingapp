'use client';

import { Suspense, useEffect, useState } from 'react';
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

function AcceptInvitationContent() {
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Full access to manage the organization';
      case 'ACCOUNTANT':
        return 'Access to invoices, expenses, and financial reports';
      case 'USER':
        return 'Basic access to view and create invoices';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Verifying Invitation</h2>
              <p className="mt-2 text-sm text-gray-600">Please wait while we verify your invitation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Invalid Invitation</h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{error}</p>

              <div className="mt-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-xs text-gray-600">
                  If you believe this is an error, please contact your organization administrator
                  to request a new invitation.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/sign-in')}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(invitationData.expiresAt);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">You&apos;re Invited!</h2>
            <p className="mt-2 text-sm text-gray-600">
              You&apos;ve been invited to join an organization
            </p>
          </div>

          {/* Invitation Details */}
          <div className="mt-8 space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white p-6 border border-gray-200 shadow-sm">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</dt>
                  <dd className="mt-1.5 text-lg font-bold text-gray-900">{invitationData.organizationName}</dd>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</dt>
                  <dd className="mt-1.5 text-sm text-gray-900 font-medium">{invitationData.email}</dd>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</dt>
                  <dd className="mt-1.5">
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        {getRoleName(invitationData.role)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">{getRoleDescription(invitationData.role)}</p>
                  </dd>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invitation Expires</dt>
                  <dd className="mt-1.5">
                    <div className="flex items-center text-sm text-gray-900 font-medium">
                      <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDistanceToNow(expiresAt, { addSuffix: true })}
                    </div>
                    {daysUntilExpiry <= 3 && daysUntilExpiry > 0 && (
                      <p className="mt-1 text-xs text-orange-600 font-medium">
                        Expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
                      </p>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Information Box */}
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-blue-900">What happens next?</h3>
                  <div className="mt-2 text-xs text-blue-800 space-y-1">
                    <p>1. Click &quot;Accept Invitation&quot; below</p>
                    <p>2. Create your account with the pre-filled email</p>
                    <p>3. Start collaborating with your team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full flex justify-center items-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {accepting ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Accept Invitation
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/sign-in')}
              disabled={accepting}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              I Already Have an Account
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By accepting, you agree to create an account with this organization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Loading</h2>
                <p className="mt-2 text-sm text-gray-600">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}

import { cookies } from 'next/headers';

/**
 * Cookie configuration for invitation tokens
 */
const INVITATION_COOKIE_NAME = 'invitation_token';

/**
 * Store an invitation token in a secure HTTP-only cookie
 * The cookie will expire at the same time as the invitation
 *
 * @param token - The invitation token to store
 * @param expiresAt - The invitation expiration date
 */
export async function setInvitationCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(INVITATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Retrieve the invitation token from the cookie
 *
 * @returns The invitation token if it exists, null otherwise
 */
export async function getInvitationCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(INVITATION_COOKIE_NAME);

  return cookie?.value ?? null;
}

/**
 * Clear the invitation token cookie
 */
export async function clearInvitationCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INVITATION_COOKIE_NAME);
}

/**
 * Validate that a token is a properly formatted invitation token
 * Expected format: base64url string from 32 random bytes
 *
 * @param token - The token to validate
 * @returns true if the token format is valid, false otherwise
 */
export function isValidTokenFormat(token: string): boolean {
  // Base64url tokens from 32 bytes should be 43 characters
  // Allow some flexibility for different byte lengths
  return typeof token === 'string' && token.length >= 32 && token.length <= 64 && /^[A-Za-z0-9_-]+$/.test(token);
}
